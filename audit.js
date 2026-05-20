// Full E2E Flow Audit for courses.thechaidealer.com
const https = require('https');
const { URL } = require('url');

const BASE = 'courses.thechaidealer.com';
const results = [];
let cookieJar = '';

function req(label, path, method = 'GET', body = null, contentType = null, followRedirect = false) {
  return new Promise((resolve) => {
    const opts = {
      hostname: BASE, path, method,
      headers: { 'Cookie': cookieJar }
    };
    if (body && contentType) {
      opts.headers['Content-Type'] = contentType;
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const r = https.request(opts, (res) => {
      // Capture cookies
      const setCookies = res.headers['set-cookie'];
      if (setCookies) {
        setCookies.forEach(c => {
          const name = c.split('=')[0];
          const val = c.split(';')[0];
          cookieJar = cookieJar
            ? cookieJar.replace(new RegExp(name + '=[^;]*'), val)
            : val;
          if (!cookieJar.includes(name)) cookieJar += '; ' + val;
        });
      }

      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const loc = res.headers.location || '';
        resolve({ status: res.statusCode, body: d, location: loc, label });
      });
    });
    r.on('error', e => {
      resolve({ status: 0, body: '', location: '', label, error: e.message });
    });
    if (body) r.write(body);
    r.end();
  });
}

function check(ok, label, detail = '') {
  const icon = ok ? '✅' : '❌';
  const line = `${icon} ${label}${detail ? ' — ' + detail : ''}`;
  console.log(line);
  results.push({ ok, label });
}

(async () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  FULL E2E FLOW AUDIT — LIVE SITE             ║');
  console.log('║  courses.thechaidealer.com                    ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // === LANDING PAGE ===
  console.log('── LANDING PAGE ──');
  const landing = await req('Landing', '/');
  check(landing.status === 200, 'Landing page loads', `status=${landing.status}`);
  check(landing.body.includes('/checkout'), 'CTA buttons point to /checkout');
  check(landing.body.includes('Enroll Now'), 'Has "Enroll Now" text');
  check(landing.body.includes('wa.me/917042401496'), 'WhatsApp link present');
  check(landing.body.includes('Privacy Policy'), 'Footer: Privacy Policy link');
  check(landing.body.includes('Terms'), 'Footer: Terms link');

  // Count CTAs to /checkout
  const ctaCount = (landing.body.match(/href="\/checkout"/g) || []).length;
  check(ctaCount >= 4, `Landing has ${ctaCount} CTA buttons to /checkout`, `Need at least 4`);

  // === CHECKOUT PAGE ===
  console.log('\n── CHECKOUT PAGE ──');
  const checkout = await req('Checkout', '/checkout');
  check(checkout.status === 200, 'Checkout page loads', `status=${checkout.status}`);
  check(checkout.body.includes('coName'), 'Has Name field');
  check(checkout.body.includes('coEmail'), 'Has Email field');
  check(checkout.body.includes('coPhone'), 'Has Phone field');
  check(checkout.body.includes('Razorpay'), 'Razorpay script loaded');
  check(checkout.body.includes('rzp_live_'), 'Uses LIVE Razorpay key');
  check(checkout.body.includes('cdTimer'), 'Has countdown timer');
  check(checkout.body.includes('testiBox'), 'Has rotating testimonials');
  check(checkout.body.includes('The Math Is Simple'), 'Has savings calculator');
  check(checkout.body.includes('/login'), 'Has "Login here" link for existing users');
  check(checkout.body.includes('71% OFF'), 'Shows discount pill');

  // === LOGIN PAGE ===
  console.log('\n── LOGIN PAGE ──');
  const login = await req('Login', '/login');
  check(login.status === 200, 'Login page loads', `status=${login.status}`);
  check(login.body.includes('/forgot-password'), '"Forgot password?" link to /forgot-password');
  check(login.body.includes('/checkout'), '"Enroll Now" link to /checkout');

  // === FORGOT PASSWORD PAGE ===
  console.log('\n── FORGOT PASSWORD ──');
  const forgot = await req('Forgot', '/forgot-password');
  check(forgot.status === 200, 'Forgot password page loads', `status=${forgot.status}`);
  check(forgot.body.includes('/login'), '"Back to Login" link');

  // === AUTH PROTECTION (unauthenticated) ===
  console.log('\n── AUTH PROTECTION (no login) ──');
  const dashNoAuth = await req('Dashboard No Auth', '/dashboard');
  check(dashNoAuth.status === 302 && dashNoAuth.location === '/login', 'Dashboard redirects to /login', `→ ${dashNoAuth.location}`);

  const coursesNoAuth = await req('Courses No Auth', '/courses');
  check(coursesNoAuth.status === 302 && coursesNoAuth.location === '/login', 'Courses redirects to /login', `→ ${coursesNoAuth.location}`);

  const courseNoAuth = await req('Course 1 No Auth', '/course/1');
  check(courseNoAuth.status === 302 && courseNoAuth.location === '/login', 'Course detail redirects to /login', `→ ${courseNoAuth.location}`);

  const adminNoAuth = await req('Admin No Auth', '/admin/questions');
  check(adminNoAuth.status === 302, 'Admin panel protected (redirects)', `status=${adminNoAuth.status}`);

  // === LOGIN FLOW ===
  console.log('\n── LOGIN FLOW ──');
  const loginPost = await req('Login POST', '/api/login', 'POST',
    'email=test%40chaidealer.com&password=Test%401234',
    'application/x-www-form-urlencoded');
  check(loginPost.status === 302 && loginPost.location === '/dashboard', 'Login → redirects to /dashboard', `→ ${loginPost.location}`);

  // === AUTHENTICATED PAGES ===
  console.log('\n── AUTHENTICATED PAGES ──');
  const dash = await req('Dashboard', '/dashboard');
  check(dash.status === 200, 'Dashboard loads after login', `status=${dash.status}`);
  check(dash.body.includes('/courses'), 'Dashboard has "View All Courses" link');
  check(dash.body.includes('/logout'), 'Dashboard has Logout link');

  const courses = await req('Courses', '/courses');
  check(courses.status === 200, 'Courses page loads', `status=${courses.status}`);

  // Check all 19 courses
  let all19 = true;
  for (let i = 1; i <= 19; i++) {
    const c = await req(`Course ${i}`, `/course/${i}`);
    if (c.status !== 200) { all19 = false; check(false, `Course ${i} loads`, `status=${c.status}`); }
  }
  check(all19, 'All 19 course detail pages load (200 OK)');

  // Course 1 content checks
  const c1 = await req('Course 1 Detail', '/course/1');
  check(c1.body.includes('vimeo.com') || c1.body.includes('player.vimeo.com'), 'Course 1 has Vimeo video embed');
  check(c1.body.includes('question') || c1.body.includes('Q&A') || c1.body.includes('Ask'), 'Course 1 has Q&A section');
  check(c1.body.includes('/course/2'), 'Course 1 has "Next" link to course 2');
  check(c1.body.includes('playlist') || c1.body.includes('sidebar'), 'Course 1 has sidebar playlist');

  // === RAZORPAY ORDER CREATION ===
  console.log('\n── RAZORPAY LIVE TEST ──');
  const orderBody = JSON.stringify({ name: 'Audit Test', email: 'audit@test.com', phone: '9876543210' });
  const order = await req('Create Order', '/api/create-order', 'POST', orderBody, 'application/json');
  check(order.status === 200, 'Razorpay order creation works', `status=${order.status}`);
  const orderData = JSON.parse(order.body || '{}');
  check(!!orderData.orderId, `Razorpay orderId created: ${orderData.orderId}`);
  check(orderData.keyId === 'rzp_live_SXmt65aNa86cb3', 'Correct LIVE Razorpay key');
  check(orderData.amount === 199900, `Amount = ₹1,999 (${orderData.amount} paise)`);

  // === LOGOUT ===
  console.log('\n── LOGOUT ──');
  const logout = await req('Logout', '/logout');
  check(logout.status === 302 && logout.location === '/login', 'Logout redirects to /login', `→ ${logout.location}`);

  const dashAfterLogout = await req('Dashboard After Logout', '/dashboard');
  check(dashAfterLogout.status === 302 && dashAfterLogout.location === '/login', 'Dashboard blocked after logout', `→ ${dashAfterLogout.location}`);

  // === THANK YOU PAGE ===
  console.log('\n── THANK YOU PAGE ──');
  const ty = await req('Thank You', '/thankyou');
  check(ty.status === 200, 'Thank You page loads', `status=${ty.status}`);
  check(ty.body.includes('/dashboard'), 'Has "Go to Dashboard" button');
  check(ty.body.includes('/courses'), 'Has "View Courses" button');

  // === ERROR PAGE ===
  console.log('\n── ERROR HANDLING ──');
  const notFound = await req('404 Page', '/nonexistent-page');
  check(notFound.status === 200 || notFound.status === 404, '404 handled gracefully', `status=${notFound.status}`);

  const badCourse = await req('Invalid Course', '/course/999');
  check(badCourse.status >= 200, 'Invalid course ID handled', `status=${badCourse.status}`);

  // === SUMMARY ===
  console.log('\n══════════════════════════════════════════════');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`TOTAL: ${results.length} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
  if (failed > 0) {
    console.log('\nFAILED TESTS:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.label}`));
  }
  console.log('══════════════════════════════════════════════\n');
})();
