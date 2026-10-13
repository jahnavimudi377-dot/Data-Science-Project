/* experiments.js - Experiments page: cards, search, filter, sort, add/edit (with sub-experiments), delete */
(function () {
  const grid = document.getElementById('grid');
  const search = document.getElementById('searchInput');
  const fType = document.getElementById('filterType');
  const fLanguage = document.getElementById('filterLanguage');
  const sortBy = document.getElementById('sortBy');
  const resultCount = document.getElementById('resultCount');
  let experiments = [];

  const byNumber = (a, b) => String(a.experimentNumber).localeCompare(String(b.experimentNumber), undefined, { numeric: true });
  const SORTERS = {
    numAsc: byNumber,
    numDesc: (a, b) => byNumber(b, a),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    nameAsc: (a, b) => a.name.localeCompare(b.name),
    nameDesc: (a, b) => b.name.localeCompare(a.name)
  };
  // "All Experiments" dropdown: everything, or only experiments that have a certain kind of content
  const TYPE_FILTERS = {
    code: (e) => !!e.code,
    video: (e) => !!(e.video || e.youtubeUrl),
    subs: (e) => (e.subExperiments || []).length > 0,
    github: (e) => !!e.githubUrl
  };

  function fillFilters() {
    const keepT = fType.value, keepL = fLanguage.value;
    fType.innerHTML = `<option value="">All Experiments</option><option value="code">With code</option><option value="video">With video</option>
      <option value="subs">With sub-experiments</option><option value="github">With GitHub link</option>`;
    const langs = [...new Set(experiments.map((e) => e.language).filter(Boolean))].sort();
    fLanguage.innerHTML = '<option value="">All languages</option>' + langs.map((l) => `<option>${esc(l)}</option>`).join('');
    fType.value = keepT; fLanguage.value = keepL;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const list = experiments.filter((e) => {
      if (fType.value && !TYPE_FILTERS[fType.value](e)) return false;
      if (fLanguage.value && e.language !== fLanguage.value) return false;
      if (!q) return true;
      return [e.experimentNumber, e.name, e.shortDescription, e.detailedDescription, e.language].join(' ').toLowerCase().includes(q);
    });
    list.sort(SORTERS[sortBy.value]);
    resultCount.textContent = experiments.length ? `Showing ${list.length} of ${experiments.length} experiment${experiments.length > 1 ? 's' : ''}` : '';
    if (!experiments.length) { grid.innerHTML = emptyStateHTML('No experiments added yet.', 'Use "Add Experiment" to record your first lab experiment.', 'flask'); return; }
    if (!list.length) { grid.innerHTML = emptyStateHTML('No experiments match your filters.', 'Clear the search or change the filters.', 'search'); return; }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  function cardHTML(e) {
    const subs = e.subExperiments || [];
    return `<article class="card" data-id="${e.id}">
      <span class="cover-badge">EXP ${esc(e.experimentNumber)}</span>
      <a class="card-cover" href="experiment-details.html?id=${e.id}" aria-label="Open experiment">${coverHTML(e.coverImage, e.id, e.name)}</a>
      <div class="card-body">
        <div class="card-meta">${e.language ? `<span class="badge badge-orange">${esc(e.language)}</span>` : ''}</div>
        <h3 class="card-title"><a href="experiment-details.html?id=${e.id}">${esc(e.name)}</a></h3>
        <p class="card-text clamp-2">${esc(e.shortDescription || 'No short description added.')}</p>
        ${subs.length ? `<div class="sub-chips" aria-label="Sub-experiments">${subs.map((s) => `<button type="button" class="sub-chip" data-action="sub" data-sub="${s.id}" title="${esc(s.name)}">${esc(subLabel(e, s))}</button>`).join('')}</div>` : ''}
        <div class="indicators">
          ${subs.length ? `<span>${subs.length} sub-experiment${subs.length > 1 ? 's' : ''}</span>` : ''}
          ${e.video || e.youtubeUrl ? `<span>${icon('video', 14)} Video</span>` : ''}
          ${e.githubUrl ? `<span>${icon('github', 14)} GitHub</span>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <a class="btn btn-primary btn-sm" href="experiment-details.html?id=${e.id}">Read More</a>
        <button class="btn btn-light btn-sm" data-action="edit">Edit</button>
        <button class="btn btn-danger-soft btn-sm" data-action="delete">Delete</button>
      </div></article>`;
  }

  async function load() {
    try { experiments = await Api.get('/api/experiments'); fillFilters(); render(); }
    catch (err) { grid.innerHTML = ''; toast(err.message, 'error'); }
  }

  /* ---------- Add / edit form (no subject / module fields) ---------- */
  function openForm(exp = null) {
    const e = exp || {};
    const languages = ['Python', 'JavaScript', 'Java', 'C', 'C++', 'R', 'SQL', 'Scala', 'Julia'];
    const modal = openModal({
      title: exp ? `Edit experiment ${exp.experimentNumber}` : 'Add experiment', wide: true, closeOnOverlay: false,
      html: `<form class="form" novalidate><div class="form-grid">
        <label class="field"><span>Experiment number *</span><input name="experimentNumber" value="${esc(e.experimentNumber || '')}" placeholder="e.g. 1"></label>
        <label class="field"><span>Experiment name *</span><input name="name" value="${esc(e.name || '')}" placeholder="e.g. Data cleaning with pandas"></label>
        <label class="field span-2"><span>Short description</span><textarea name="shortDescription" rows="2">${esc(e.shortDescription || '')}</textarea></label>
        <div class="span-2">${fileFieldHTML({ name: 'coverImage', label: 'Cover image (JPG, PNG, WEBP)', accept: '.jpg,.jpeg,.png,.webp', current: e.coverImage, removeName: 'removeCover' })}</div>
        <label class="field span-2"><span>Long description heading</span><input name="descriptionHeading" value="${esc(e.descriptionHeading || '')}" placeholder="e.g. Aim and procedure"></label>
        <label class="field span-2"><span>Long / detailed description <small>(blank line = new paragraph, "## " at the start of a line = sub-heading)</small></span><textarea name="detailedDescription" rows="6">${esc(e.detailedDescription || '')}</textarea></label>
        <label class="field"><span>Programming language</span><input name="language" list="langList" value="${esc(e.language || '')}" placeholder="Python"><datalist id="langList">${languages.map((l) => `<option value="${l}">`).join('')}</datalist></label>
        <span></span>
        <label class="field span-2"><span>Program / code <small>(you can run it from the experiment page)</small></span><textarea class="code-input" name="code" spellcheck="false">${esc(e.code || '')}</textarea></label>
        <label class="field span-2"><span>Output / program result</span><textarea name="output" rows="4" spellcheck="false">${esc(e.output || '')}</textarea></label>
        <div class="span-2">${videoFieldsHTML({ label: 'Video (Optional)', fileName: 'video', current: e.video, removeName: 'removeVideo', linkAttr: 'name="youtubeUrl"', linkValue: e.youtubeUrl || '' })}</div>
        <label class="field span-2"><span>GitHub URL</span><input type="url" name="githubUrl" value="${esc(e.githubUrl || '')}" placeholder="https://github.com/..."></label>
      </div>
      <h4 class="form-section">Sub-experiments</h4>
      <div id="subList"></div>
      <div><button type="button" class="btn btn-light btn-sm" id="addSub">${icon('plus', 14)} Add Sub-Experiment</button></div>
      <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">Save experiment</button></div></form>`
    });
    const form = modal.querySelector('form');
    const subList = modal.querySelector('#subList');
    (e.subExperiments || []).forEach((s, i) => subList.insertAdjacentHTML('beforeend', subBlockHTML(i, s)));

    // New sub-experiment gets the first unused letter (A, B, C...)
    modal.querySelector('#addSub').onclick = () => {
      const used = [...subList.querySelectorAll('[data-f="number"]')].map((i) => i.value.toUpperCase());
      let idx = 0;
      while (used.includes(String.fromCharCode(65 + idx))) idx++;
      subList.insertAdjacentHTML('beforeend', subBlockHTML(idx));
      subList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      // Build FormData by hand: sub-experiment inputs are sent separately as subCover_N / subVideo_N
      const fd = new FormData();
      [...form.elements].forEach((el) => {
        if (!el.name || el.closest('.sub-block')) return;
        if (el.type === 'file') { if (el.files[0]) fd.append(el.name, el.files[0]); }
        else if (el.type === 'checkbox') { if (el.checked) fd.append(el.name, 'on'); }
        else fd.append(el.name, el.value);
      });
      const subs = [];
      subList.querySelectorAll('.sub-block').forEach((block, i) => {
        const r = readSubBlock(block);
        subs.push(r.fields);
        if (r.cover) fd.append(`subCover_${i}`, r.cover);
        if (r.video) fd.append(`subVideo_${i}`, r.video);
      });
      fd.append('subExperiments', JSON.stringify(subs));
      try {
        await withBusy(ev.submitter, () => (exp ? Api.put(`/api/experiments/${exp.id}`, fd) : Api.post('/api/experiments', fd)));
        toast('Experiment saved successfully.');
        modal.close();
        load();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  onAction(grid, {
    edit: (id) => openForm(experiments.find((x) => x.id === id)),
    delete: async (id) => {
      if (!(await confirmDialog('Are you sure you want to delete this experiment?'))) return;
      try { await Api.remove(`/api/experiments/${id}`); toast('Experiment deleted successfully.'); load(); }
      catch (err) { toast(err.message, 'error'); }
    },
    sub: (id, btn) => {
      const exp = experiments.find((x) => x.id === id);
      openSubPreview(exp, exp.subExperiments.find((s) => s.id === btn.dataset.sub));
    }
  });

  document.getElementById('addBtn').onclick = () => openForm();
  search.addEventListener('input', debounce(render, 120));
  [fType, fLanguage, sortBy].forEach((el) => el.addEventListener('change', render));
  grid.innerHTML = '<div class="loading">Loading...</div>';
  load().then(() => {
    if (qs('add')) openForm();
    const editId = qs('edit');
    if (editId) { const x = experiments.find((v) => v.id === editId); if (x) openForm(x); }
  });
})();
