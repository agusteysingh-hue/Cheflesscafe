const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { get, all, run } = require('../db/init');
const { getCourseById, getCoursesByCategory, getCategoryOrder, courses } = require('../utils/courses');

// Landing page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Reviews page
router.get('/reviews', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'reviews.html'));
});

// SEO Blog articles
router.get('/blog/how-to-run-cafe-without-chef-india', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'blog', 'how-to-run-cafe-without-chef-india.html'));
});
router.get('/blog/how-to-train-kitchen-staff-india', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'blog', 'how-to-train-kitchen-staff-india.html'));
});
router.get('/blog/cloud-kitchen-without-chef-india', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'blog', 'cloud-kitchen-without-chef-india.html'));
});

// Sitemap
router.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, '..', 'public', 'sitemap.xml'));
});

// Checkout
router.get('/checkout', (req, res) => {
  res.render('checkout', { title: 'Checkout — Chefless Cafe Menu System', razorpayKey: process.env.RAZORPAY_KEY_ID });
});

// Thank you — with auto-login via one-time token
router.get('/thankyou', async (req, res) => {
  const token = req.query.token;
  if (token) {
    const user = await get('SELECT id, name, email FROM users WHERE reset_token = ? AND reset_expires > NOW()', [token]);
    if (user) {
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      await run('UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE id = ?', [user.id]);
      console.log('[AUTO-LOGIN] ✅ User auto-logged in:', user.email);
      return req.session.save((err) => {
        if (err) console.error('[AUTO-LOGIN] Session save error:', err);
        res.render('thankyou', { title: 'Thank You! — The Chai Dealer' });
      });
    } else {
      console.log('[AUTO-LOGIN] ⚠ Invalid or expired token');
    }
  }
  res.render('thankyou', { title: 'Thank You! — The Chai Dealer' });
});

// Login
router.get('/login', (req, res) => {
  if (req.session && req.session.userId != null) return res.redirect('/dashboard');
  res.render('login', { title: 'Login — The Chai Dealer', error: null });
});

// Forgot password
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: 'Forgot Password — The Chai Dealer', message: null, error: null, waFallbackUrl: null });
});

// Reset password
router.get('/reset-password/:token', async (req, res) => {
  const user = await get('SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()', [req.params.token]);
  if (!user) {
    return res.render('forgot-password', { title: 'Forgot Password', message: null, error: 'Invalid or expired reset link. Please request a new one.' });
  }
  res.render('reset-password', { title: 'Reset Password — The Chai Dealer', token: req.params.token, error: null });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  if (req.session.isAdmin) {
    const { courses } = require('../utils/courses');
    return res.render('dashboard', {
      title: 'Admin Dashboard — The Chai Dealer',
      userName: 'Admin',
      completedCount: 0,
      totalCourses: courses.length,
      progressPercent: 0,
      courses,
    });
  }

  const user = await get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
  if (!user) return res.redirect('/login');

  const countRow = await get('SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND completed = 1', [req.session.userId]);
  const completedCount = countRow ? parseInt(countRow.count) : 0;
  const { courses } = require('../utils/courses');
  const totalCourses = courses.length;
  const progressPercent = Math.round((completedCount / totalCourses) * 100);

  res.render('dashboard', {
    title: 'Dashboard — The Chai Dealer', userName: user.name,
    completedCount, totalCourses, progressPercent, courses,
  });
});

// Courses list
router.get('/courses', requireAuth, async (req, res) => {
  const categorized = getCoursesByCategory();
  const categoryOrder = getCategoryOrder();
  const completedRows = req.session.isAdmin ? [] :
    await all('SELECT course_id FROM progress WHERE user_id = ? AND completed = 1', [req.session.userId]);
  const completed = completedRows.map(r => r.course_id);

  res.render('courses', { title: 'All Courses — The Chai Dealer', categorized, categoryOrder, completed });
});

// Course detail
router.get('/course/:id', requireAuth, async (req, res) => {
  const course = getCourseById(req.params.id);
  if (!course) return res.status(404).render('error', { title: '404', message: 'Course not found.' });

  const prog = await get('SELECT completed FROM progress WHERE user_id = ? AND course_id = ?', [req.session.userId, course.id]);
  const questions = await all(`
    SELECT q.*, u.name as author_name FROM questions q 
    JOIN users u ON q.user_id = u.id 
    WHERE q.course_id = ? 
    ORDER BY q.created_at DESC
  `, [course.id]);

  for (const q of questions) {
    q.answers = await all('SELECT * FROM answers WHERE question_id = ? ORDER BY created_at ASC', [q.id]);
  }

  const idx = courses.findIndex(c => c.id === course.id);
  const prev = idx > 0 ? courses[idx - 1] : null;
  const next = idx < courses.length - 1 ? courses[idx + 1] : null;

  res.render('course-detail', {
    title: `${course.name} — The Chai Dealer`, course,
    isCompleted: prog && prog.completed === 1, questions, prev, next,
    coursesByCategory: getCoursesByCategory(),
    categoryOrder: getCategoryOrder(),
  });
});

module.exports = router;
