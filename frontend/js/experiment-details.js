/* experiment-details.js - full experiment page: video, runnable code editor, output, sub-experiments */
(function () {
  const content = document.getElementById('content');
  const id = qs('id');
  let exp = null;

  const savedOutputHTML = () => (exp.output ? `<h2>Saved Program Result</h2>${codeBlockHTML(exp.output, 'Output', '', 'output-block')}` : '');

  function render() {
    document.title = `Experiment ${exp.experimentNumber} | DS LAB`;
    const subs = exp.subExperiments || [];
    const hasVideo = exp.video || exp.youtubeUrl;
    content.innerHTML = `
      <nav class="breadcrumb"><a href="experiments.html">Experiments</a><span>Experiment ${esc(exp.experimentNumber)}</span></nav>
      <section class="detail-head ${exp.coverImage ? '' : 'no-cover'}">
        ${exp.coverImage ? `<div class="detail-cover">${coverHTML(exp.coverImage, exp.id, exp.name)}</div>` : ''}
        <div>
          <span class="badge badge-accent" style="margin-bottom:10px">Experiment ${esc(exp.experimentNumber)}</span>
          <h1>${esc(exp.name)}</h1>
          ${exp.language ? `<div class="info-grid"><div class="info-item"><small>Programming language</small><b>${esc(exp.language)}</b></div></div>` : ''}
          <div class="btn-row">
            ${exp.githubUrl ? `<a class="btn btn-dark" href="${esc(exp.githubUrl)}" target="_blank" rel="noopener">${icon('github', 16)} GitHub</a>` : ''}
            <a class="btn btn-light" href="experiments.html?edit=${exp.id}">${icon('edit', 16)} Edit</a>
            <button class="btn btn-danger-soft" data-action="deleteExp">${icon('trash', 16)} Delete</button>
          </div>
        </div>
      </section>
      ${hasVideo ? `<section class="panel"><h2>Video</h2>${mediaHTML(exp)}</section>` : ''}
      <section class="panel"><h2>Description</h2>
        <p class="muted" style="margin-top:0">${esc(exp.shortDescription || 'No short description added.')}</p>
        ${exp.detailedDescription || exp.descriptionHeading ? `<div class="rich">${exp.descriptionHeading ? `<h4>${esc(exp.descriptionHeading)}</h4>` : ''}${richTextHTML(exp.detailedDescription)}</div>` : ''}</section>
      <div id="runner"></div>
      <section class="panel" id="savedOutput" ${exp.output ? '' : 'hidden'}>${savedOutputHTML()}</section>
      <section class="panel"><h2>Sub-experiments</h2>
        ${subs.length ? `<div class="module-grid">${subs.map((s) => `<article class="card module-card filled" data-sub="${s.id}">
            <div style="display:flex;justify-content:space-between;align-items:center"><span class="module-num">EXP ${esc(subLabel(exp, s))}</span>
              ${kebabHTML([{ action: 'editSub', label: 'Edit', icon: 'edit' }, { action: 'deleteSub', label: 'Delete', icon: 'trash', danger: true }])}</div>
            <h3>${esc(s.name)}</h3><p class="card-text clamp-2">${esc(s.description || 'No short description.')}</p>
            <div class="indicators">${s.video || s.youtubeUrl ? `<span>${icon('video', 14)} Video</span>` : ''}${s.githubUrl ? `<span>${icon('github', 14)} GitHub</span>` : ''}</div>
            <div class="btn-row" style="margin-top:auto"><button class="btn btn-primary btn-sm" data-action="previewSub">Open ${esc(subLabel(exp, s))}</button></div></article>`).join('')}</div>`
          : '<p class="empty-inline">No sub-experiments added yet.</p>'}
        <div style="margin-top:16px"><button class="btn btn-light" data-action="addSub">${icon('plus', 16)} Add Sub-Experiment</button></div>
      </section>`;

    // Editable, runnable code: "Run Code" sends the editor contents to POST /api/run
    mountCodeRunner(document.getElementById('runner'), {
      title: 'Experiment Code', code: exp.code || '', language: exp.language || '',
      onSave: async (code) => { const fd = new FormData(); fd.append('code', code); exp = await Api.put(`/api/experiments/${exp.id}`, fd); },
      onSaveOutput: async (text) => {
        const fd = new FormData(); fd.append('output', text);
        exp = await Api.put(`/api/experiments/${exp.id}`, fd);
        const box = document.getElementById('savedOutput');
        box.innerHTML = savedOutputHTML(); box.hidden = !exp.output;
      }
    });
  }

  async function load() {
    try { exp = await Api.get(`/api/experiments/${encodeURIComponent(id)}`); render(); }
    catch (err) {
      content.innerHTML = emptyStateHTML('Experiment not found.', err.message, 'flask', '<a class="btn btn-primary" href="experiments.html">Back to experiments</a>');
    }
  }

  // Sub-experiment cards carry data-sub (not data-id), so read it from the card here
  const subOf = (btn) => exp.subExperiments.find((s) => s.id === btn.closest('[data-sub]').dataset.sub);
  onAction(content, {
    deleteExp: async () => {
      if (!(await confirmDialog('Are you sure you want to delete this experiment?'))) return;
      try { await Api.remove(`/api/experiments/${exp.id}`); toast('Experiment deleted successfully.'); setTimeout(() => { location.href = 'experiments.html'; }, 700); }
      catch (err) { toast(err.message, 'error'); }
    },
    addSub: () => openSubExperimentForm({ experiment: exp, onSaved: load }),
    previewSub: (_, btn) => openSubPreview(exp, subOf(btn)),
    editSub: (_, btn) => openSubExperimentForm({ experiment: exp, sub: subOf(btn), onSaved: load }),
    deleteSub: async (_, btn) => {
      const sub = subOf(btn);
      if (!(await confirmDialog('Are you sure you want to delete this sub-experiment?'))) return;
      try { await Api.remove(`/api/experiments/${exp.id}/sub-experiments/${sub.id}`); toast('Sub-experiment deleted successfully.'); load(); }
      catch (err) { toast(err.message, 'error'); }
    }
  });
  load();
})();
