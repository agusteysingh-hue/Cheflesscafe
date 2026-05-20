const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'tcd@thechaidealer.com', pass: 'fkyy xgug enzl gjpq' },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

console.log('Testing SMTP connection to smtp.gmail.com:587...');

transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection verified!');
    return transporter.sendMail({
      from: '"The Chai Dealer" <tcd@thechaidealer.com>',
      to: 'priyanshuk1400@gmail.com',
      subject: '✅ SMTP Test — Chefless Cafe Platform',
      html: '<h2 style="color:#E8921A;">SMTP is working!</h2><p>This is a test email from the Chefless Cafe platform at courses.thechaidealer.com</p>',
    });
  })
  .then(info => {
    console.log('✅ EMAIL SENT! Message ID:', info.messageId);
    console.log('Response:', info.response);
  })
  .catch(err => {
    console.log('❌ FAILED:', err.message);
    console.log('Full error:', err);
  });
