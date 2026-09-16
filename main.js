(function(){
  const projects = ["AURORA","CIPHER"];
  const STEP_Y = 30;
  const TAB_OFFSETS = [26, 168, 310];
  const shelfAngle = 60; // degrees, must match --shelf-angle intent

  const shelf = document.getElementById('shelf');
  const tilt = document.getElementById('tilt');
  const stage = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const overlayIndex = document.getElementById('overlayIndex');
  const overlayName = document.getElementById('overlayName');
  const overlayClose = document.getElementById('overlayClose');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.set(shelf, { rotationX: -shelfAngle, transformOrigin: '50% 100%' });

  const folders = projects.map((name, i) => {
    const el = document.createElement('div');
    el.className = 'folder';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Open project ' + name);
    if (i < 2) el.classList.add('is-labeled');

    const tab = document.createElement('div');
    tab.className = 'folder-tab';
    const drift = Math.floor(i / TAB_OFFSETS.length) * 14;
    tab.style.left = (TAB_OFFSETS[i % TAB_OFFSETS.length] + drift) + 'px';

    const body = document.createElement('div');
    body.className = 'folder-body';
    body.innerHTML =
      '<span class="folder-index">[' + String(i + 1).padStart(2, '0') + ']</span>' +
      '<span class="folder-name">' + name + '</span>';

    el.appendChild(tab);
    el.appendChild(body);
    shelf.appendChild(el);

    el.style.bottom = (i * STEP_Y) + 'px';
    gsap.set(el, { transformOrigin: '50% 100%', z: 0 });

    return { el, name, index: i, open: false };
  });

  let activeFolder = null;

  function hoverIn(f) {
    if (f.open || activeFolder) return;
    gsap.to(f.el, { z: -20, duration: 0.35, ease: 'power2.out' });
  }
  function hoverOut(f) {
    if (f.open || activeFolder) return;
    gsap.to(f.el, { z: 0, duration: 0.4, ease: 'power2.out' });
  }

  function openFolder(f) {
    if (activeFolder) return;
    activeFolder = f;
    f.open = true;

    const tl = gsap.timeline();
    tl.to(f.el, {
        z: 260,
        y: -50,
        scale: 1.14,
        rotationX: shelfAngle,
        duration: 0.6,
        ease: 'power3.out'
      })
      .to(f.el, { opacity: 0, duration: 0.3 }, '-=0.15')
      .call(() => {
        overlayIndex.textContent = '[' + String(f.index + 1).padStart(2, '0') + ']';
        overlayName.textContent = f.name;
      }, null, 0.15)
      .to(overlay, { opacity: 1, duration: 0.4, onStart: () => overlay.style.pointerEvents = 'auto' }, 0.2);
  }

  function closeFolder() {
    if (!activeFolder) return;
    const f = activeFolder;
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => { overlay.style.pointerEvents = 'none'; }
    });
    gsap.to(f.el, {
      z: 0, y: 0, scale: 1, rotationX: 0, opacity: 1,
      duration: 0.55, ease: 'power2.out',
      onComplete: () => { f.open = false; activeFolder = null; }
    });
  }

  folders.forEach(f => {
    f.el.addEventListener('mouseenter', () => hoverIn(f));
    f.el.addEventListener('mouseleave', () => hoverOut(f));
    f.el.addEventListener('click', () => openFolder(f));
    f.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFolder(f); }
    });
  });

  overlayClose.addEventListener('click', closeFolder);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFolder(); });

  // ---- subtle mouse-follow 3D tilt on the whole assembly ----
  if (!reduceMotion) {
    const quickRotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    const quickRotX = gsap.quickTo(tilt, 'rotationX', { duration: 0.7, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (window.innerWidth / 2);
      const ny = (e.clientY - cy) / (window.innerHeight / 2);
      quickRotY(nx * 9);
      quickRotX(-ny * 5);
    });

    window.addEventListener('mouseleave', () => { quickRotY(0); quickRotX(0); });
  }
})();