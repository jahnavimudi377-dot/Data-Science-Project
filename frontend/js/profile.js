/* profile.js - student profile view + edit */
(function () {
  const content = document.getElementById('content');
  let profile = null;

  const hasData = (p) => p && (p.name || p.class || p.branch || p.rollNumber || p.section || p.facultyName || p.gitRepoUrl || p.profileImage);

  function render() {
    if (!hasData(profile)) {
      content.innerHTML = emptyStateHTML('Profile information not added.', 'Add your name, class, branch and faculty to show them on the profile card.', 'user',
        '<button class="btn btn-primary" data-action="edit">Edit Profile</button>');
      return;
    }
    const item = (label, value) => `<div class="info-item"><small>${label}</small><b>${value ? esc(value) : 'Not added'}</b></div>`;
    content.innerHTML = `<section class="profile-card">
      <div class="profile-photo">${profile.profileImage ? `<img src="${esc(profile.profileImage)}" alt="Profile photo">` : esc(initials(profile.name))}</div>
      <div><h2 style="font-size:1.7rem">${esc(profile.name || 'Student')}</h2>
        <div class="info-grid">${item('Class', profile.class)}${item('Branch', profile.branch)}${item('Roll number', profile.rollNumber)}
          ${item('Section', profile.section)}${item('Faculty name', profile.facultyName)}</div>
        ${profile.gitRepoUrl ? `<a class="btn btn-dark" href="${esc(profile.gitRepoUrl)}" target="_blank" rel="noopener">${icon('github', 16)} Git repository</a>` : '<span class="muted">Git repository not added.</span>'}
      </div></section>`;
  }

  function openForm() {
    const p = profile || {};
    const field = (name, label, placeholder = '', type = 'text') => `<label class="field"><span>${label}</span><input type="${type}" name="${name}" value="${esc(p[name] || '')}" placeholder="${placeholder}"></label>`;
    const modal = openModal({
      title: 'Edit profile', wide: true, closeOnOverlay: false,
      html: `<form class="form" novalidate><div class="form-grid">
        ${field('name', 'Name')}${field('class', 'Class', 'e.g. 3rd year')}${field('branch', 'Branch', 'e.g. Data Science')}
        ${field('rollNumber', 'Roll number')}${field('section', 'Section')}${field('facultyName', 'Faculty name')}
        <div class="span-2">${field('gitRepoUrl', 'Git repository URL', 'https://github.com/...', 'url')}</div>
        <div class="span-2">${fileFieldHTML({ name: 'profileImage', label: 'Profile image (JPG, PNG, WEBP)', accept: '.jpg,.jpeg,.png,.webp', current: p.profileImage, removeName: 'removeImage' })}</div></div>
        <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save profile</button></div></form>`
    });
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        profile = await withBusy(e.submitter, () => Api.put('/api/profile', new FormData(e.target)));
        toast('Profile saved successfully.');
        modal.close();
        render();
        refreshProfileChip();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  /* ---------- Logo section: current logo + Edit Logo (shared editor from main.js) ---------- */
  async function initLogoPanel() {
    const box = document.getElementById('logoPanel');
    let logo = '';
    try { logo = ((await Api.get('/api/settings')) || {}).logo || ''; } catch (e) { /* default logo */ }
    box.innerHTML = `<section class="panel"><h2>Logo</h2>
      <div class="logo-row"><div><span class="field-label">Current logo</span>
        <div class="logo-preview"><span class="brand-mark has-logo">${logoMarkup(logo || DEFAULT_LOGO, !!logo)}</span></div></div></div>
      <div class="btn-row" style="margin-top:14px"><button type="button" class="btn btn-primary" id="editLogoBtn">${icon('edit', 16)} Edit Logo</button></div></section>`;
    box.querySelector('#editLogoBtn').onclick = () => openLogoEditor(initLogoPanel);
  }
  initLogoPanel();

  document.getElementById('editBtn').onclick = openForm;
  onAction(content, { edit: openForm });
  Api.get('/api/profile').then((p) => { profile = p; render(); if (qs('edit')) openForm(); })
    .catch((err) => { content.innerHTML = ''; toast(err.message, 'error'); });
})();