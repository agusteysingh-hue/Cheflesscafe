// Run this AFTER deploy is complete to reset Priyansh's account
// node fix-user.js

require('dotenv').config();
const https = require('https');

// Use your admin session — first login as admin
// Then call the reset endpoint
const body = JSON.stringify({
  email: 'priyanshuk1400@gmail.com',
  name: 'Priyansh',
  phone: '0000000000'
});

// NOTE: This needs an admin session cookie to work
// Instead, let's test via the direct forgot-password flow
// which will now work with the email fix deployed

const req = https.request({
  hostname: 'courses.thechaidealer.com',
  path: '/api/forgot-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength('email=priyanshuk1400%40gmail.com')
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    if (d.includes('reset link') || d.includes('sent')) {
      console.log('✅ Reset email triggered — check priyanshuk1400@gmail.com');
    } else {
      console.log('User may not exist in live DB yet');
      console.log('Response snippet:', d.slice(200, 400));
    }
  });
});
req.on('error', e => console.log('ERROR:', e.message));
req.write('email=priyanshuk1400%40gmail.com');
req.end();
