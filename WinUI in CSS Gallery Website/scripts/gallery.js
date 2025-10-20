// gallery.js — enhanced material behavior for the gallery demo
// - detects backdrop-filter support and applies fallback class
// - computes a dynamic mica tint from the accent color and injects it as --mica-tint
// - updates mica parallax offsets for large surfaces on scroll
// - keeps existing interactivity (menu, modal, toasts, reveal pointer updates)

(function () {
  // Utility: detect backdrop-filter support
  const supportsBackdrop = (() => {
    try {
      return CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
    } catch (e) {
      return false;
    }
  })();

  if (!supportsBackdrop) {
    document.documentElement.classList.add('no-backdrop');
  } else {
    document.documentElement.classList.remove('no-backdrop');
  }

  // Utility: parse hex -> HSL and produce a subtle rgba tint for mica
  function hexToRgb(hex) {
    hex = hex.trim();
    if (hex.startsWith('var(')) return null;
    // accept #rgb or #rrggbb
    if (hex.length === 4) {
      const r = parseInt(hex[1] + hex[1], 16);
      const g = parseInt(hex[2] + hex[2], 16);
      const b = parseInt(hex[3] + hex[3], 16);
      return [r, g, b];
    } else if (hex.length === 7) {
      return [parseInt(hex.substr(1,2),16), parseInt(hex.substr(3,2),16), parseInt(hex.substr(5,2),16)];
    }
    return null;
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max + min) / 2;
    if(max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
  }
  function makeTintFromHex(hex, alpha = 0.06){
    const rgb = hexToRgb(hex);
    if(!rgb) return `rgba(255,255,255,${alpha})`;
    const [h,s,l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    // produce a soft translucent tint using HSL tuned for overlay effect
    // Light theme: lighter tint; dark theme: darker tint
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const tintLightness = isDark ? Math.max(12, l - 26) : Math.min(95, l + 12);
    // convert back to rgb via HSL -> rgba using a temporary canvas if available, fallback to hsla
    return `hsla(${h}, ${Math.max(28, Math.min(80, s))}%, ${tintLightness}%, ${alpha})`;
  }

  // Compute mica tint from accent color CSS var and apply to :root
  function updateMicaTint() {
    const root = getComputedStyle(document.documentElement);
    let accent = root.getPropertyValue('--accent-100').trim() || '#0078d4';
    // if accent is an rgb/rgba/hsl string, just attempt to use it as hsla fallback
    let tint = makeTintFromHex(accent, 0.06);
    // apply as CSS variable
    document.documentElement.style.setProperty('--mica-tint', tint);
    // Also slightly tweak acrylic opacity/saturation based on theme light/dark
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--acrylic-opacity', '0.28');
      document.documentElement.style.setProperty('--acrylic-saturate', '1.06');
    } else {
      document.documentElement.style.setProperty('--acrylic-opacity', '0.36');
      document.documentElement.style.setProperty('--acrylic-saturate', '1.08');
    }
  }
  // run once
  updateMicaTint();

  // Recompute when theme toggles (the gallery toggles data-theme on <html>)
  const themeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') updateMicaTint();
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  // Parallax: update mica offset for visible .winui-mica elements
  let lastScroll = 0;
  function updateMicaParallax() {
    const micaEls = document.querySelectorAll('.winui-mica');
    const scrollY = window.scrollY || window.pageYOffset;
    // small throttle via requestAnimationFrame
    if (Math.abs(scrollY - lastScroll) < 2) return;
    lastScroll = scrollY;
    micaEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      // only update for surfaces large enough to perceive parallax
      const strength = parseFloat(getComputedStyle(el).getPropertyValue('--mica-parallax-strength')) || 0.035;
      // use distance from viewport top to create tiny offset
      const centerY = rect.top + rect.height / 2;
      // normalized -0.5..0.5
      const norm = Math.max(-1, Math.min(1, (centerY - window.innerHeight/2) / (window.innerHeight/2)));
      const offsetPx = -norm * (rect.height * strength);
      el.style.setProperty('--mica-offset', `${offsetPx}px`);
    });
  }
  // initial update and on scroll
  updateMicaParallax();
  window.addEventListener('scroll', () => requestAnimationFrame(updateMicaParallax), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(updateMicaParallax));

  // -------- existing gallery behaviour (menu, context menu, modal, toasts, reveal pointer) --------
  // Keep existing interactivity: menu, context, modal, toasts, toggles, slider -> progress, and reveal pointer updates.

  // Menu dropdown logic
  const menuBtn = document.getElementById('menuBtn');
  const menuPanel = document.getElementById('menuPanel');
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      menuPanel.classList.toggle('open');
      const rect = menuBtn.getBoundingClientRect();
      menuPanel.style.left = rect.left + 'px';
      menuPanel.style.top = (rect.bottom + 8) + 'px';
    });
    document.addEventListener('click', (ev) => {
      if (!menuBtn.contains(ev.target) && !menuPanel.contains(ev.target)) {
        menuPanel.classList.remove('open');
      }
    });
  }

  // Context menu demo (right click)
  const ctxTarget = document.getElementById('ctxTarget');
  if (ctxTarget){
    ctxTarget.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const existing = document.querySelector('.winui-contextmenu');
      if (existing) existing.remove();
      const panel = document.createElement('div');
      panel.className = 'winui-menu winui-contextmenu';
      panel.style.left = e.pageX + 'px';
      panel.style.top = e.pageY + 'px';
      panel.innerHTML = '<div class="winui-menuitem">Open</div><div class="winui-menuitem">Rename</div><div class="winui-menuitem">Delete</div>';
      document.body.appendChild(panel);
      const remove = () => panel.remove();
      setTimeout(() => document.addEventListener('click', remove, { once: true }), 10);
    });
  }

  // Modal open/close
  const openModal = document.getElementById('openModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const closeModal = document.getElementById('closeModal');
  if (openModal && modalBackdrop) {
    openModal.addEventListener('click', () => {
      modalBackdrop.style.display = 'flex';
      requestAnimationFrame(() => {
        modalBackdrop.style.opacity = '1';
        modalBackdrop.style.pointerEvents = 'auto';
      });
    });
    if (closeModal) closeModal.addEventListener('click', closeTheModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeTheModal();
    });
  }
  function closeTheModal() {
    modalBackdrop.style.opacity = '0';
    modalBackdrop.style.pointerEvents = 'none';
    setTimeout(() => modalBackdrop.style.display = 'none', 220);
  }

  // Toasts
  const toastArea = document.getElementById('toastArea');
  const openToastBtn = document.getElementById('openToast');
  if (openToastBtn && toastArea) {
    openToastBtn.addEventListener('click', () => showToast('This is a WinUI-style toast'));
    openToastBtn.addEventListener('keydown', e => { if (e.key === 'Enter') showToast('This is a WinUI-style toast'); });
  }
  function showToast(text = 'Notification', timeout = 3000) {
    if (!toastArea) return;
    const t = document.createElement('div');
    t.className = 'winui-toast';
    t.textContent = text;
    toastArea.appendChild(t);
    setTimeout(() => t.style.opacity = '0', timeout - 600);
    setTimeout(() => t.remove(), timeout);
  }

  // Switch / checkbox / radio demo toggles (visual only)
  const s1 = document.getElementById('s1');
  const cb1 = document.getElementById('cb1');
  const r1 = document.getElementById('r1');
  if (s1) s1.addEventListener('click', () => s1.classList.toggle('on'));
  if (cb1) cb1.addEventListener('click', () => cb1.classList.toggle('checked'));
  if (r1) r1.addEventListener('click', () => r1.classList.toggle('checked'));

  // Slider -> progress
  const slider = document.getElementById('slider');
  const pval = document.getElementById('pval');
  if (slider && pval) {
    slider.addEventListener('input', () => { pval.style.width = slider.value + '%'; });
  }

  // Reveal: update pointer coordinates for .winui-reveal elements
  document.addEventListener('pointermove', (ev) => {
    document.querySelectorAll('.winui-reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
        const x = ((ev.clientX - rect.left) / rect.width) * 100;
        const y = ((ev.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--pointer-x', x + '%');
        el.style.setProperty('--pointer-y', y + '%');
      }
    });
  });

  // Small keyboard accessibility helpers for demo
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // close menu & modal & context
      if (menuPanel) menuPanel.classList.remove('open');
      const ctx = document.querySelector('.winui-contextmenu');
      if (ctx) ctx.remove();
      closeTheModal();
    }
  });

  // Watch for dynamic changes of accent variable (if user edits CSS vars live)
  const cssObserver = new MutationObserver(() => updateMicaTint());
  cssObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

})();
