const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { get, run } = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail, sendAdminQuestionAlert } = require('../utils/email');
const { getCourseById } = require('../utils/courses');
const { notifyAdminNewPurchase, buildCustomerWaUrl, buildForgotPasswordWaUrl } = require('../utils/whatsapp');

// Check if user is logged in (for static landing page)
router.get('/me', async (req, res) => {
  if (req.session && req.session.userId) {
    const user = await get('SELECT name, email FROM users WHERE id = ?', [req.session.userId]);
    if (user) return res.json({ loggedIn: true, name: user.name, email: user.email });
  }
  res.json({ loggedIn: false });
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < length; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

// CREATE ORDER
router.post('/create-order', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'All fields are required' });

    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'This email is already registered. Please login instead.' });

    const order = await razorpay.orders.create({
      amount: 99900, currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: { name, email, phone },
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// VERIFY PAYMENT
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, email, phone } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ error: 'Payment verification failed' });

    const plainPassword = generatePassword();
    const hash = bcrypt.hashSync(plainPassword, 10);

    const result = await run('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)', [name, email, phone, hash]);
    const userId = result.lastInsertRowid;

    await run('INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, status) VALUES (?, ?, ?, ?, ?)',
      [userId, razorpay_order_id, razorpay_payment_id, razorpay_signature, 'paid']);

    // Generate one-time login token for auto-login on thankyou page
    const loginToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await run('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', [loginToken, tokenExpiry, userId]);
    console.log('[AUTO-LOGIN] Token generated for user', email);

    // Send email with retry (3 attempts, exponential backoff) + WhatsApp fallback
    (async () => {
      let emailSent = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[EMAIL] Attempt ${attempt}/3 for ${email}`);
          await sendWelcomeEmail(name, email, plainPassword);
          console.log(`[EMAIL] ✅ Welcome email sent to ${email} on attempt ${attempt}`);
          emailSent = true;
          break;
        } catch (e) {
          console.error(`[EMAIL] ❌ Attempt ${attempt} failed:`, e.message);
          if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
        }
      }
      if (!emailSent) {
        console.error(`[EMAIL] ALL 3 ATTEMPTS FAILED for ${email} — triggering WhatsApp fallback`);
        await notifyAdminNewPurchase(name, email, phone, plainPassword);
      }
    })();

    // Auto-login: set session so user is logged in immediately
    req.session.userId = userId;
    req.session.userName = name;
    req.session.userEmail = email;

    const customerPhone = '91' + phone.replace(/\D/g, '').slice(-10);
    const waUrl = buildCustomerWaUrl(name, customerPhone, email, plainPassword);

    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      res.json({
        success: true,
        loginToken,
        customerPassword: plainPassword,
        whatsappUrl: waUrl,
      });
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed. Contact support.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Admin login: check against env vars directly
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.userId = 0;
    req.session.userName = 'Admin';
    req.session.userEmail = email;
    req.session.isAdmin = true;
    console.log('[LOGIN] ✅ Admin logged in via env credentials');
    return req.session.save(() => res.redirect('/dashboard'));
  }

  // Regular user login: check DB
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render('login', { title: 'Login', error: 'Invalid email or password.' });
  }

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userEmail = user.email;

  return req.session.save(() => res.redirect('/dashboard'));
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);

  const successMsg = 'If this email exists, a reset link has been sent.';
  if (!user) return res.render('forgot-password', { title: 'Forgot Password', message: successMsg, error: null });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000).toISOString();
  await run('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', [token, expires, user.id]);

  const resetUrl = `${process.env.SITE_URL || 'https://cheflesscafe.onrender.com'}/reset-password/${token}`;
  let resetEmailSent = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[EMAIL] Reset attempt ${attempt}/3 for ${email}`);
      await sendPasswordResetEmail(email, resetUrl);
      console.log(`[EMAIL] ✅ Reset email sent to ${email}`);
      resetEmailSent = true;
      break;
    } catch (e) {
      console.error(`[EMAIL] ❌ Reset attempt ${attempt} failed:`, e.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }

  if (resetEmailSent) {
    return res.render('forgot-password', {
      title: 'Forgot Password',
      message: 'Password reset link sent. Check your email (and spam folder).',
      error: null,
      waFallbackUrl: null,
    });
  }

  const waFallbackUrl = buildForgotPasswordWaUrl(resetUrl);
  console.error(`[EMAIL] Reset email failed for ${email} — showing WhatsApp fallback`);
  res.render('forgot-password', {
    title: 'Forgot Password',
    message: null,
    error: 'Email delivery failed. Please contact us on WhatsApp to get your reset link.',
    waFallbackUrl,
  });
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (password !== confirmPassword) return res.render('reset-password', { title: 'Reset Password', token, error: 'Passwords do not match.' });
  if (password.length < 6) return res.render('reset-password', { title: 'Reset Password', token, error: 'Min 6 characters.' });

  const user = await get('SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()', [token]);
  if (!user) return res.render('forgot-password', { title: 'Forgot Password', message: null, error: 'Invalid or expired link.' });

  const hash = bcrypt.hashSync(password, 10);
  await run('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hash, user.id]);

  res.render('login', { title: 'Login', error: null, success: 'Password reset successful! Please login.' });
});

// MARK COMPLETE
router.post('/mark-complete', requireAuth, async (req, res) => {
  const { courseId } = req.body;
  const existing = await get('SELECT id FROM progress WHERE user_id = ? AND course_id = ?', [req.session.userId, courseId]);
  if (existing) {
    await run('UPDATE progress SET completed = 1, completed_at = NOW() WHERE user_id = ? AND course_id = ?', [req.session.userId, courseId]);
  } else {
    await run('INSERT INTO progress (user_id, course_id, completed, completed_at) VALUES (?, ?, 1, NOW())', [req.session.userId, courseId]);
  }
  res.json({ success: true });
});

// SUBMIT QUESTION
router.post('/question', requireAuth, async (req, res) => {
  const { courseId, question } = req.body;
  if (!question || !question.trim()) return res.status(400).json({ error: 'Question required' });

  await run('INSERT INTO questions (user_id, course_id, question) VALUES (?, ?, ?)', [req.session.userId, courseId, question.trim()]);

  try {
    const course = getCourseById(courseId);
    await sendAdminQuestionAlert(req.session.userName, course ? course.name : 'Unknown', question);
  } catch (e) { console.error('Notification error:', e); }

  res.json({ success: true });
});

// SAVINGS CALCULATOR
router.post('/calculate', (req, res) => {
  const COURSE_PRICE = 999;
  const { numChefs, chefSalary, numStaff, staffSalary } = req.body;

  const nc = parseInt(numChefs);
  const cs = parseInt(chefSalary);
  const ns = parseInt(numStaff);
  const ss = parseInt(staffSalary);

  if (!nc || !cs || !ns || !ss || nc < 1 || cs < 0 || ns < 1 || ss < 0) {
    return res.status(400).json({ error: 'Please fill all fields with valid numbers.' });
  }

  const currentMonthly  = nc * cs;
  const futureMonthly   = ns * ss;
  const monthlySaving   = Math.max(0, currentMonthly - futureMonthly);
  const yearlySaving    = monthlySaving * 12;
  const year1Profit     = yearlySaving - COURSE_PRICE;
  const roi             = COURSE_PRICE > 0 ? Math.round((yearlySaving / COURSE_PRICE) * 100) : 0;

  res.json({
    currentMonthly,
    futureMonthly,
    monthlySaving,
    yearlySaving,
    year1Profit,
    roi,
    coursePrice: COURSE_PRICE,
    currentDesc : `${nc} chef${nc > 1 ? 's' : ''} × ₹${cs.toLocaleString('en-IN')}/mo`,
    futureDesc  : `${ns} staff × ₹${ss.toLocaleString('en-IN')}/mo`,
  });
});

module.exports = router;
