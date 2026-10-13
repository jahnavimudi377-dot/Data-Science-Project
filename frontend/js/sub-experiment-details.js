/* sub-experiment-details.js - full page for one sub-experiment (e.g. Experiment 1A) */
(function () {
  const content = document.getElementById('content');
  const id = qs('id');

  async function load() {
    let data;
    try { data = await Api.get(`/api/sub-experiments/${encodeURIComponent(id)}`); }
    catch (err) {
      content.innerHTML = emptyStateHTML('Sub-experiment not found.', err.message, 'flask', '<a class="btn btn-primary" href="experiments.html">Back to experiments</a>');
      return;
    }
    const { experiment: exp, subExperiment: sub } = data;
    const label = subLabel(exp, sub);
    const hasMedia = sub.video || sub.youtubeUrl;
    document.title = `Experiment ${label} | DS LAB`;
    content.innerHTML = `
      <nav class="breadcrumb"><a href="experiments.html">Experiments</a><a href="experiment-details.html?id=${exp.id}">Experiment ${esc(exp.experimentNumber)}</a><span>${esc(label)}</span></nav>
      <section class="detail-head no-cover"><div>
        <span class="badge badge-accent" style="margin-bottom:10px">Experiment ${esc(label)}</span>
        <h1>${esc(sub.name)}</h1>
        <p class="muted">${esc(sub.description || '')}</p>
        <div class="sub-nav" aria-label="Sub-experiments of this experiment">${exp.subExperiments.map((s) =>
          `<a class="sub-chip ${s.id === sub.id ? 'active' : ''}" href="sub-experiment-details.html?id=${s.id}" title="${esc(s.name)}">${esc(s.number)}</a>`).join('')}</div>
        <div class="btn-row" style="margin-top:16px">
          ${sub.githubUrl ? `<a class="btn btn-dark" href="${esc(sub.githubUrl)}" target="_blank" rel="noopener">${icon('github', 16)} GitHub</a>` : ''}
          <a class="btn btn-light" href="experiment-details.html?id=${exp.id}">&larr; Back to Experiment ${esc(exp.experimentNumber)}</a>
        </div></div></section>
      ${hasMedia ? `<section class="panel"><h2>Video</h2>${mediaHTML(sub)}</section>`
        : sub.coverImage ? `<section class="panel"><h2>Image</h2><div class="media-frame"><img src="${esc(sub.coverImage)}" alt="${esc(sub.name)}" style="width:100%;display:block"></div></section>` : ''}
      ${sub.detailedDescription ? `<section class="panel"><h2>Long Description</h2><div class="rich">${richTextHTML(sub.detailedDescription)}</div></section>` : ''}
      <div id="runner"></div>
      <section class="panel" id="savedOutput" ${sub.output ? '' : 'hidden'}>${sub.output ? `<h2>Saved Program Result</h2>${codeBlockHTML(sub.output, 'Output', '', 'output-block')}` : ''}</section>
      ${!sub.detailedDescription && !sub.code && !sub.output && !hasMedia && !sub.coverImage ? '<p class="empty-inline">No further details added yet. Use Edit on the experiment page to add them.</p>' : ''}`;

    // Save changes through the single sub-experiment endpoint (all text fields are re-sent, media is kept)
    const saveFields = async (changes) => {
      const fd = new FormData();
      const merged = { number: sub.number, name: sub.name, description: sub.description, detailedDescription: sub.detailedDescription,
        youtubeUrl: sub.youtubeUrl, githubUrl: sub.githubUrl, code: sub.code, output: sub.output, ...changes };
      Object.entries(merged).forEach(([k, v]) => fd.append(k, v || ''));
      Object.assign(sub, await Api.put(`/api/experiments/${exp.id}/sub-experiments/${sub.id}`, fd));
    };
    mountCodeRunner(document.getElementById('runner'), {
      title: 'Program', code: sub.code || '', language: exp.language || '',
      onSave: (code) => saveFields({ code }),
      onSaveOutput: async (text) => {
        await saveFields({ output: text });
        const box = document.getElementById('savedOutput');
        box.innerHTML = `<h2>Saved Program Result</h2>${codeBlockHTML(sub.output, 'Output', '', 'output-block')}`; box.hidden = !sub.output;
      }
    });
  }
  load();
})();
