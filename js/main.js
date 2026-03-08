/* =====================================================
   GEOSURVEY PRO — JavaScript Principal
   Archivo: js/main.js
   ===================================================== */

/* ── Cursor personalizado ────────────────────────── */
const cur  = document.getElementById('cur');
const ring = document.getElementById('curRing');

if (cur && ring) {
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top  = my + 'px';
  });

  (function animRing() {
    rx += (mx - rx) * .12;
    ry += (my - ry) * .12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  document.querySelectorAll('a, button, .srv-card, .proj-card, .team-card, .val, .cert, .tech, .acc-item').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('h'));
    el.addEventListener('mouseleave', () => ring.classList.remove('h'));
  });
}

/* ── Navegación: ocultar al bajar, mostrar al subir ─ */
const nav = document.getElementById('nav');
let lastScroll = 0;

if (nav) {
  window.addEventListener('scroll', () => {
    const s = window.scrollY;
    nav.classList.toggle('scrolled', s > 50);
    nav.style.transform = (s > lastScroll && s > 200) ? 'translateY(-100%)' : 'translateY(0)';
    lastScroll = s;
  });
}

/* ── Menú hamburguesa (móvil) ────────────────────── */
const ham       = document.getElementById('ham');
const navLinks  = document.getElementById('navLinks');

if (ham && navLinks) {
  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

/* ── Reveal al hacer scroll ──────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('on');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: .1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Contadores animados (stats) ─────────────────── */
const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCount(e.target);
      countObs.unobserve(e.target);
    }
  });
}, { threshold: .5 });

document.querySelectorAll('.stat-n[data-t]').forEach(el => countObs.observe(el));

function animateCount(el) {
  const target   = +el.dataset.t;
  const suffix   = el.dataset.s || '';
  const duration = 2000;
  const start    = performance.now();

  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const v = Math.round((1 - Math.pow(1 - p, 3)) * target);
    el.textContent = v.toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

/* ── Acordeón de servicios ───────────────────────── */
window.toggleAcc = function(head) {
  const item = head.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
};

/* ── FAQ (equipo) ────────────────────────────────── */
window.toggleFaq = function(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
};

/* ── Filtros de proyectos y servicios ────────────── */
document.querySelectorAll('.f-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('section') || document;
    group.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.f;
    group.querySelectorAll('[data-cat]').forEach(card => {
      card.style.display = (filter === 'all' || card.dataset.cat === filter) ? '' : 'none';
    });
  });
});

/* ── Calculadora topográfica (servicios) ─────────── */
const calcForm = document.getElementById('calcForm');
if (calcForm) {
  calcForm.addEventListener('submit', e => {
    e.preventDefault();
    const dist  = parseFloat(document.getElementById('calcDist')?.value  || 0);
    const angle = parseFloat(document.getElementById('calcAngle')?.value || 0);
    const type  = document.getElementById('calcType')?.value;
    const rad   = angle * Math.PI / 180;

    let result = '';
    if (type === 'area')       result = `Área estimada: ${(dist * dist * Math.sin(rad) / 2).toFixed(3)} m²`;
    else if (type === 'perimeter') result = `Perímetro: ${(4 * dist).toFixed(3)} m`;
    else if (type === 'slope')     result = `Pendiente: ${(Math.tan(rad) * 100).toFixed(2)} %`;
    else if (type === 'horizontal') result = `Distancia horizontal: ${(dist * Math.cos(rad)).toFixed(3)} m`;

    const out = document.getElementById('calcResult');
    if (out) { out.textContent = result; out.style.display = 'block'; }
  });
}

/* ── Formulario de contacto ──────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn  = this.querySelector('.form-submit');
    const resp = document.getElementById('formResp');
    const orig = btn.innerHTML;

    const data = {
      nombre:    this.nombre?.value.trim(),
      empresa:   this.empresa?.value.trim(),
      email:     this.email?.value.trim(),
      telefono:  this.telefono?.value.trim(),
      servicio:  this.servicio?.value,
      ubicacion: this.ubicacion?.value.trim(),
      area:      this.area?.value.trim(),
      mensaje:   this.mensaje?.value.trim(),
    };

    if (!data.nombre) { showResp('err', '✗ El nombre es obligatorio.'); return; }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { showResp('err', '✗ Ingrese un correo válido.'); return; }
    if (!data.mensaje) { showResp('err', '✗ El mensaje es obligatorio.'); return; }
    if (!this.privacidad?.checked) { showResp('err', '✗ Debe aceptar la política de privacidad.'); return; }

    btn.innerHTML = '<span>Enviando...</span>';
    btn.disabled  = true;

    /* ══════════════════════════════════════════════════
       ★ PARA CONECTAR CON BACKEND PYTHON:
       Descomenta el bloque fetch y borra el setTimeout:

       try {
         const r   = await fetch('/api/contacto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
         const res = await r.json();
         if (res.ok) { showResp('ok', '✓ Mensaje enviado. Le responderemos a la brevedad.'); this.reset(); }
         else showResp('err', '✗ ' + res.error);
       } catch (err) { showResp('err', '✗ Error de conexión. Intente de nuevo.'); }
    ══════════════════════════════════════════════════ */

    /* Simulación (borrar cuando uses el fetch real) */
    await new Promise(r => setTimeout(r, 1200));
    showResp('ok', '✓ Mensaje enviado correctamente. Le responderemos en breve.');
    this.reset();
    console.log('[Formulario enviado]', data); /* Debug en VS Code */

    btn.innerHTML = orig;
    btn.disabled  = false;

    function showResp(type, msg) {
      resp.className      = 'form-resp ' + type;
      resp.textContent    = msg;
      resp.style.display  = 'block';
      btn.innerHTML = orig;
      btn.disabled  = false;
      setTimeout(() => { resp.style.display = 'none'; }, 7000);
    }
  });
}

/* ── Coordenadas GPS en hero ─────────────────────── */
const hLat = document.getElementById('hLat');
const hLon = document.getElementById('hLon');
const hAlt = document.getElementById('hAlt');

if (navigator.geolocation && hLat) {
  navigator.geolocation.getCurrentPosition(pos => {
    hLat.textContent = pos.coords.latitude.toFixed(6)  + '° N';
    hLon.textContent = pos.coords.longitude.toFixed(6) + '° W';
    if (pos.coords.altitude && hAlt)
      hAlt.textContent = pos.coords.altitude.toFixed(1) + ' m';
  }, () => {});
}
