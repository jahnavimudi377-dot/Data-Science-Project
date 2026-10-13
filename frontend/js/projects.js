/* projects.js - Projects page: cards, search, filter, sort, add / edit (with media + tech stack tags), delete */
(function () {
  const grid = document.getElementById('grid');
  const search = document.getElementById('searchInput');
  const fCategory = document.getElementById('filterCategory');
  const fStatus = document.getElementById('filterStatus');
  const fTech = document.getElementById('filterTech');
  const sortBy = document.getElementById('sortBy');
  const resultCount = document.getElementById('resultCount');
  let projects = [];

  const STATUSES = ['Planned', 'In Progress', 'Completed', 'On Hold'];
  const STATUS_BADGE = { Planned: 'badge-accent', 'In Progress': 'badge-orange', Completed: 'badge-teal', 'On Hold': 'badge-pink' };
  const SORTERS = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    titleAsc: (a, b) => a.title.localeCompare(b.title),
    titleDesc: (a, b) => b.title.localeCompare(a.title)
  };

  /* Filters only appear when at least one project has matching data */
  function fillSelect(select, allLabel, values) {
    const keep = select.value;
    select.hidden = values.length === 0;
    select.innerHTML = `<option value="">${allLabel}</option>` + values.map((v) => `<option>${esc(v)}</option>`).join('');
    select.value = values.includes(keep) ? keep : '';
  }
  function fillFilters() {
    fillSelect(fCategory, 'All categories', [...new Set(projects.map((p) => p.category).filter(Boolean))].sort());
    fillSelect(fStatus, 'All statuses', [...new Set(projects.map((p) => p.status).filter(Boolean))].sort());
    fillSelect(fTech, 'All technologies', [...new Set(projects.flatMap((p) => p.techStack || []))].sort((a, b) => a.localeCompare(b)));
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (fCategory.value && p.category !== fCategory.value) return false;
      if (fStatus.value && p.status !== fStatus.value) return false;
      if (fTech.value && !(p.techStack || []).includes(fTech.value)) return false;
      if (!q) return true;
      return [p.title, p.shortDescription, p.detailedDescription, p.category, ...(p.techStack || [])].join(' ').toLowerCase().includes(q);
    });
    list.sort(SORTERS[sortBy.value]);
    resultCount.textContent = projects.length ? `Showing ${list.length} of ${projects.length} project${projects.length > 1 ? 's' : ''}` : '';
    if (!projects.length) {
      grid.innerHTML = emptyStateHTML('No projects added yet.', 'Showcase your work by adding your first project.', 'folder',
        '<button class="btn btn-primary" data-action="add">Add Project</button>');
      return;
    }
    if (!list.length) { grid.innerHTML = emptyStateHTML('No projects match your filters.', 'Clear the search or change the filters.', 'search'); return; }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  function cardHTML(p) {
    const tech = p.techStack || [];
    return `<article class="card" data-id="${p.id}">
      <span class="cover-badge">${esc(p.status)}</span>
      <div class="card-kebab">${kebabHTML([{ action: 'edit', label: 'Edit', icon: 'edit' }, { action: 'delete', label: 'Delete', icon: 'trash', danger: true }])}</div>
      <a class="card-cover" href="project-details.html?id=${p.id}" aria-label="Open ${esc(p.title)}">${coverHTML(p.coverImage, p.id, p.title)}</a>
      <div class="card-body">
        ${p.category ? `<div class="card-meta"><span class="badge ${STATUS_BADGE[p.status] || ''}">${esc(p.category)}</span></div>` : ''}
        <h3 class="card-title"><a href="project-details.html?id=${p.id}">${esc(p.title)}</a></h3>
        <p class="card-text clamp-3">${esc(p.shortDescription)}</p>
        <div class="tag-list">${tech.slice(0, 5).map((t) => `<span class="tag tech">${esc(t)}</span>`).join('')}${tech.length > 5 ? `<span class="tag">+${tech.length - 5}</span>` : ''}</div>
      </div>
      <div class="card-actions wrap">
        <a class="btn btn-primary btn-sm" href="project-details.html?id=${p.id}">View Project</a>
        ${p.githubUrl ? `<a class="btn btn-dark btn-sm" href="${esc(p.githubUrl)}" target="_blank" rel="noopener">${icon('github', 14)} GitHub</a>` : ''}
        ${p.liveUrl ? `<a class="btn btn-light btn-sm" href="${esc(p.liveUrl)}" target="_blank" rel="noopener">${icon('globe', 14)} Live Demo</a>` : ''}
        ${p.linkedinUrl ? `<a class="btn btn-light btn-sm" href="${esc(p.linkedinUrl)}" target="_blank" rel="noopener">${icon('linkedin', 14)} LinkedIn</a>` : ''}
      </div></article>`;
  }

  async function load() {
    try { projects = await Api.get('/api/projects'); fillFilters(); render(); }
    catch (err) { grid.innerHTML = ''; toast(err.message, 'error'); }
  }

  /* ---------- Add / edit form ---------- */
  function openForm(project = null) {
    const p = project || {};
    const techs = [...(p.techStack || [])];
    const knownTech = [...new Set([...projects.flatMap((x) => x.techStack || []), 'Python', 'Java', 'JavaScript', 'HTML', 'CSS', 'Node.js', 'Express', 'SQL', 'Pandas', 'NumPy', 'Machine Learning'])];
    const categories = [...new Set([...projects.map((x) => x.category).filter(Boolean), 'Web Application', 'Data Analysis', 'Machine Learning', 'Research', 'Mobile App'])];
    const modal = openModal({
      title: project ? 'Edit project' : 'Add project', wide: true, closeOnOverlay: false,
      html: `<form class="form" novalidate>
        <div class="form-grid">
          <label class="field span-2"><span>Project title *</span><input name="title" value="${esc(p.title || '')}" placeholder="e.g. Student Performance Predictor"></label>
          <label class="field span-2"><span>Short description *</span><textarea name="shortDescription" rows="2">${esc(p.shortDescription || '')}</textarea></label>
          <label class="field span-2"><span>Detailed description * <small>(blank line = new paragraph, "## " at the start of a line = sub-heading)</small></span><textarea name="detailedDescription" rows="6">${esc(p.detailedDescription || '')}</textarea></label>
          <div class="field span-2"><span class="field-label">Tech stack * <small class="muted">(type a technology and press Enter or comma)</small></span>
            <div class="tech-input" data-tech><span data-chips></span><input data-tech-input list="techList" placeholder="Add technology..."><datalist id="techList">${knownTech.map((t) => `<option value="${esc(t)}">`).join('')}</datalist></div></div>
        </div>
        <h4 class="form-section">Project information</h4>
        <div class="form-grid">
          <label class="field"><span>Project category</span><input name="category" list="catList" value="${esc(p.category || '')}" placeholder="e.g. Web Application"><datalist id="catList">${categories.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
          <label class="field"><span>Project status</span><select name="status">${STATUSES.map((s) => `<option ${(p.status || 'In Progress') === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          <label class="field"><span>Start date</span><input type="date" name="startDate" value="${esc(p.startDate || '')}"></label>
          <label class="field"><span>Completion date</span><input type="date" name="completionDate" value="${esc(p.completionDate || '')}"></label>
          <label class="field span-2"><span>Key features <small>(one per line)</small></span><textarea name="keyFeatures" rows="4">${esc((p.keyFeatures || []).join('\n'))}</textarea></label>
          <label class="field span-2"><span>My role / contribution</span><textarea name="role" rows="3">${esc(p.role || '')}</textarea></label>
        </div>
        <h4 class="form-section">Links</h4>
        <div class="form-grid">
          <label class="field"><span>GitHub URL</span><input type="url" name="githubUrl" value="${esc(p.githubUrl || '')}" placeholder="https://github.com/..."></label>
          <label class="field"><span>LinkedIn URL</span><input type="url" name="linkedinUrl" value="${esc(p.linkedinUrl || '')}" placeholder="https://linkedin.com/..."></label>
          <label class="field"><span>Live demo URL</span><input type="url" name="liveUrl" value="${esc(p.liveUrl || '')}" placeholder="https://..."></label>
          <label class="field"><span>Other project URL (optional)</span><input type="url" name="otherUrl" value="${esc(p.otherUrl || '')}" placeholder="https://..."></label>
        </div>
        <h4 class="form-section">Media</h4>
        <div class="form-grid">
          <div class="span-2">${fileFieldHTML({ name: 'coverImage', label: 'Project cover image (JPG, PNG, WEBP)', accept: '.jpg,.jpeg,.png,.webp', current: p.coverImage, removeName: 'removeCover' })}</div>
          <div class="span-2">${videoFieldsHTML({ label: 'Project video (Optional)', fileName: 'video', current: p.video, removeName: 'removeVideo', linkAttr: 'name="youtubeUrl"', linkValue: p.youtubeUrl || '' })}</div>
          <div class="span-2">${fileFieldHTML({ name: 'pdf', label: 'Project documentation PDF (optional)', accept: '.pdf,application/pdf', kind: 'pdf', current: p.pdf, removeName: 'removePdf' })}</div>
        </div>
        <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">${project ? 'Save project' : 'Add Project'}</button></div></form>`
    });

    // Tech stack tag input: any technology can be typed
    const form = modal.querySelector('form');
    const chips = modal.querySelector('[data-chips]');
    const techInput = modal.querySelector('[data-tech-input]');
    const drawChips = () => {
      chips.innerHTML = techs.map((t, i) => `<span class="tag tech">${esc(t)}<button type="button" data-rm="${i}" aria-label="Remove ${esc(t)}">&times;</button></span>`).join(' ');
    };
    const addTech = (raw) => {
      raw.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => { if (!techs.some((x) => x.toLowerCase() === t.toLowerCase())) techs.push(t); });
      techInput.value = '';
      drawChips();
    };
    drawChips();
    techInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTech(techInput.value); }
      else if (e.key === 'Backspace' && !techInput.value && techs.length) { techs.pop(); drawChips(); }
    });
    techInput.addEventListener('change', () => { if (techInput.value.includes(',')) addTech(techInput.value); });
    techInput.addEventListener('blur', () => addTech(techInput.value));
    chips.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { techs.splice(Number(rm.dataset.rm), 1); drawChips(); }
    });
    modal.querySelector('[data-tech]').addEventListener('click', () => techInput.focus());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      addTech(techInput.value);                      // include a technology that was typed but not confirmed yet
      const problem = !form.elements.title.value.trim() ? 'Project title is required.'
        : !form.shortDescription.value.trim() ? 'Short description is required.'
        : !form.detailedDescription.value.trim() ? 'Detailed description is required.'
        : !techs.length ? 'Add at least one technology to the tech stack.' : '';
      if (problem) { toast(problem, 'error'); return; }
      const fd = new FormData(form);
      fd.set('techStack', JSON.stringify(techs));
      try {
        await withBusy(e.submitter, () => (project ? Api.put(`/api/projects/${project.id}`, fd) : Api.post('/api/projects', fd)));
        toast(project ? 'Project updated successfully.' : 'Project added successfully.');
        modal.close();
        load();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  onAction(grid, {
    add: () => openForm(),
    edit: (id) => openForm(projects.find((x) => x.id === id)),
    delete: async (id) => {
      if (!(await confirmDialog('Are you sure you want to delete this project?'))) return;
      try { await Api.remove(`/api/projects/${id}`); toast('Project deleted successfully.'); load(); }
      catch (err) { toast(err.message, 'error'); }
    }
  });

  document.getElementById('addBtn').onclick = () => openForm();
  search.addEventListener('input', debounce(render, 120));
  [fCategory, fStatus, fTech, sortBy].forEach((el) => el.addEventListener('change', render));
  grid.innerHTML = '<div class="loading">Loading...</div>';
  load().then(() => {
    if (qs('add')) openForm();
    const editId = qs('edit');
    if (editId) { const x = projects.find((v) => v.id === editId); if (x) openForm(x); }
  });
})();
