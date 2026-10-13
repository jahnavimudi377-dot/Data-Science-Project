/* project-details.js - full project page; only sections that contain data are shown */
(function () {
  const content = document.getElementById('content');
  const id = qs('id');
  let project = null;

  function render() {
    const p = project;
    document.title = `${p.title} | DS LAB`;
    const info = [['Category', p.category], ['Status', p.status], ['Start date', formatDate(p.startDate)], ['Completion date', formatDate(p.completionDate)]].filter(([, v]) => v);
    const hasVideo = p.video || p.youtubeUrl;
    content.innerHTML = `
      <nav class="breadcrumb"><a href="projects.html">Projects</a><span>${esc(p.title)}</span></nav>
      <section class="detail-head ${p.coverImage ? '' : 'no-cover'}">
        ${p.coverImage ? `<div class="detail-cover">${coverHTML(p.coverImage, p.id, p.title)}</div>` : ''}
        <div>
          <h1>${esc(p.title)}</h1>
          <p class="muted">${esc(p.shortDescription)}</p>
          ${info.length ? `<div class="info-grid">${info.map(([l, v]) => `<div class="info-item"><small>${l}</small><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
          <div class="btn-row">
            ${p.githubUrl ? `<a class="btn btn-dark" href="${esc(p.githubUrl)}" target="_blank" rel="noopener">${icon('github', 16)} GitHub</a>` : ''}
            ${p.liveUrl ? `<a class="btn btn-primary" href="${esc(p.liveUrl)}" target="_blank" rel="noopener">${icon('globe', 16)} Live Demo</a>` : ''}
            ${p.linkedinUrl ? `<a class="btn btn-light" href="${esc(p.linkedinUrl)}" target="_blank" rel="noopener">${icon('linkedin', 16)} LinkedIn</a>` : ''}
            ${p.otherUrl ? `<a class="btn btn-light" href="${esc(p.otherUrl)}" target="_blank" rel="noopener">${icon('external', 16)} Project Link</a>` : ''}
          </div>
          <div class="btn-row" style="margin-top:12px">
            <a class="btn btn-light btn-sm" href="projects.html?edit=${p.id}">${icon('edit', 14)} Edit</a>
            <button class="btn btn-danger-soft btn-sm" data-action="delete">${icon('trash', 14)} Delete</button>
          </div>
        </div>
      </section>
      ${(p.techStack || []).length ? `<section class="panel"><h2>Tech Stack</h2><div class="tag-list">${p.techStack.map((t) => `<span class="tag tech">${esc(t)}</span>`).join('')}</div></section>` : ''}
      ${p.detailedDescription ? `<section class="panel"><h2>About the Project</h2><div class="rich">${richTextHTML(p.detailedDescription)}</div></section>` : ''}
      ${(p.keyFeatures || []).length ? `<section class="panel"><h2>Key Features</h2><ul class="feature-list">${p.keyFeatures.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>` : ''}
      ${p.role ? `<section class="panel"><h2>My Role / Contribution</h2><div class="rich">${richTextHTML(p.role)}</div></section>` : ''}
      ${hasVideo ? `<section class="panel"><h2>Video</h2>${mediaHTML({ video: p.video, youtubeUrl: p.youtubeUrl })}</section>` : ''}
      ${p.pdf ? `<section class="panel"><h2>Documentation</h2><a class="btn btn-primary" href="${esc(p.pdf)}" target="_blank" rel="noopener">${icon('file', 16)} Open Documentation PDF</a></section>` : ''}`;
  }

  async function load() {
    try { project = await Api.get(`/api/projects/${encodeURIComponent(id)}`); render(); }
    catch (err) { content.innerHTML = emptyStateHTML('Project not found.', err.message, 'folder', '<a class="btn btn-primary" href="projects.html">Back to projects</a>'); }
  }

  onAction(content, {
    delete: async () => {
      if (!(await confirmDialog('Are you sure you want to delete this project?'))) return;
      try { await Api.remove(`/api/projects/${project.id}`); toast('Project deleted successfully.'); setTimeout(() => { location.href = 'projects.html'; }, 700); }
      catch (err) { toast(err.message, 'error'); }
    }
  });
  load();
})();
