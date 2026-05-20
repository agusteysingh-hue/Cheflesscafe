const https = require('https');
const http = require('http');

/**
 * Send a WhatsApp message using CallMeBot API (free)
 * NOTE: This sends to the ADMIN phone to notify them of a new user
 * so they can manually send credentials if email failed.
 * 
 * Also builds a wa.me URL for the customer to save their own credentials.
 */

const ADMIN_PHONE = process.env.WHATSAPP_PHONE || '917042401496'; // admin number

/**
 * Notify ADMIN via WhatsApp when a new purchase happens
 * (especially useful as email-fail fallback)
 */
async function notifyAdminNewPurchase(name, email, phone, password) {
  const message = 
    `🔔 *NEW PURCHASE — Action Required*\n\n` +
    `👤 Name: ${name}\n` +
    `📧 Email: ${email}\n` +
    `📱 Phone: ${phone}\n` +
    `🔑 Password: ${password}\n\n` +
    `⚠️ Email delivery may have failed. Please send credentials to customer on WhatsApp:\n` +
    `wa.me/91${phone.replace(/\D/g, '').slice(-10)}\n\n` +
    `Message to send:\n` +
    `---\n` +
    `🎉 *Chefless Cafe Menu System*\n` +
    `Hi ${name}! Your payment is confirmed.\n` +
    `🔗 Login: https://courses.thechaidealer.com/login\n` +
    `📧 Email: ${email}\n` +
    `🔑 Password: ${password}\n` +
    `---`;

  try {
    // Use CallMeBot free WhatsApp API
    const apiKey = process.env.CALLMEBOT_API_KEY;
    if (!apiKey) {
      console.log('[WA-ADMIN] No CallMeBot API key — skipping admin WA notification');
      return false;
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    
    await fetchUrl(url);
    console.log('[WA-ADMIN] ✅ Admin WhatsApp notification sent');
    return true;
  } catch (e) {
    console.error('[WA-ADMIN] ❌ Failed:', e.message);
    return false;
  }
}

/**
 * Build a wa.me URL for the customer to receive their own credentials
 * (they click it on the thank-you page)
 */
function buildCustomerWaUrl(name, phone, email, password) {
  const siteUrl = 'https://courses.thechaidealer.com';
  const message = 
    `🎉 *You're In! Chefless Cafe Menu System*\n\n` +
    `Hi ${name}, your payment is confirmed. Here are your login details:\n\n` +
    `🔗 Login: ${siteUrl}/login\n` +
    `📧 Email: ${email}\n` +
    `🔑 Password: ${password}\n\n` +
    `Login and start watching all 19 SOP recipe videos anytime, on any device.\n\n` +
    `All the best for your cafe journey! ☕🍵\n\n` +
    `— The Chai Dealer\n📞 +91 7042401496`;

  const customerPhone = '91' + phone.replace(/\D/g, '').slice(-10);
  return `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Build a wa.me URL for forgot-password fallback
 */
function buildForgotPasswordWaUrl(resetUrl) {
  const adminPhone = ADMIN_PHONE;
  const message = 
    `🔑 *Password Reset Request*\n\n` +
    `I need help resetting my password for Chefless Cafe Menu System.\n` +
    `Please send me a reset link.\n\n` +
    `Email used at signup: [my email]`;

  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

module.exports = { notifyAdminNewPurchase, buildCustomerWaUrl, buildForgotPasswordWaUrl };
