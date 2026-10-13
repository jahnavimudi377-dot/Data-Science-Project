/* main.js - shared helpers used by every page:
   icons, toasts, modals, header/profile card, media + code rendering,
   sub-experiment widgets, module editor and the reusable Tools/Resources page. */

/* ================= Icons ================= */
const ICON_PATHS = {
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  flask: '<path d="M10 2v7.31L4.5 19a2 2 0 0 0 1.74 3h11.52a2 2 0 0 0 1.74-3L14 9.31V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  dots: '<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  eraser: '<path d="M20 20H7L3 16a1 1 0 0 1 0-1.4l9.6-9.6a2 2 0 0 1 2.8 0l5.6 5.6a2 2 0 0 1 0 2.8L13 20"/>'
};
function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

/* ================= Small utilities ================= */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const qs = (name) => new URLSearchParams(location.search).get(name);
function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function initials(text) {
  const parts = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
const GRADIENTS = [
  ['#4338ca', '#7c3aed'], ['#0f766e', '#06b6d4'], ['#f97316', '#ec4899'],
  ['#7c3aed', '#db2777'], ['#1d4ed8', '#06b6d4'], ['#be185d', '#f59e0b']
];
function gradientFor(seed) {
  let h = 0;
  String(seed || '').split('').forEach((c) => { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
  const [a, b] = GRADIENTS[h % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
function coverHTML(url, seed, label) {
  if (url) return `<img class="cover-img" loading="lazy" src="${esc(url)}" alt="${esc(label)}">`;
  return `<div class="cover-placeholder" style="background:${gradientFor(seed)}"><span>${esc(initials(label))}</span></div>`;
}
function youtubeEmbedUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.searchParams.get('v')) id = u.searchParams.get('v');
    else { const m = u.pathname.match(/\/(embed|shorts|live)\/([\w-]+)/); if (m) id = m[2]; }
    return /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : '';
  } catch (e) { return ''; }
}
// A video LINK: YouTube/Shorts -> embedded player, direct video file -> HTML5 player, anything else -> "Watch Video" button
function videoLinkHTML(url) {
  if (!url) return '';
  const yt = youtubeEmbedUrl(url);
  if (yt) return `<div class="media-frame"><iframe src="${esc(yt)}" title="Video" allowfullscreen loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
  if (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)) return `<div class="media-frame"><video controls preload="metadata" src="${esc(url)}"></video></div>`;
  let host = '';
  try { host = new URL(url).hostname; } catch (e) { /* ignore */ }
  return `<div class="video-link"><a class="btn btn-dark" href="${esc(url)}" target="_blank" rel="noopener">${icon('video', 16)} Watch Video</a><span class="muted">${esc(host)}</span></div>`;
}
// Uploaded video file (video) and/or video link (youtubeUrl or videoUrl). Returns '' when there is neither.
function mediaHTML({ video, youtubeUrl, videoUrl }) {
  let out = '';
  if (video) out += `<div class="media-frame"><video controls preload="metadata" src="${esc(video)}"></video></div>`;
  out += videoLinkHTML(youtubeUrl || videoUrl);
  return out;
}
// Reusable "Video (Optional): Upload Video OR Video Link" form block
function videoFieldsHTML({ label = 'Video (Optional)', fileName = 'video', current = '', removeName = 'removeVideo', linkAttr = 'name="videoUrl"', linkValue = '', multiple = false, extraBefore = '' }) {
  return `<div class="field video-box"><span class="field-label">${esc(label)}</span>${extraBefore}
    ${fileFieldHTML({ name: fileName, label: 'Upload Video', accept: '.mp4,.webm,.mov', kind: 'video', current, removeName, multiple, hint: 'MP4, WEBM or MOV - max 100 MB' })}
    <div class="or-divider"><span>OR</span></div>
    <label class="field"><span>Video Link</span><input type="url" ${linkAttr} value="${esc(linkValue)}" placeholder="Paste YouTube / Video URL"></label></div>`;
}
function codeBlockHTML(code, label = 'Program', language = '', extraClass = '') {
  if (!code) return '';
  return `<div class="code-block ${extraClass}"><div class="code-head"><span>${esc(label)}${language ? ' · ' + esc(language) : ''}</span>
    <button type="button" class="btn btn-sm btn-light" data-copy-code>${icon('copy', 14)} COPY CODE</button></div><pre><code>${esc(code)}</code></pre></div>`;
}
// Long description: blank line = new paragraph, a line starting with "## " = heading.
function richTextHTML(text) {
  if (!text) return '';
  return text.split(/\n{2,}/).map((block) => {
    const t = block.trim();
    if (!t) return '';
    if (t.startsWith('## ')) {
      const [head, ...rest] = t.split('\n');
      return `<h4>${esc(head.slice(3))}</h4>` + (rest.length ? `<p>${esc(rest.join('\n')).replace(/\n/g, '<br>')}</p>` : '');
    }
    return `<p>${esc(t).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
function emptyStateHTML(title, text, themeIcon, actionHTML = '') {
  return `<div class="empty-state"><div class="es-icon">${icon(themeIcon, 30)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actionHTML}</div>`;
}
// "2025-03-01" -> "1 Mar 2025"
function formatDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return '';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
const subLabel = (exp, sub) => `${exp.experimentNumber}${sub.number}`;

/* ================= Toasts, modals, confirm ================= */
function toast(message, type = 'success') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 320); }, type === 'error' ? 5000 : 3200);
}

function openModal({ title, html, wide = false, closeOnOverlay = true, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Close">${icon('x')}</button></div>
    <div class="modal-body">${html}</div></div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('no-scroll');
  const close = () => {
    overlay.remove();
    if (!document.querySelector('.modal-overlay')) document.body.classList.remove('no-scroll');
    if (onClose) onClose();
  };
  overlay.close = close;
  overlay.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || (closeOnOverlay && e.target === overlay)) close(); });
  requestAnimationFrame(() => overlay.classList.add('show'));
  return overlay;
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const overlays = document.querySelectorAll('.modal-overlay');
  if (overlays.length) overlays[overlays.length - 1].close();
});

function confirmDialog(message, confirmText = 'Delete') {
  return new Promise((resolve) => {
    let decided = false;
    const modal = openModal({
      title: 'Please confirm',
      html: `<p class="confirm-text">${esc(message)}</p><div class="modal-foot">
        <button type="button" class="btn btn-light" data-close>Cancel</button>
        <button type="button" class="btn btn-danger" data-confirm>${esc(confirmText)}</button></div>`,
      onClose: () => { if (!decided) resolve(false); }
    });
    modal.querySelector('[data-confirm]').onclick = () => { decided = true; resolve(true); modal.close(); };
  });
}

/* Run an async action while disabling a button (prevents double submits). */
async function withBusy(button, fn) {
  if (button) button.disabled = true;
  try { return await fn(); } finally { if (button) button.disabled = false; }
}

/* ================= Three-dot menu + click delegation ================= */
function kebabHTML(items, up = false) {
  return `<div class="kebab ${up ? 'up' : ''}"><button type="button" class="icon-btn" data-kebab aria-label="More actions" aria-haspopup="true">${icon('dots')}</button>
    <div class="kebab-menu">${items.map((i) => `<button type="button" data-action="${i.action}" class="${i.danger ? 'danger' : ''}">${icon(i.icon, 16)} ${esc(i.label)}</button>`).join('')}</div></div>`;
}
const closeKebabs = () => document.querySelectorAll('.kebab.open').forEach((k) => k.classList.remove('open'));
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-kebab]');
  if (toggle) {
    const wrap = toggle.closest('.kebab');
    const wasOpen = wrap.classList.contains('open');
    closeKebabs();
    if (!wasOpen) wrap.classList.add('open');
  } else if (!e.target.closest('.kebab-menu')) closeKebabs();
});
/* Attach one listener to a container; buttons with data-action call handlers[action](id, button, event).
   The id comes from the closest element with data-id (the card). */
function onAction(root, handlers) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || !root.contains(btn)) return;
    const holder = btn.closest('[data-id]');
    const fn = handlers[btn.dataset.action];
    if (!fn) return;
    e.preventDefault();
    closeKebabs();
    fn(holder ? holder.dataset.id : undefined, btn, e);
  });
}

/* ================= File inputs ================= */
const FILE_RULES = { image: ['jpg', 'jpeg', 'png', 'webp'], pdf: ['pdf'], video: ['mp4', 'webm', 'mov'] };
const FILE_NAMES = { image: 'JPG, JPEG, PNG or WEBP', pdf: 'PDF', video: 'MP4, WEBM or MOV' };
const MAX_UPLOAD_MB = 100;

function fileFieldHTML({ name, label, accept, kind = 'image', current = '', removeName = '', hint = '', multiple = false }) {
  let cur = '';
  if (current) {
    cur = `<div class="current-file">${kind === 'image' ? `<img src="${esc(current)}" alt="">` : `<a href="${esc(current)}" target="_blank" rel="noopener">${icon('file', 14)} Current file</a>`}
      <span class="muted">Kept unless you choose a new file.</span>
      ${removeName ? `<label class="check"><input type="checkbox" name="${removeName}"> Remove</label>` : ''}</div>`;
  }
  return `<div class="field"><span class="field-label">${label}</span>
    <input type="file" name="${name}" accept="${accept}" data-kind="${kind}" ${multiple ? 'multiple' : ''}>
    ${hint ? `<small>${hint}</small>` : ''}${cur}</div>`;
}
// Validates type and size of any chosen file, and shows a preview for images.
document.addEventListener('change', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.dataset.kind) return;
  const kind = input.dataset.kind;
  for (const file of input.files) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!FILE_RULES[kind].includes(ext)) { toast(`"${file.name}" is not allowed. Use ${FILE_NAMES[kind]}.`, 'error'); input.value = ''; break; }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) { toast(`"${file.name}" is larger than ${MAX_UPLOAD_MB} MB.`, 'error'); input.value = ''; break; }
  }
  const old = input.parentElement.querySelector('.new-preview');
  if (old) old.remove();
  if (kind === 'image' && input.files[0]) {
    const img = document.createElement('img');
    img.className = 'new-preview';
    img.src = URL.createObjectURL(input.files[0]);
    input.after(img);
  }
});

/* ================= Copy code ================= */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (err) {
    const ta = document.createElement('textarea');   // fallback for older browsers
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  toast('Code copied');
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy-code]');
  if (btn) copyText(btn.closest('.code-block').querySelector('code').textContent);
});

/* ================= Header, profile card, footer ================= */
const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'subjects', label: 'Subjects / Modules', href: 'subjects.html' },
  { key: 'experiments', label: 'Experiments', href: 'experiments.html' },
  { key: 'tools', label: 'Tools', href: 'tools.html' },
  { key: 'resources', label: 'Resources', href: 'resources.html' },
  { key: 'projects', label: 'Projects', href: 'projects.html' }
];
function profileChipHTML(p) {
  const has = p && (p.name || p.class || p.branch || p.rollNumber || p.facultyName);
  const avatar = `<span class="avatar">${p && p.profileImage ? `<img src="${esc(p.profileImage)}" alt="">` : (p && p.name ? esc(initials(p.name)) : icon('user', 22))}</span>`;
  if (!has) return `${avatar}<span class="pc-text"><strong>Add profile</strong><small>Profile information not added.</small></span>`;
  const line1 = [p.class, p.branch].filter(Boolean).join(' · ');
  const line2 = [p.rollNumber && `Roll ${p.rollNumber}`, p.facultyName && `Faculty: ${p.facultyName}`].filter(Boolean).join(' · ');
  return `${avatar}<span class="pc-text"><strong>${esc(p.name || 'Student')}</strong>${line1 ? `<small>${esc(line1)}</small>` : ''}${line2 ? `<small>${esc(line2)}</small>` : ''}</span>`;
}
async function refreshProfileChip() {
  const chip = document.getElementById('profileChip');
  if (!chip) return;
  try { chip.innerHTML = profileChipHTML(await Api.get('/api/profile')); }
  catch (e) { chip.innerHTML = profileChipHTML(null); }
}
function renderChrome() {
  const page = document.body.dataset.page || '';
  const header = document.getElementById('app-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `<div class="container header-inner">
      <div class="brand-wrap"><a class="brand" href="index.html"><span class="brand-mark has-logo">${logoMarkup(DEFAULT_LOGO, false)}</span><span class="brand-text"><strong>Data Science</strong><small>Data Science Laboratory</small></span></a><button type="button" class="logo-edit-btn" id="logoEditBtn" title="Edit logo" aria-label="Edit logo">${icon('edit', 14)}</button></div>
      <nav class="main-nav" id="mainNav" aria-label="Main">${NAV_ITEMS.map((n) => `<a href="${n.href}" class="${n.key === page ? 'active' : ''}">${n.label}</a>`).join('')}</nav>
      <a class="profile-chip" id="profileChip" href="profile.html" title="Open profile"></a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">${icon('menu', 22)}</button></div>`;
    document.getElementById('logoEditBtn').onclick = () => openLogoEditor();
    document.getElementById('navToggle').onclick = () => document.getElementById('mainNav').classList.toggle('open');
    refreshProfileChip();
  }
  const footer = document.getElementById('app-footer');
  if (footer) { footer.className = 'site-footer'; footer.textContent = 'DS LAB · Data Science Laboratory – Experiments & Projects'; }
  // Fill in icons used by static page markup
  const iconMap = { 'i-subjects': 'book', 'i-experiments': 'flask', 'i-tools': 'tool', 'i-resources': 'layers', 'i-projects': 'folder' };
  Object.entries(iconMap).forEach(([id, name]) => { const el = document.getElementById(id); if (el) el.innerHTML = icon(name, 32); });
  document.querySelectorAll('.arrow').forEach((a) => { a.innerHTML = icon('arrow', 18); });
  const searchSlot = document.getElementById('searchIcon');
  if (searchSlot) searchSlot.outerHTML = icon('search', 18);
  const toasts = document.createElement('div');
  toasts.id = 'toasts'; toasts.setAttribute('aria-live', 'polite');
  document.body.appendChild(toasts);
}
// Profile card on the home dashboard (same size as the other four cards)
async function renderHomeProfile() {
  const el = document.getElementById('homeProfile');
  if (!el) return;
  let p = null;
  try { p = await Api.get('/api/profile'); } catch (e) { /* show empty state */ }
  const has = p && (p.name || p.class || p.branch || p.rollNumber || p.section || p.facultyName);
  const avatar = p && p.profileImage ? `<img src="${esc(p.profileImage)}" alt="">` : (p && p.name ? esc(initials(p.name)) : icon('user', 26));
  const lines = has ? [
    [p.class, p.branch].filter(Boolean).join(' · '),
    [p.rollNumber && `Roll ${p.rollNumber}`, p.section && `Section ${p.section}`].filter(Boolean).join(' · '),
    p.facultyName && `Faculty: ${p.facultyName}`
  ].filter(Boolean) : ['Profile information not added.'];
  el.innerHTML = `<div class="pf-top"><span class="pf-avatar">${avatar}</span><h2>${has ? esc(p.name || 'Student') : 'Profile'}</h2></div>
    <div class="pf-lines">${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
    <span class="hc-go">${has ? 'View profile' : 'Add profile'} ${icon('arrow', 18)}</span>`;
}
/* Logo system. Order of preference: custom logo (uploaded via Profile -> Edit Logo) -> default MBU logo -> "DS" text mark.
   The default logo is the file frontend/assets/mbu-logo.png. Only the CUSTOM logo path is cached locally (to avoid a flash on page load). */
const DEFAULT_LOGO = 'assets/mbu-logo.png';
function logoMarkup(src, isCustom) {
  return `<img src="${esc(src)}" data-custom="${isCustom ? 1 : 0}" alt="Logo" onerror="logoFallback(this)">`;
}
// Called when a logo image fails to load: custom -> default MBU logo -> "DS" text.
function logoFallback(img) {
  const holder = img.parentNode;
  if (img.dataset.custom === '1') { img.dataset.custom = '0'; img.src = DEFAULT_LOGO; return; }
  holder.classList.remove('has-logo');
  holder.textContent = 'DS';
}
function applyLogo(customUrl) {
  const mark = document.querySelector('.brand-mark');
  if (mark) {
    mark.classList.add('has-logo');
    mark.innerHTML = logoMarkup(customUrl || DEFAULT_LOGO, !!customUrl);
  }
  try { if (customUrl) localStorage.setItem('dslab_logo', customUrl); else localStorage.removeItem('dslab_logo'); } catch (e) { /* storage unavailable */ }
}
/* Logo editor modal (header pencil button + Profile page): preview, choose, save, remove/reset. */
async function openLogoEditor(onChange) {
  let current = '';
  try { current = ((await Api.get('/api/settings')) || {}).logo || ''; } catch (e) { /* default logo */ }
  const tile = (src, custom) => `<span class="brand-mark has-logo">${logoMarkup(src, custom)}</span>`;
  const modal = openModal({
    title: 'Edit Logo', closeOnOverlay: false,
    html: `<div class="logo-row">
        <div><span class="field-label">Current logo</span><div class="logo-preview" data-l="current">${tile(current || DEFAULT_LOGO, !!current)}</div></div>
        <div><span class="field-label">Preview</span><div class="logo-preview" data-l="new"><span class="muted" style="font-size:12px">No file chosen</span></div></div>
      </div>
      <p class="muted" style="font-size:13px;margin:12px 0 16px">JPG, JPEG, PNG or WEBP. The logo is used in the header of every page.</p>
      <div class="modal-foot" style="justify-content:space-between;flex-wrap:wrap">
        <button type="button" class="btn btn-danger-soft" data-l="remove" ${current ? '' : 'hidden'}>${icon('trash', 16)} Remove / Reset Logo</button>
        <span class="btn-row">
          <label class="btn btn-light">Choose Logo<input type="file" accept=".png,.jpg,.jpeg,.webp" data-l="file" hidden></label>
          <button type="button" class="btn btn-primary" data-l="save" disabled>Save Logo</button>
          <button type="button" class="btn btn-light" data-close>Cancel</button></span></div>`
  });
  const $l = (n) => modal.querySelector(`[data-l="${n}"]`);
  $l('file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!/\.(png|jpe?g|webp)$/i.test(file.name)) { toast('Logo must be JPG, JPEG, PNG or WEBP.', 'error'); e.target.value = ''; $l('save').disabled = true; return; }
    $l('new').innerHTML = `<img src="${URL.createObjectURL(file)}" alt="New logo preview">`;
    $l('save').disabled = false;
  });
  $l('save').onclick = async (e) => {
    const file = $l('file').files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const st = await withBusy(e.currentTarget, () => Api.put('/api/settings/logo', fd));
      applyLogo(st.logo);
      toast('Logo saved successfully.');
      modal.close();
      if (onChange) onChange(st.logo);
    } catch (err) { toast(err.message, 'error'); }
  };
  $l('remove').onclick = async () => {
    if (!(await confirmDialog('Remove the custom logo and go back to the default MBU logo?', 'Remove'))) return;
    try {
      await Api.remove('/api/settings/logo');
      applyLogo('');
      toast('Logo removed. Default MBU logo restored.');
      modal.close();
      if (onChange) onChange('');
    } catch (err) { toast(err.message, 'error'); }
  };
}
function loadLogo() {
  try { const cached = localStorage.getItem('dslab_logo'); if (cached) applyLogo(cached); } catch (e) { /* ignore */ }
  Api.get('/api/settings').then((st) => applyLogo((st && st.logo) || '')).catch(() => {});
}
document.addEventListener('DOMContentLoaded', () => { renderChrome(); loadLogo(); renderHomeProfile(); });

/* ================= Sub-experiment widgets ================= */
// Preview card shown when a sub-experiment chip (1A, 1B ...) is clicked.
function openSubPreview(exp, sub) {
  const label = subLabel(exp, sub);
  openModal({
    title: `Experiment ${label}`,
    html: `<div class="sub-preview">
      ${sub.coverImage ? `<img class="sp-cover" src="${esc(sub.coverImage)}" alt="">` : `<div class="sp-cover" style="background:${gradientFor(sub.id)}">${esc(label)}</div>`}
      <div class="sp-body"><div><span class="badge badge-accent">EXP ${esc(label)}</span></div>
        <h3>${esc(sub.name)}</h3><p class="muted">${esc(sub.description || 'No short description added.')}</p>
        <div class="btn-row"><a class="btn btn-primary" href="sub-experiment-details.html?id=${encodeURIComponent(sub.id)}">Read More</a>
        ${sub.githubUrl ? `<a class="btn btn-dark" href="${esc(sub.githubUrl)}" target="_blank" rel="noopener">${icon('github', 16)} GitHub</a>` : ''}</div></div></div>`
  });
}

// One editable sub-experiment block (used inside the experiment form and the single sub-experiment modal)
function subBlockHTML(index, sub = {}) {
  const letter = String.fromCharCode(65 + (index % 26));
  const num = sub.number || letter;
  return `<details class="sub-block" open data-id="${esc(sub.id || '')}">
    <summary><span class="sub-badge" data-badge>${esc(num)}</span><span class="sub-title">${esc(sub.name || 'New sub-experiment')}</span>
      <button type="button" class="btn btn-sm btn-danger-soft" data-remove-sub>Remove</button></summary>
    <div class="form-grid">
      <label class="field"><span>Sub-experiment number</span><input data-f="number" value="${esc(num)}" maxlength="6" placeholder="A"></label>
      <label class="field"><span>Name / Topic *</span><input data-f="name" value="${esc(sub.name || '')}" placeholder="e.g. Reading a CSV file"></label>
      <label class="field span-2"><span>Short description</span><textarea data-f="description" rows="2">${esc(sub.description || '')}</textarea></label>
      <div class="span-2">${fileFieldHTML({ name: 'subCover', label: 'Cover image', accept: '.jpg,.jpeg,.png,.webp', current: sub.coverImage, removeName: 'removeCover' })}</div>
      <label class="field span-2"><span>Detailed description <small>(start a line with "## " for a heading)</small></span><textarea data-f="detailedDescription" rows="4">${esc(sub.detailedDescription || '')}</textarea></label>
      <label class="field span-2"><span>Program / Code</span><textarea class="code-input" data-f="code" spellcheck="false">${esc(sub.code || '')}</textarea></label>
      <label class="field span-2"><span>Output</span><textarea data-f="output" rows="3" spellcheck="false">${esc(sub.output || '')}</textarea></label>
      <div class="span-2">${videoFieldsHTML({ fileName: 'subVideo', current: sub.video, removeName: 'removeVideo', linkAttr: 'data-f="youtubeUrl"', linkValue: sub.youtubeUrl || '' })}</div>
      <label class="field span-2"><span>GitHub URL</span><input type="url" data-f="githubUrl" value="${esc(sub.githubUrl || '')}" placeholder="https://github.com/..."></label>
    </div></details>`;
}
// Reads a block into plain fields + chosen files
function readSubBlock(block) {
  const f = (name) => block.querySelector(`[data-f="${name}"]`).value;
  return {
    fields: {
      id: block.dataset.id || '', number: f('number'), name: f('name'), description: f('description'),
      detailedDescription: f('detailedDescription'), code: f('code'), output: f('output'),
      youtubeUrl: f('youtubeUrl'), githubUrl: f('githubUrl'),
      removeCover: !!block.querySelector('[name="removeCover"]:checked'), removeVideo: !!block.querySelector('[name="removeVideo"]:checked')
    },
    cover: block.querySelector('[name="subCover"]').files[0] || null,
    video: block.querySelector('[name="subVideo"]').files[0] || null
  };
}
// Live updates inside sub blocks: title text, badge text, remove button
document.addEventListener('input', (e) => {
  const block = e.target.closest('.sub-block');
  if (!block) return;
  if (e.target.dataset.f === 'name') block.querySelector('.sub-title').textContent = e.target.value || 'New sub-experiment';
  if (e.target.dataset.f === 'number') block.querySelector('[data-badge]').textContent = e.target.value;
});
document.addEventListener('click', (e) => {
  const rm = e.target.closest('[data-remove-sub]');
  if (!rm) return;
  e.preventDefault();
  const block = rm.closest('.sub-block');
  const holder = block.parentElement;
  block.remove();
  if (holder.dataset.renumber) holder.dispatchEvent(new Event('subs-changed'));
});

// Modal to add or edit ONE sub-experiment through its own API endpoints.
function openSubExperimentForm({ experiment, sub = null, onSaved }) {
  const modal = openModal({
    title: sub ? `Edit sub-experiment ${subLabel(experiment, sub)}` : `Add sub-experiment to Experiment ${experiment.experimentNumber}`,
    wide: true, closeOnOverlay: false,
    html: `<form class="form" novalidate>${subBlockHTML((experiment.subExperiments || []).length, sub || {})}
      <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save sub-experiment</button></div></form>`
  });
  const block = modal.querySelector('.sub-block');
  block.querySelector('[data-remove-sub]').remove();
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { fields, cover, video } = readSubBlock(block);
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    if (cover) fd.append('coverImage', cover);
    if (video) fd.append('video', video);
    const url = `/api/experiments/${experiment.id}/sub-experiments` + (sub ? `/${sub.id}` : '');
    try {
      await withBusy(e.submitter, () => (sub ? Api.put(url, fd) : Api.post(url, fd)));
      toast(sub ? 'Sub-experiment updated successfully.' : 'Sub-experiment added successfully.');
      modal.close();
      if (onSaved) onSaved();
    } catch (err) { toast(err.message, 'error'); }
  });
}

/* ================= Module editor (subject-details + module-details) ================= */
function openModuleEditor({ subject, subjects, moduleNumber, onSaved }) {
  // Edit mode: `subject` + `moduleNumber` given. Add mode: only `subjects` (list) given -> user picks number + subject.
  const addMode = !subject;
  const blank = { moduleName: '', pdf: '', videos: [], importantQuestions: [] };
  const mod = addMode ? blank : subject.modules.find((m) => m.moduleNumber === moduleNumber);
  const modal = openModal({
    title: addMode ? 'Add Module' : `${subject.name} - Module ${moduleNumber}`, wide: true, closeOnOverlay: false,
    html: `<form class="form" novalidate>
      ${addMode ? `<label class="field"><span>Module number *</span><select name="moduleNumber">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">Module ${n}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>Module name *</span><input name="moduleName" value="${esc(mod.moduleName)}" placeholder="e.g. Introduction to Data Science"></label>
      ${addMode ? `<label class="field"><span>Subject *</span><select name="subjectId"><option value="">Select Subject</option>${subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><small id="slotHint"></small></label>` : ''}
      ${fileFieldHTML({ name: 'pdf', label: 'PDF * (PDF only)', accept: '.pdf,application/pdf', kind: 'pdf', current: mod.pdf, hint: mod.pdf ? 'Choose a PDF only if you want to replace the current one.' : 'Required.' })}
      ${videoFieldsHTML({ fileName: 'videos', multiple: true, removeName: '', linkValue: mod.videoUrl || '',
        extraBefore: (mod.videos || []).map((v) => `<label class="check"><input type="checkbox" name="keepVideo" value="${esc(v.url)}" checked> Keep: ${esc(v.name || 'Video')}</label>`).join('') })}
      <div class="field"><span class="field-label">Important questions &amp; answers</span><div id="qaList"></div>
        <div><button type="button" class="btn btn-sm btn-light" id="addQa">${icon('plus', 14)} Add question</button></div></div>
      <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">${addMode ? 'Add Module' : 'Save module'}</button></div></form>`
  });
  const list = modal.querySelector('#qaList');
  const addRow = (q = {}) => {
    const row = document.createElement('div');
    row.className = 'qa-row';
    row.innerHTML = `<input data-q placeholder="Question" value="${esc(q.question || '')}"><textarea data-a rows="2" placeholder="Answer">${esc(q.answer || '')}</textarea>
      <button type="button" class="icon-btn" aria-label="Remove question">${icon('x', 16)}</button>`;
    row.querySelector('button').onclick = () => row.remove();
    list.appendChild(row);
  };
  (mod.importantQuestions || []).forEach(addRow);
  modal.querySelector('#addQa').onclick = () => addRow();

  const form = modal.querySelector('form');
  if (addMode) {
    // Warn when the chosen subject already has information in that module number
    const updateHint = () => {
      const s = subjects.find((x) => x.id === form.subjectId.value);
      const m = s && s.modules.find((x) => x.moduleNumber === Number(form.moduleNumber.value));
      modal.querySelector('#slotHint').textContent = m && (m.moduleName || m.pdf)
        ? `Module ${m.moduleNumber} of this subject already has information - saving will update it.` : '';
    };
    form.subjectId.addEventListener('change', updateHint);
    form.moduleNumber.addEventListener('change', updateHint);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subjectId = addMode ? form.subjectId.value : subject.id;
    const number = addMode ? Number(form.moduleNumber.value) : moduleNumber;
    if (!subjectId) { toast('Please select a subject for this module.', 'error'); return; }
    const fd = new FormData();
    fd.append('moduleName', form.moduleName.value);
    fd.append('videoUrl', form.videoUrl.value);
    if (form.pdf.files[0]) fd.append('pdf', form.pdf.files[0]);
    [...form.videos.files].forEach((f) => fd.append('videos', f));
    const removed = [...form.querySelectorAll('[name="keepVideo"]:not(:checked)')].map((c) => c.value);
    fd.append('removeVideos', JSON.stringify(removed));
    const qa = [...list.querySelectorAll('.qa-row')].map((r) => ({ question: r.querySelector('[data-q]').value, answer: r.querySelector('[data-a]').value }));
    // In add mode with no questions typed, send nothing so an existing slot keeps its questions
    if (!(addMode && !qa.length)) fd.append('importantQuestions', JSON.stringify(qa));
    try {
      await withBusy(e.submitter, () => Api.put(`/api/subjects/${subjectId}/modules/${number}`, fd));
      toast(addMode ? 'Module added successfully.' : 'Module updated successfully.');
      modal.close();
      if (onSaved) onSaved();
    } catch (err) { toast(err.message, 'error'); }
  });
}
async function clearModule(subject, moduleNumber, onDone) {
  if (!(await confirmDialog(`Clear all information (name, PDF, videos, questions) of Module ${moduleNumber}?`, 'Clear'))) return;
  try {
    const fd = new FormData();
    fd.append('clear', 'true');
    await Api.put(`/api/subjects/${subject.id}/modules/${moduleNumber}`, fd);
    toast(`Module ${moduleNumber} information cleared.`);
    if (onDone) onDone();
  } catch (err) { toast(err.message, 'error'); }
}

/* ================= Reusable Tools / Resources page ================= */
/* cfg: { endpoint, singular, plural, categories[], visitLabel, emptyText, iconName, addedMsg... } */
function initCatalogPage(cfg) {
  const grid = document.getElementById('grid');
  const search = document.getElementById('searchInput');
  const catFilter = document.getElementById('categoryFilter');
  let items = [];

  const catOptions = (selected) => {
    const cats = [...cfg.categories];
    if (selected && !cats.includes(selected)) cats.push(selected);
    return cats.map((c) => `<option ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join('');
  };

  function render() {
    const q = search.value.trim().toLowerCase();
    const cat = catFilter.value;
    const shown = items.filter((i) => (!cat || i.category === cat) &&
      (!q || [i.name, i.category, ...(i.tags || [])].join(' ').toLowerCase().includes(q)));
    if (!items.length) {
      grid.innerHTML = emptyStateHTML(cfg.emptyText, `Use "Add ${cfg.singular}" to create your first one.`, cfg.iconName);
      return;
    }
    if (!shown.length) { grid.innerHTML = emptyStateHTML(`No ${cfg.plural.toLowerCase()} match your search.`, 'Try a different keyword or category.', 'search'); return; }
    grid.innerHTML = shown.map((i) => `<article class="card" data-id="${i.id}">
      <div class="cc-top"><div class="cc-icon" style="background:${gradientFor(i.id)}">${i.image ? `<img src="${esc(i.image)}" alt="">` : esc(initials(i.name))}</div>
        <div class="cc-title"><h3>${esc(i.name)}</h3><span class="badge badge-accent">${esc(i.category)}</span></div>
        ${kebabHTML([{ action: 'view', label: 'View details', icon: 'eye' }, { action: 'edit', label: 'Edit', icon: 'edit' }, { action: 'delete', label: 'Delete', icon: 'trash', danger: true }])}</div>
      <div class="card-body">${i.video || i.videoUrl ? `<div class="indicators"><span>${icon('video', 14)} Video</span></div>` : ''}<p class="card-text clamp-3">${esc(i.description || 'No description added.')}</p>
        ${(i.tags || []).length ? `<div class="tag-list">${i.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</div>
      <div class="card-actions"><span class="badge prio-${esc(i.priority)}">${esc(i.priority)} priority</span><span class="spacer"></span>
        <button class="btn btn-light btn-sm" data-action="view">Details</button>
        ${i.url ? `<a class="btn btn-primary btn-sm" href="${esc(i.url)}" target="_blank" rel="noopener">${esc(cfg.visitLabel)}</a>` : ''}</div></article>`).join('');
  }

  function fillCategoryFilter() {
    const used = [...new Set(items.map((i) => i.category))].sort();
    const current = catFilter.value;
    catFilter.innerHTML = '<option value="">All categories</option>' + used.map((c) => `<option ${c === current ? 'selected' : ''}>${esc(c)}</option>`).join('');
  }

  async function load() {
    try { items = await Api.get(cfg.endpoint); fillCategoryFilter(); render(); }
    catch (err) { grid.innerHTML = ''; toast(err.message, 'error'); }
  }

  function openForm(item = null) {
    const modal = openModal({
      title: item ? `Edit ${cfg.singular.toLowerCase()}` : `Add ${cfg.singular.toLowerCase()}`, wide: true, closeOnOverlay: false,
      html: `<form class="form" novalidate><div class="form-grid">
        <label class="field"><span>${cfg.singular} name *</span><input name="name" value="${esc(item ? item.name : '')}"></label>
        <label class="field"><span>Category</span><select name="category">${catOptions(item ? item.category : cfg.categories[0])}</select></label>
        <label class="field span-2"><span>Description</span><textarea name="description" rows="3">${esc(item ? item.description : '')}</textarea></label>
        <label class="field span-2"><span>Website URL</span><input type="url" name="url" placeholder="https://..." value="${esc(item ? item.url : '')}"></label>
        <div class="span-2">${fileFieldHTML({ name: 'image', label: 'Image / icon (optional)', accept: '.jpg,.jpeg,.png,.webp', current: item && item.image, removeName: 'removeImage' })}</div>
        <div class="span-2">${videoFieldsHTML({ label: cfg.videoLabel, fileName: 'video', current: item && item.video, removeName: 'removeVideo', linkValue: item ? item.videoUrl : '' })}</div>
        <label class="field"><span>Priority / importance</span><select name="priority">${['High', 'Medium', 'Low'].map((p) => `<option ${(item ? item.priority : 'Medium') === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
        <label class="field"><span>Tags (comma separated)</span><input name="tags" value="${esc(item ? (item.tags || []).join(', ') : '')}" placeholder="python, beginner"></label>
        <label class="field span-2"><span>Notes</span><textarea name="notes" rows="3">${esc(item ? item.notes : '')}</textarea></label></div>
        <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save ${cfg.singular.toLowerCase()}</button></div></form>`
    });
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await withBusy(e.submitter, () => (item ? Api.put(`${cfg.endpoint}/${item.id}`, fd) : Api.post(cfg.endpoint, fd)));
        toast(`${cfg.singular} ${item ? 'updated' : 'added'} successfully.`);
        modal.close();
        load();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  function openDetails(item) {
    openModal({
      title: `${cfg.singular} details`,
      html: `<div class="cc-top" style="padding:0 0 14px"><div class="cc-icon" style="background:${gradientFor(item.id)}">${item.image ? `<img src="${esc(item.image)}" alt="">` : esc(initials(item.name))}</div>
        <div class="cc-title"><h3>${esc(item.name)}</h3><span class="badge badge-accent">${esc(item.category)}</span> <span class="badge prio-${esc(item.priority)}">${esc(item.priority)} priority</span></div></div>
        <p>${esc(item.description || 'No description added.')}</p>
        ${mediaHTML({ video: item.video, videoUrl: item.videoUrl })}
        ${item.notes ? `<h4>Notes</h4><p style="white-space:pre-wrap">${esc(item.notes)}</p>` : ''}
        ${(item.tags || []).length ? `<div class="tag-list">${item.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        ${item.url ? `<p style="margin-top:16px"><a class="btn btn-primary" href="${esc(item.url)}" target="_blank" rel="noopener">${icon('external', 16)} ${esc(cfg.visitLabel)}</a></p>` : ''}`
    });
  }

  onAction(grid, {
    view: (id) => openDetails(items.find((i) => i.id === id)),
    edit: (id) => openForm(items.find((i) => i.id === id)),
    delete: async (id) => {
      if (!(await confirmDialog(`Are you sure you want to delete this ${cfg.singular.toLowerCase()}?`))) return;
      try { await Api.remove(`${cfg.endpoint}/${id}`); toast(`${cfg.singular} deleted successfully.`); load(); }
      catch (err) { toast(err.message, 'error'); }
    }
  });
  document.getElementById('addBtn').onclick = () => openForm();
  search.addEventListener('input', debounce(render, 120));
  catFilter.addEventListener('change', render);
  grid.innerHTML = '<div class="loading">Loading...</div>';
  load();
}


/* ================= Run Code (experiments + sub-experiments) ================= */
const RUN_ALIASES = { python: 'python', python3: 'python', py: 'python', javascript: 'javascript', js: 'javascript', node: 'javascript', nodejs: 'javascript', java: 'java', c: 'c', 'c++': 'cpp', cpp: 'cpp', r: 'r' };
let runnerLanguages = null;
function loadRunnerLanguages() {
  if (!runnerLanguages) runnerLanguages = Api.get('/api/run/languages').catch(() => []);
  return runnerLanguages;
}
/* Renders an editable code editor + Run Code button + Execution Output area into `container`.
   options: { code, language, title, onSave(code) -> Promise, onSaveOutput(text) -> Promise } */
async function mountCodeRunner(container, { code = '', language = '', title = 'Experiment Code', onSave, onSaveOutput }) {
  const langs = await loadRunnerLanguages();
  const guess = RUN_ALIASES[String(language).trim().toLowerCase()] || '';
  const selected = guess || (langs.find((l) => l.available) || {}).id || '';
  let savedCode = code;
  container.innerHTML = `
    <section class="panel"><h2>${esc(title)}</h2>
      <div class="runner-bar"><label class="runner-lang"><span>Run as</span><select data-r="lang">${langs.map((l) => `<option value="${l.id}" ${l.id === selected ? 'selected' : ''}>${esc(l.label)}${l.available ? '' : ' (not installed)'}</option>`).join('')}</select></label>
        ${language && !guess ? `<span class="badge badge-orange">"${esc(language)}" cannot be executed here - pick a language to run as</span>` : ''}</div>
      <textarea class="code-input runner-editor" data-r="code" spellcheck="false" aria-label="Code editor">${esc(code)}</textarea>
      <div class="btn-row" style="margin-top:12px">
        <button type="button" class="btn btn-primary" data-r="run">&#9654; Run Code</button>
        <button type="button" class="btn btn-light" data-r="save">Save Code</button>
        <button type="button" class="btn btn-light" data-r="reset">Reset</button>
        <button type="button" class="btn btn-light" data-r="copy">${icon('copy', 14)} COPY CODE</button></div></section>
    <section class="panel"><h2>Execution Output</h2>
      <div class="exec-head"><span class="status-pill idle" data-r="status">Not run yet</span><span class="muted" data-r="meta"></span></div>
      <pre class="exec-output" data-r="out">Click "Run Code" to see the output here.</pre>
      <div data-r="errBox"></div>
      <div class="btn-row" data-r="after" hidden style="margin-top:12px"><button type="button" class="btn btn-light btn-sm" data-r="useOutput">Save this as the experiment's output</button></div></section>`;
  const $r = (n) => container.querySelector(`[data-r="${n}"]`);
  const editor = $r('code');
  let lastStdout = '';

  editor.addEventListener('keydown', (e) => {          // Tab inserts 4 spaces instead of leaving the editor
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b } = editor;
    editor.setRangeText('    ', a, b, 'end');
  });

  const setStatus = (cls, text) => { const el = $r('status'); el.className = `status-pill ${cls}`; el.textContent = text; };
  function show(res) {
    const labels = { success: ['success', 'Success'], error: ['failed', 'Failed'], timeout: ['failed', 'Timed out'], unavailable: ['failed', 'Unavailable'], failed: ['failed', 'Failed'] };
    const [cls, text] = labels[res.status] || labels.failed;
    setStatus(cls, text);
    $r('meta').textContent = res.durationMs !== undefined ? `${res.language || ''} · ${res.durationMs} ms · exit code ${res.exitCode}` : '';
    lastStdout = res.stdout || '';
    $r('out').textContent = res.stdout ? res.stdout : (res.status === 'success' ? '(The program finished without printing anything.)' : '(no output)');
    const box = $r('errBox');
    if (res.status === 'success') box.innerHTML = res.stderr ? `<div class="exec-warn"><strong>Messages</strong><pre>${esc(res.stderr)}</pre></div>` : '';
    else box.innerHTML = `<div class="exec-error"><strong>Execution Error</strong><pre>${esc([res.message, res.stderr].filter(Boolean).join('\n\n'))}</pre></div>`;
    $r('after').hidden = !(res.status === 'success' && onSaveOutput);
  }

  $r('run').onclick = async (e) => {
    const btn = e.currentTarget;
    setStatus('running', 'Running...'); $r('meta').textContent = ''; $r('errBox').innerHTML = ''; $r('after').hidden = true;
    $r('out').textContent = 'Running...';
    btn.disabled = true;
    try { show(await Api.post('/api/run', { language: $r('lang').value, code: editor.value })); }
    catch (err) { show({ status: 'failed', message: err.message, stdout: '', stderr: '' }); }
    finally { btn.disabled = false; }
  };
  $r('save').onclick = async (e) => {
    if (!onSave) return;
    try { await withBusy(e.currentTarget, () => onSave(editor.value)); savedCode = editor.value; toast('Code saved successfully.'); }
    catch (err) { toast(err.message, 'error'); }
  };
  $r('reset').onclick = () => { editor.value = savedCode; };
  $r('copy').onclick = () => copyText(editor.value);
  $r('useOutput').onclick = async (e) => {
    if (!onSaveOutput) return;
    try { await withBusy(e.currentTarget, () => onSaveOutput(lastStdout)); toast('Output saved successfully.'); }
    catch (err) { toast(err.message, 'error'); }
  };
}