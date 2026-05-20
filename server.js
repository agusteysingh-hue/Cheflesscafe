require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { getDb } = require('./db/init');
const { addUserToLocals } = require('./middleware/auth');
const pageRoutes = require('./routes/pages');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const isProduction = !!process.env.RENDER;

// Trust Render's reverse proxy so secure cookies work
if (isProduction) app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction,       // HTTPS only in prod
    sameSite: isProduction ? 'lax' : false,
  }
}));

app.use(addUserToLocals);

// Routes
app.use('/', pageRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// 404 handler — must be before error handler
app.use((req, res) => {
  res.status(404).render('error', { title: '404 Not Found', message: 'Page not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack || err);
  try {
    res.status(500).render('error', { title: 'Error', message: 'Something went wrong. Please try again.' });
  } catch (renderErr) {
    console.error('Error renderer failed:', renderErr);
    res.status(500).send('Internal Server Error — please try again later.');
  }
});

// Initialize DB then start server
(async () => {
  await getDb();
  const { verifyTransporter } = require('./utils/email');
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   CHEFLESS CAFE PLATFORM — RUNNING           ║');
    console.log(`║   http://localhost:${PORT}                       ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    // Check SMTP on startup — result appears in Railway logs
    verifyTransporter();
  });
})();
