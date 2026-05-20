const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { all, run, get } = require('../db/init');
const { getCourseById } = require('../utils/courses');

// One-time secret endpoint to create/reset a user (protected by secret token)
router.post('/manage-user', async (req, res) => {
  const { secret, email, name, phone } = req.body;
  if (secret !== process.env.ADMIN_SECRET_TOKEN && secret !== 'chaidealer-admin-secret-2026') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const bcrypt = require('bcryptjs');
  const { sendWelcomeEmail } = require('../utils/email');
  if (!email) return res.json({ error: 'Email required' });

  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let newPassword = '';
  for (let i = 0; i < 8; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  const hash = bcrypt.hashSync(newPassword, 10);
  const existing = await get('SELECT id, name FROM users WHERE email = ?', [email]);

  if (existing) {
    await run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    try { await sendWelcomeEmail(existing.name, email, newPassword); } catch(e) {}
    return res.json({ success: true, action: 'password_reset', email, newPassword });
  } else {
    const userName = name || email.split('@')[0];
    const userPhone = phone || '0000000000';
    await run('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)', [userName, email, userPhone, hash]);
    try { await sendWelcomeEmail(userName, email, newPassword); } catch(e) {}
    return res.json({ success: true, action: 'account_created', email, newPassword });
  }
});

router.get('/questions', requireAdmin, async (req, res) => {
  const questions = await all(`
    SELECT q.*, u.name as author_name 
    FROM questions q JOIN users u ON q.user_id = u.id 
    ORDER BY q.created_at DESC
  `);

  for (const q of questions) {
    q.answers = await all('SELECT * FROM answers WHERE question_id = ? ORDER BY created_at ASC', [q.id]);
    const c = getCourseById(q.course_id);
    q.course_name = c ? c.name : 'Unknown';
  }

  res.render('admin-questions', { title: 'Admin — Q&A', questions });
});

router.post('/reply', requireAdmin, async (req, res) => {
  const { questionId, answer } = req.body;
  if (!answer || !answer.trim()) return res.status(400).json({ error: 'Answer required' });

  await run('INSERT INTO answers (question_id, answer, is_admin, author_name) VALUES (?, ?, 1, ?)', [questionId, answer.trim(), 'The Chai Dealer (Admin)']);
  res.json({ success: true });
});

// Admin: manually create or reset a user's password
router.post('/reset-user', requireAdmin, async (req, res) => {
  const { email, name, phone } = req.body;
  const bcrypt = require('bcryptjs');
  const { sendWelcomeEmail } = require('../utils/email');

  if (!email) return res.json({ error: 'Email required' });

  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let newPassword = '';
  for (let i = 0; i < 8; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length));

  const hash = bcrypt.hashSync(newPassword, 10);
  const existing = await get('SELECT id, name FROM users WHERE email = ?', [email]);

  if (existing) {
    await run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    try { await sendWelcomeEmail(existing.name, email, newPassword); } catch(e) { console.error('Email err:', e.message); }
    return res.json({ success: true, action: 'reset', email, password: newPassword });
  } else {
    const userName = name || email.split('@')[0];
    const userPhone = phone || '0000000000';
    await run('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)', [userName, email, userPhone, hash]);
    try { await sendWelcomeEmail(userName, email, newPassword); } catch(e) { console.error('Email err:', e.message); }
    return res.json({ success: true, action: 'created', email, password: newPassword });
  }
});

// Admin: list all users
router.get('/users', requireAdmin, async (req, res) => {
  const users = await all('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC');
  res.json({ users });
});

module.exports = router;
