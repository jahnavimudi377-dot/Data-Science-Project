/* subjects.js - Subjects page: list, search, add, edit, delete, quick PDF upload */
(function () {
  const grid = document.getElementById('grid');
  const search = document.getElementById('searchInput');
  let subjects = [];

  const modulesDone = (s) => s.modules.filter((m) => m.moduleName || m.pdf).length;

  function render() {
    const q = search.value.trim().toLowerCase();
    const shown = subjects.filter((s) => !q || `${s.name} ${s.code}`.toLowerCase().includes(q));
    if (!subjects.length) {
      grid.innerHTML = emptyStateHTML('No subjects added yet.', 'Add your first subject to start building its five modules.', 'book');
      return;
    }
    if (!shown.length) { grid.innerHTML = emptyStateHTML('No subjects match your search.', 'Try a different name or code.', 'search'); return; }
    grid.innerHTML = shown.map((s) => {
      const done = modulesDone(s);
      return `<article class="card" data-id="${s.id}">
        <a class="card-cover" href="subject-details.html?id=${s.id}" aria-label="Open ${esc(s.name)}">${coverHTML(s.coverImage, s.id, s.name)}</a>
        <div class="card-body">
          <div class="card-meta">${s.code ? `<span class="badge badge-accent">${esc(s.code)}</span>` : ''}<span class="badge">Semester ${s.semester}</span></div>
          <h3 class="card-title"><a href="subject-details.html?id=${s.id}">${esc(s.name)}</a></h3>
          <p class="card-text clamp-3">${esc(s.description || 'No description added.')}</p>
          <div class="progress-dots" title="${done} of 5 modules have information">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= done ? 'on' : ''}"></i>`).join('')}<span>${done}/5 modules</span></div>
          <div class="pdf-line">${s.pdf
            ? `<a href="${esc(s.pdf)}" target="_blank" rel="noopener">${icon('file', 16)} Open PDF</a>`
            : `<label>${icon('upload', 16)} Upload PDF<input type="file" accept=".pdf,application/pdf" data-quick-pdf data-kind="pdf"></label>`}</div>
        </div>
        <div class="card-actions">
          <a class="btn btn-primary btn-sm" href="subject-details.html?id=${s.id}">View</a>
          <button class="btn btn-light btn-sm" data-action="edit">Edit</button><span class="spacer"></span>
          ${kebabHTML([{ action: 'edit', label: 'Edit', icon: 'edit' }, { action: 'delete', label: 'Delete', icon: 'trash', danger: true }], true)}
        </div></article>`;
    }).join('');
  }

  async function load() {
    try { subjects = await Api.get('/api/subjects'); render(); }
    catch (err) { grid.innerHTML = ''; toast(err.message, 'error'); }
  }

  function openForm(subject = null) {
    const modal = openModal({
      title: subject ? 'Edit subject' : 'Add subject', wide: true, closeOnOverlay: false,
      html: `<form class="form" novalidate><div class="form-grid">
        <label class="field span-2"><span>Subject / module name *</span><input name="name" value="${esc(subject ? subject.name : '')}" placeholder="e.g. Introduction to Data Science"></label>
        <label class="field"><span>Subject code</span><input name="code" value="${esc(subject ? subject.code : '')}" placeholder="e.g. DS101"></label>
        <label class="field"><span>Semester</span><select name="semester">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${subject && subject.semester === n ? 'selected' : ''}>Semester ${n}</option>`).join('')}</select></label>
        <label class="field span-2"><span>Short description</span><textarea name="description" rows="3">${esc(subject ? subject.description : '')}</textarea></label>
        ${fileFieldHTML({ name: 'coverImage', label: 'Cover image (JPG, PNG, WEBP)', accept: '.jpg,.jpeg,.png,.webp', current: subject && subject.coverImage, removeName: 'removeCover' })}
        ${fileFieldHTML({ name: 'pdf', label: 'PDF (optional)', kind: 'pdf', accept: '.pdf,application/pdf', current: subject && subject.pdf, removeName: 'removePdf' })}
        </div><p class="muted" style="margin:0;font-size:13px">Every subject automatically gets five modules (Module 1 to Module 5) that you fill in on its details page.</p>
        <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save subject</button></div></form>`
    });
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await withBusy(e.submitter, () => (subject ? Api.put(`/api/subjects/${subject.id}`, fd) : Api.post('/api/subjects', fd)));
        toast(`Subject ${subject ? 'updated' : 'added'} successfully.`);
        modal.close();
        load();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  onAction(grid, {
    edit: (id) => openForm(subjects.find((s) => s.id === id)),
    delete: async (id) => {
      if (!(await confirmDialog('Are you sure you want to delete this subject? Its modules and files will be removed too.'))) return;
      try { await Api.remove(`/api/subjects/${id}`); toast('Subject deleted successfully.'); load(); }
      catch (err) { toast(err.message, 'error'); }
    }
  });

  // Quick "Upload PDF" link on a card
  grid.addEventListener('change', async (e) => {
    if (!e.target.matches('[data-quick-pdf]') || !e.target.files[0]) return;
    const id = e.target.closest('[data-id]').dataset.id;
    const fd = new FormData();
    fd.append('pdf', e.target.files[0]);
    try { await Api.put(`/api/subjects/${id}`, fd); toast('File uploaded successfully.'); load(); }
    catch (err) { toast(err.message, 'error'); }
  });

  // "+ Add Module": module form (number, name, subject, PDF, videos, questions) - no semester field
  document.getElementById('addBtn').onclick = () => {
    if (!subjects.length) { toast('Add a subject first, then add modules to it.', 'error'); return; }
    openModuleEditor({ subjects, onSaved: load });
  };
  // Subjects remain the parent category, so they can still be created here
  document.getElementById('addSubjectBtn').onclick = () => openForm();
  search.addEventListener('input', debounce(render, 120));
  grid.innerHTML = '<div class="loading">Loading...</div>';
  load().then(() => {
    const editId = qs('edit');
    if (editId) { const s = subjects.find((x) => x.id === editId); if (s) openForm(s); }
  });
})();
