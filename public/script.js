// =============================================
// CHEFLESS CAFE — CONVERSION-OPTIMIZED SCRIPTS
// =============================================

// ─── PARTICLES (reduced on mobile) ───
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 12 : 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 6 + 's';
    p.style.animationDuration = (4 + Math.random() * 4) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    container.appendChild(p);
  }
})();

// ─── NAVBAR SCROLL ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// ─── REVEAL ON SCROLL ───
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── STICKY MOBILE CTA ───
const heroEl = document.getElementById('hero');
if (heroEl) {
  new IntersectionObserver(([e]) => {
    const sticky = document.getElementById('stickyCta');
    if (sticky) sticky.classList.toggle('visible', !e.isIntersecting);
  }, { threshold: 0 }).observe(heroEl);
}

// ─── SMOOTH SCROLL ───
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navHeight = window.innerWidth < 768 ? 60 : 72;
      const y = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});

// ─── VIDEO PLAYER ───
function playVideo() {
  const iframe = document.getElementById('ytIframe');
  const frameWrap = document.getElementById('videoFrame');
  const thumbWrap = document.getElementById('videoThumb');

  if (iframe && frameWrap && thumbWrap) {
    iframe.src = 'https://www.youtube.com/embed/Qt2JkL7E7X0?autoplay=1&rel=0&modestbranding=1';
    frameWrap.classList.add('active');
    thumbWrap.style.display = 'none';
  }
}


// ─── FAQ ───
function toggleFaq(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ─── CALCULATOR (new: form-based, backend calc) ───
function formatINR(num) {
  if (num < 0) return '-₹' + Math.abs(num).toLocaleString('en-IN');
  return '₹' + num.toLocaleString('en-IN');
}

async function runCalculation() {
  const btn = document.getElementById('calcBtnText');
  const errEl = document.getElementById('calcError');

  const numChefs   = document.getElementById('numChefs').value.trim();
  const chefSalary = document.getElementById('chefSalary').value.trim();
  const numStaff   = document.getElementById('numStaff').value.trim();
  const staffSalary = document.getElementById('staffSalary').value.trim();

  // Client-side validation
  errEl.style.display = 'none';
  if (!numChefs || !chefSalary || !numStaff || !staffSalary) {
    errEl.textContent = '⚠️ Please fill in all 4 fields before calculating.';
    errEl.style.display = 'block';
    return;
  }

  btn.textContent = 'Calculating...';

  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numChefs, chefSalary, numStaff, staffSalary }),
    });

    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = '⚠️ ' + (data.error || 'Something went wrong. Try again.');
      errEl.style.display = 'block';
      btn.textContent = 'Calculate My Savings →';
      return;
    }

    // Populate results
    document.getElementById('resCurrentCost').textContent = formatINR(data.currentMonthly);
    document.getElementById('resCurrentDesc').textContent = data.currentDesc;
    document.getElementById('resFutureCost').textContent  = formatINR(data.futureMonthly);
    document.getElementById('resFutureDesc').textContent  = data.futureDesc;
    document.getElementById('resMonthlySave').textContent = formatINR(data.monthlySaving);
    document.getElementById('resYearlySave').textContent  = formatINR(data.yearlySaving);
    document.getElementById('resYear1Profit').textContent = formatINR(data.year1Profit);
    document.getElementById('resROI').textContent         = data.roi.toLocaleString('en-IN') + '%';

    // Verdict message
    const verdict = document.getElementById('resVerdict');
    if (data.monthlySaving <= 0) {
      verdict.innerHTML = '⚠️ Your staff cost is higher than your chef cost. Consider reducing the number of staff or their salaries — the SOP system lets you train fewer helpers to do more.';
      verdict.className = 'result-verdict verdict-warn';
    } else {
      verdict.innerHTML = `🔥 This course costs just <strong>₹999</strong> — and pays for itself in <strong>${Math.ceil(999 / data.monthlySaving)} day${Math.ceil(999 / data.monthlySaving) > 1 ? 's' : ''}</strong>. Every day you wait is money left on the table.`;
      verdict.className = 'result-verdict verdict-fire';
    }

    // Show results, hide form
    document.getElementById('calcInputs').style.display = 'none';
    document.getElementById('calcResults').style.display = 'block';

    // Scroll into results
    document.getElementById('calcResults').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (e) {
    errEl.textContent = '⚠️ Network error. Please check your connection and try again.';
    errEl.style.display = 'block';
    btn.textContent = 'Calculate My Savings →';
  }
}

function resetCalculator() {
  document.getElementById('calcInputs').style.display = 'block';
  document.getElementById('calcResults').style.display = 'none';
  document.getElementById('calcBtnText').textContent = 'Calculate My Savings →';
  document.getElementById('calcError').style.display = 'none';
}

// Allow Enter key to trigger calculation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement && ['numChefs','chefSalary','numStaff','staffSalary'].includes(document.activeElement.id)) {
    runCalculation();
  }
});

// ─── WHATSAPP LEAD FORM ───
function sendToWhatsapp() {
  const name = document.getElementById('leadName').value.trim();
  const phone = document.getElementById('leadPhone').value.trim();
  const cafe = document.getElementById('leadCafe').value.trim();

  if (!name || !phone) {
    alert('Please enter your name and WhatsApp number.');
    return;
  }

  const msg = encodeURIComponent(
    `Hi, I'm ${name}${cafe ? ' from ' + cafe : ''}. I'm interested in the Chefless Cafe Menu System. My number is ${phone}.`
  );
  window.open(`https://wa.me/917042401496?text=${msg}`, '_blank');
}

// ─── COUNTER ANIMATION ───
function animateCount(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  if (!target) return;

  const duration = 2000;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCount(e.target);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ─── TESTIMONIALS SCROLL ───
function scrollTestimonials(direction) {
  const track = document.getElementById('testiTrack');
  if (!track) return;
  const isMobile = window.innerWidth < 768;
  const cardWidth = isMobile ? 300 : 360;
  track.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
}

// Auto-scroll testimonials (pause on touch/hover)
let testiAutoScroll;
function startTestiAutoScroll() {
  const isMobile = window.innerWidth < 768;
  testiAutoScroll = setInterval(() => {
    const track = document.getElementById('testiTrack');
    if (!track) return;
    const cardWidth = isMobile ? 300 : 360;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (track.scrollLeft >= maxScroll - 10) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  }, 12000);
}

const testiTrack = document.getElementById('testiTrack');
if (testiTrack) {
  startTestiAutoScroll();
  // Pause on mouse hover (desktop)
  testiTrack.addEventListener('mouseenter', () => clearInterval(testiAutoScroll));
  testiTrack.addEventListener('mouseleave', startTestiAutoScroll);
  // Pause on touch (mobile)
  testiTrack.addEventListener('touchstart', () => clearInterval(testiAutoScroll), { passive: true });
  testiTrack.addEventListener('touchend', () => { setTimeout(startTestiAutoScroll, 3000); }, { passive: true });
}

// ─── COUNTDOWN TIMER (persisted — does NOT reset on reload) ───
function initCountdown() {
  const KEY = 'tcd_offer_deadline';
  const DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

  let deadline = parseInt(localStorage.getItem(KEY) || '0');
  const now = Date.now();

  // If no stored deadline or it has already expired, set a fresh 24h window
  if (!deadline || deadline <= now) {
    deadline = now + DURATION;
    localStorage.setItem(KEY, deadline);
  }

  function update() {
    const remaining = Math.max(0, deadline - Date.now());

    // If expired during session, silently roll to next window
    if (remaining === 0) {
      deadline = Date.now() + DURATION;
      localStorage.setItem(KEY, deadline);
    }

    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    const hEl = document.getElementById('cdHours');
    const mEl = document.getElementById('cdMins');
    const sEl = document.getElementById('cdSecs');

    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

initCountdown();

// ─── RANGE SLIDER TRACK FILL ───
function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const percentage = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(90deg, var(--amber) ${percentage}%, var(--dark4) ${percentage}%)`;
}

document.querySelectorAll('input[type=range]').forEach(slider => {
  updateSliderFill(slider);
  slider.addEventListener('input', () => updateSliderFill(slider));
});
