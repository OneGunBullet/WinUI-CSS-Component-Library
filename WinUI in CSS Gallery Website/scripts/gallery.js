// gallery.js — minimal interaction glue for the WinUI CSS gallery demo
// - toggles dark mode
// - menu open/close
// - context menu demo
// - modal open/close
// - toast injection
// - reveal pointer coordinate updates for elements with .winui-reveal

(function () {
  // Dark toggle (toggle data-theme on <html>)
  const darkToggle = document.getElementById('darkToggle');
  darkToggle.addEventListener('click', () => {
    const root = document.documentElement;
    if (root.getAttribute('data-theme') === 'dark') {
      root.removeAttribute('data-theme');
      darkToggle.textContent = 'Toggle Dark';
    } else {
      root.setAttribute('data-theme', 'dark');
      darkToggle.textContent = 'Toggle Light';
    }
  });

  // Menu dropdown
  const menuBtn = document.getElementById('menuBtn');
  const menuPanel = document.getElementById('menuPanel');
  menuBtn.addEventListener('click', (e) => {
    menuPanel.classList.toggle('open');
    // simple position adjustment
    const rect = menuBtn.getBoundingClientRect();
    menuPanel.style.left = rect.left + 'px';
    menuPanel.style.top = (rect.bottom + 8) + 'px';
  });
  document.addEventListener('click', (ev) => {
    if (!menuBtn.contains(ev.target) && !menuPanel.contains(ev.target)) {
      menuPanel.classList.remove('open');
    }
  });

  // Context menu demo (right click)
  const ctxTarget = document.getElementById('ctxTarget');
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

  // Modal open/close
  const openModal = document.getElementById('openModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const closeModal = document.getElementById('closeModal');
  openModal.addEventListener('click', () => {
    modalBackdrop.style.display = 'flex';
    // force reflow then animate
    requestAnimationFrame(() => {
      modalBackdrop.style.opacity = '1';
      modalBackdrop.style.pointerEvents = 'auto';
    });
  });
  closeModal.addEventListener('click', closeTheModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeTheModal();
  });
  function closeTheModal() {
    modalBackdrop.style.opacity = '0';
    modalBackdrop.style.pointerEvents = 'none';
    setTimeout(() => modalBackdrop.style.display = 'none', 220);
  }

  // Toasts
  const toastArea = document.getElementById('toastArea');
  document.getElementById('openToast').addEventListener('click', () => showToast('This is a WinUI-style toast'));
  document.getElementById('openToast').addEventListener('keydown', e => { if (e.key === 'Enter') showToast('This is a WinUI-style toast'); });

  function showToast(text = 'Notification', timeout = 3000) {
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
      // Only update if pointer inside element
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
      // close menu & modal
      menuPanel.classList.remove('open');
      const ctx = document.querySelector('.winui-contextmenu');
      if (ctx) ctx.remove();
      closeTheModal();
    }
  });

})();