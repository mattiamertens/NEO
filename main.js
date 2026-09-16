(function(){
  const projects = ["AURORA","CIPHER","MERIDIAN","OCULUS","TIDE","VESSEL","NOMAD","PRISM","ECHO","HALO","DRIFT"];

  // exact geometry pulled from drawer.svg's viewBox (906 x 822)
  const FRONT_Y_RAW = (666.488 / 822) * 100;      // 81.08% — the opening's own near edge
  const FRONT_Y = FRONT_Y_RAW - 2.2;              // pull the front folder in a couple % so it clears the drawer-front edge instead of sitting flush on it
  const BACK_Y  = (0.464844 / 822) * 100;         // 0.06%  — back/far row position
  const FRONT_WIDTH = (774.6999 / 906) * 100;     // 85.53% — width of the opening's near edge
  const SCALE_FAR = 649.181 / 774.6999;           // 0.838  — how much the far edge has shrunk
  const MAX_TILT = 38;                            // degrees each folder leans back, following the SVG's own convergence

  const TAB_OFFSETS = [3, 30, 12, 42]; // percent from left, cycled

  const shelf = document.getElementById('shelf');
  const tilt = document.getElementById('tilt');
  const stage = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const overlayIndex = document.getElementById('overlayIndex');
  const overlayName = document.getElementById('overlayName');
  const overlayClose = document.getElementById('overlayClose');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const N = projects.length;

  const folders = projects.map((name, i) => {
    const t = i / (N - 1);
    const topPercent = FRONT_Y + t * (BACK_Y - FRONT_Y);
    const scale = 1 + t * (SCALE_FAR - 1);
    const tiltX = t * MAX_TILT;      // lean back further the deeper the row
    const baseZ = 8 - t * 6;         // always positive: stays in front of the frame plane, still varies a little for mouse-tilt parallax

    const el = document.createElement('div');
    el.className = 'folder';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Open project ' + name);
    // anchor by the BOTTOM (near/front) edge, at the row's line on the opening
    // trapezoid, so the shape extends upward into the opening from there
    el.style.bottom = (100 - topPercent) + '%';
    el.style.width = FRONT_WIDTH + '%';

    const tab = document.createElement('div');
    tab.className = 'folder-tab';
    const drift = Math.floor(i / TAB_OFFSETS.length) * 6;
    tab.style.left = Math.min(TAB_OFFSETS[i % TAB_OFFSETS.length] + drift, 48) + '%';
    tab.innerHTML =
      '<span class="folder-index">[' + String(i + 1).padStart(2, '0') + ']</span>' +
      '<span class="folder-name">' + name + '</span>';

    const body = document.createElement('div');
    body.className = 'folder-body';

    el.appendChild(tab);
    el.appendChild(body);
    shelf.appendChild(el);

    gsap.set(el, { xPercent: -50, scale: scale, z: baseZ, rotationX: -tiltX, transformOrigin: '50% 100%' });

    return { el, name, index: i, open: false, baseZ, baseScale: scale, tiltX };
  });

  let activeFolder = null;

  function hoverIn(f){ if (f.open || activeFolder) return; gsap.to(f.el, { z: f.baseZ + 22, duration: 0.35, ease: 'power2.out' }); }
  function hoverOut(f){ if (f.open || activeFolder) return; gsap.to(f.el, { z: f.baseZ, duration: 0.4, ease: 'power2.out' }); }

  function openFolder(f){
    if (activeFolder) return;
    activeFolder = f; f.open = true;
    const tl = gsap.timeline();
    tl.to(f.el, { z: f.baseZ + 300, y: -60, scale: f.baseScale * 1.15, rotationX: 0, duration: 0.6, ease: 'power3.out' })
      .to(f.el, { opacity: 0, duration: 0.3 }, '-=0.15')
      .call(() => {
        overlayIndex.textContent = '[' + String(f.index + 1).padStart(2, '0') + ']';
        overlayName.textContent = f.name;
      }, null, 0.15)
      .to(overlay, { opacity: 1, duration: 0.4, onStart: () => overlay.style.pointerEvents = 'auto' }, 0.2);
  }

  function closeFolder(){
    if (!activeFolder) return;
    const f = activeFolder;
    gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => { overlay.style.pointerEvents = 'none'; } });
    gsap.to(f.el, {
      z: f.baseZ, y: 0, scale: f.baseScale, rotationX: -f.tiltX, opacity: 1,
      duration: 0.55, ease: 'power2.out',
      onComplete: () => { f.open = false; activeFolder = null; }
    });
  }

  folders.forEach(f => {
    f.el.addEventListener('mouseenter', () => hoverIn(f));
    f.el.addEventListener('mouseleave', () => hoverOut(f));
    f.el.addEventListener('click', () => openFolder(f));
    f.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFolder(f); } });
  });

  overlayClose.addEventListener('click', closeFolder);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFolder(); });

  // ---- subtle mouse-follow 3D tilt on the whole assembly (frame + folders together) ----
  if (!reduceMotion) {
    const quickRotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    const quickRotX = gsap.quickTo(tilt, 'rotationX', { duration: 0.7, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (window.innerWidth / 2);
      const ny = (e.clientY - cy) / (window.innerHeight / 2);
      quickRotY(nx * 7);
      quickRotX(-ny * 4);
    });

    window.addEventListener('mouseleave', () => { quickRotY(0); quickRotX(0); });
  }
})();