/* module-details.js - one module: PDF, videos, important Q&A */
(function () {
  const content = document.getElementById('content');
  const id = qs('id');
  const num = parseInt(qs('module'), 10);
  let subject = null;

  function render() {
    const m = subject.modules.find((x) => x.moduleNumber === num);
    if (!m) { content.innerHTML = emptyStateHTML('Module not found.', 'Modules are numbered 1 to 5.', 'book', `<a class="btn btn-primary" href="subject-details.html?id=${subject.id}">Back to subject</a>`); return; }
    document.title = `Module ${num} - ${subject.name} | DS LAB`;
    const filled = !!(m.moduleName || m.pdf);
    const prev = num > 1 ? `<a class="btn btn-light" href="module-details.html?id=${subject.id}&module=${num - 1}">&larr; Module ${num - 1}</a>` : '<span></span>';
    const next = num < 5 ? `<a class="btn btn-light" href="module-details.html?id=${subject.id}&module=${num + 1}">Module ${num + 1} &rarr;</a>` : '<span></span>';
    content.innerHTML = `
      <nav class="breadcrumb"><a href="subjects.html">Subjects</a><a href="subject-details.html?id=${subject.id}">${esc(subject.name)}</a><span>Module ${num}</span></nav>
      <section class="detail-head no-cover"><div>
        <span class="badge badge-accent" style="margin-bottom:10px">Module ${num}</span>
        <h1>${filled ? esc(m.moduleName || 'Untitled module') : 'Module information not added yet.'}</h1>
        <div class="btn-row"><button class="btn btn-primary" data-action="edit">${icon('edit', 16)} ${filled ? 'Edit module' : 'Add information'}</button>
          ${filled ? `<button class="btn btn-danger-soft" data-action="clear">${icon('eraser', 16)} Clear information</button>` : ''}</div></div></section>
      ${filled ? `
      <section class="panel"><h2>PDF</h2>${m.pdf
        ? `<div class="btn-row"><a class="btn btn-primary" href="${esc(m.pdf)}" target="_blank" rel="noopener">${icon('file', 16)} Open PDF</a></div>`
        : '<p class="empty-inline">No PDF uploaded.</p>'}</section>
      ${(m.videos || []).length || m.videoUrl ? `<section class="panel"><h2>Videos</h2>${(m.videos || []).map((v, i) => `<div style="margin-bottom:14px"><button class="btn btn-dark btn-sm" data-watch="${i}">${icon('video', 16)} Watch Video${m.videos.length > 1 ? ' ' + (i + 1) : ''}</button>
            <span class="muted" style="margin-left:8px;font-size:13px">${esc(v.name || '')}</span><div id="vid-${i}" style="margin-top:12px"></div></div>`).join('')}${videoLinkHTML(m.videoUrl)}</section>` : ''}
      <section class="panel qa"><h2>Important Questions &amp; Answers</h2>${(m.importantQuestions || []).length
        ? m.importantQuestions.map((q, i) => `<details ${i === 0 ? 'open' : ''}><summary>Q${i + 1}. ${esc(q.question)}</summary><p>${esc(q.answer || 'Answer not added yet.')}</p></details>`).join('')
        : '<p class="empty-inline">No questions added yet.</p>'}</section>` : ''}
      <div class="pager">${prev}${next}</div>`;
  }

  async function load() {
    try { subject = await Api.get(`/api/subjects/${encodeURIComponent(id)}`); render(); }
    catch (err) { content.innerHTML = emptyStateHTML('Subject not found.', err.message, 'book', '<a class="btn btn-primary" href="subjects.html">Back to subjects</a>'); }
  }

  content.addEventListener('click', (e) => {
    const watch = e.target.closest('[data-watch]');
    if (watch) {
      const slot = document.getElementById(`vid-${watch.dataset.watch}`);
      const m = subject.modules.find((x) => x.moduleNumber === num);
      slot.innerHTML = slot.innerHTML ? '' : mediaHTML({ video: m.videos[Number(watch.dataset.watch)].url });
    }
  });
  onAction(content, {
    edit: () => openModuleEditor({ subject, moduleNumber: num, onSaved: load }),
    clear: () => clearModule(subject, num, load)
  });
  load();
})();
