/* subject-details.js - one subject + its five module cards */
(function () {
  const content = document.getElementById('content');
  const id = qs('id');
  let subject = null;

  function render() {
    const s = subject;
    document.title = `${s.name} | DS LAB`;
    content.innerHTML = `
      <nav class="breadcrumb"><a href="subjects.html">Subjects</a><span>${esc(s.name)}</span></nav>
      <section class="detail-head ${s.coverImage ? '' : 'no-cover'}">
        ${s.coverImage ? `<div class="detail-cover">${coverHTML(s.coverImage, s.id, s.name)}</div>` : ''}
        <div>
          <div class="card-meta" style="margin-bottom:10px">${s.code ? `<span class="badge badge-accent">${esc(s.code)}</span>` : ''}<span class="badge">Semester ${s.semester}</span></div>
          <h1>${esc(s.name)}</h1>
          <p class="muted">${esc(s.description || 'No description added.')}</p>
          <div class="btn-row">
            ${s.pdf ? `<a class="btn btn-primary" href="${esc(s.pdf)}" target="_blank" rel="noopener">${icon('file', 16)} Open PDF</a>` : '<span class="muted">No subject PDF uploaded.</span>'}
            <a class="btn btn-light" href="subjects.html?edit=${s.id}">${icon('edit', 16)} Edit subject</a>
          </div>
        </div>
      </section>
      <h2 style="margin-bottom:14px">Modules</h2>
      <div class="module-grid">${s.modules.map(moduleCard).join('')}</div>`;
  }

  function moduleCard(m) {
    const filled = !!(m.moduleName || m.pdf);
    return `<article class="card module-card ${filled ? 'filled' : ''}" data-id="${m.moduleNumber}">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="module-num">Module ${m.moduleNumber}</span>
        ${kebabHTML([{ action: 'edit', label: 'Edit', icon: 'edit' }, { action: 'clear', label: 'Delete / Clear information', icon: 'eraser', danger: true }])}</div>
      ${filled ? `<h3>${esc(m.moduleName || 'Untitled module')}</h3>
        <div class="indicators">${m.pdf ? `<span>${icon('file', 14)} PDF</span>` : ''}${(m.videos || []).length || m.videoUrl ? `<span>${icon('video', 14)} Video</span>` : ''}${(m.importantQuestions || []).length ? `<span>${m.importantQuestions.length} Q&amp;A</span>` : ''}</div>
        <div class="btn-row" style="margin-top:auto"><a class="btn btn-primary btn-sm" href="module-details.html?id=${subject.id}&module=${m.moduleNumber}">View Module</a></div>`
      : `<h3 class="muted">Not added</h3><p class="empty-inline">Module information not added yet.</p>
        <div class="btn-row" style="margin-top:auto"><button class="btn btn-light btn-sm" data-action="edit">${icon('plus', 14)} Add information</button></div>`}
    </article>`;
  }

  async function load() {
    try { subject = await Api.get(`/api/subjects/${encodeURIComponent(id)}`); render(); }
    catch (err) {
      content.innerHTML = emptyStateHTML('Subject not found.', err.message, 'book', '<a class="btn btn-primary" href="subjects.html">Back to subjects</a>');
    }
  }

  onAction(content, {
    edit: (num) => openModuleEditor({ subject, moduleNumber: Number(num), onSaved: load }),
    clear: (num) => clearModule(subject, Number(num), load)
  });
  load();
})();
