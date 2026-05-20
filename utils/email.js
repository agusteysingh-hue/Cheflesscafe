const nodemailer = require('nodemailer');

// Log SMTP config at module load (masks password)
console.log('[EMAIL] SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_EMAIL,
  passSet: !!process.env.SMTP_PASSWORD,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 20000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log('[EMAIL] ✅ SMTP connection verified — emails will work');
    return true;
  } catch (e) {
    console.error('[EMAIL] ❌ SMTP verification FAILED:', e.message);
    return false;
  }
}

async function sendWelcomeEmail(name, email, password) {
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0A07;color:#F0E6CC;padding:40px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="font-family:serif;color:#E8921A;font-size:28px;margin:0;">The Chai Dealer</h1>
        <p style="color:#7A6E5C;font-size:13px;margin:4px 0 0;">Chefless Cafe Menu System</p>
      </div>
      <div style="background:#161310;border:1px solid rgba(232,146,26,0.15);border-radius:12px;padding:30px;">
        <h2 style="color:#FFB347;margin:0 0 16px;">Welcome, ${name}! 🎉</h2>
        <p style="line-height:1.7;margin:0 0 20px;">Your payment was successful! You now have <strong style="color:#E8921A;">lifetime access</strong> to all 19 SOP video recipes.</p>
        <div style="background:#201D17;border-radius:10px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 12px;color:#7A6E5C;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Your Login Credentials</p>
          <p style="margin:6px 0;"><strong style="color:#E8921A;">Email:</strong> <span style="color:#F0E6CC;">${email}</span></p>
          <p style="margin:6px 0;"><strong style="color:#E8921A;">Password:</strong> <span style="color:#F0E6CC;background:#2A2620;padding:4px 10px;border-radius:6px;font-family:monospace;">${password}</span></p>
        </div>
        <p style="line-height:1.7;margin:0 0 24px;color:#DDD0B3;">Login at <a href="https://courses.thechaidealer.com/login" style="color:#E8921A;">https://courses.thechaidealer.com/login</a> and start training your staff today!</p>
        <div style="text-align:center;">
          <a href="https://courses.thechaidealer.com/login" style="display:inline-block;background:linear-gradient(135deg,#E8921A,#B86F0A);color:#0C0A07;font-weight:900;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:16px;">Start Learning →</a>
        </div>
      </div>
      <p style="text-align:center;color:#5A5244;font-size:12px;margin:24px 0 0;">© 2026 The Chai Dealer · tcd@thechaidealer.com</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"The Chai Dealer" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: '🎉 Welcome to Chefless Cafe Menu System — Your Login Details',
    html,
  });
}

async function sendPasswordResetEmail(email, resetUrl) {
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0A07;color:#F0E6CC;padding:40px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="font-family:serif;color:#E8921A;font-size:28px;margin:0;">The Chai Dealer</h1>
      </div>
      <div style="background:#161310;border:1px solid rgba(232,146,26,0.15);border-radius:12px;padding:30px;">
        <h2 style="color:#FFB347;margin:0 0 16px;">Password Reset Request</h2>
        <p style="line-height:1.7;margin:0 0 20px;">You requested a password reset. Click below to set a new password:</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#E8921A,#B86F0A);color:#0C0A07;font-weight:900;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:16px;">Reset Password →</a>
        </div>
        <p style="color:#7A6E5C;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"The Chai Dealer" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: '🔑 Reset Your Password — The Chai Dealer',
    html,
  });
}

async function sendAdminQuestionAlert(userName, courseName, question) {
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#E8921A;">New Q&A Question</h2>
      <p><strong>From:</strong> ${userName}</p>
      <p><strong>Course:</strong> ${courseName}</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;border-left:4px solid #E8921A;">
        <p style="margin:0;">${question}</p>
      </div>
      <p style="margin-top:16px;"><a href="https://courses.thechaidealer.com/admin/questions" style="color:#E8921A;">Reply in Admin Panel →</a></p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Course Platform" <${process.env.SMTP_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `❓ New Question: ${courseName} — from ${userName}`,
    html,
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendAdminQuestionAlert, verifyTransporter };
