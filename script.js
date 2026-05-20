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

// ─── VIDEO PLAYER (optimized for speed) ───
function playVideo() {
  const iframe = document.getElementById('vimeoIframe');
  const frameWrap = document.getElementById('videoFrame');
  const thumbWrap = document.getElementById('videoThumb');

  if (iframe && frameWrap && thumbWrap) {
    // Use optimal params: autoplay, muted for mobile autoplay policy, quality auto
    iframe.src = 'https://player.vimeo.com/video/1173178519?autoplay=1&badge=0&autopause=0&player_id=0&app_id=58479&quality=auto&dnt=1&transparent=0';
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

// ─── CALCULATOR ───
const salSlider = document.getElementById('salarySlider');
const wasteSlider = document.getElementById('wasteSlider');
const stfSlider = document.getElementById('staffSlider');

function formatINR(num) {
  return num.toLocaleString('en-IN');
}

function animateValue(el, newVal, prefix, suffix) {
  const formatted = prefix + formatINR(newVal) + suffix;
  el.textContent = formatted;
}

function updateCalc() {
  if (!salSlider || !wasteSlider || !stfSlider) return;

  const sal = parseInt(salSlider.value);
  const waste = parseInt(wasteSlider.value);
  const stf = parseInt(stfSlider.value);
  const staffCost = stf * 8000;

  // Chef salary saved - staff cost + waste saved
  const monthlySave = Math.max(0, sal - staffCost + waste);
  const yearlySave = monthlySave * 12;
  const roi = Math.round((yearlySave / 999) * 100);

  // Update display values
  document.getElementById('salaryVal').textContent = formatINR(sal);
  document.getElementById('wasteVal').textContent = formatINR(waste);
  document.getElementById('staffVal').textContent = stf;

  // Update results with animation
  animateValue(document.getElementById('monthlySave'), monthlySave, '₹', '');
  animateValue(document.getElementById('yearlySave'), yearlySave, '₹', '');
  animateValue(document.getElementById('roiVal'), roi, '', '%');

  // Update ROI bar
  const roiBar = document.getElementById('roiBar');
  if (roiBar) {
    const barWidth = Math.min(100, Math.max(5, roi / 120));
    roiBar.style.width = barWidth + '%';
  }
}

if (salSlider) salSlider.addEventListener('input', updateCalc);
if (wasteSlider) wasteSlider.addEventListener('input', updateCalc);
if (stfSlider) stfSlider.addEventListener('input', updateCalc);

// Initialize calculator
updateCalc();

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
  }, 4000);
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
