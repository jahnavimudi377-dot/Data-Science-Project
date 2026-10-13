/**
 * DS LAB - Data Science Laboratory portal
 * Express backend with JSON-file persistence and Multer uploads.
 *
 * Structure of this file:
 *   1. Configuration & storage bootstrap
 *   2. Small helpers (JSON store, validation, file deletion)
 *   3. Multer (upload) configuration
 *   4. Routes: profile, subjects, modules, experiments, sub-experiments, tools, resources
 *   5. Static hosting + error handling
 *
 * To add a new feature later (e.g. assignments), add a new data file to DATA_FILES
 * and register a new group of routes in section 4 (registerCatalog() can be reused
 * for any simple "list of cards" feature).
 */
'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const multer = require('multer');

/* ------------------------------------------------------------------ */
/* 1. Configuration & storage bootstrap                                */
/* ------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
const BACKEND_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(BACKEND_DIR, 'data');
const UPLOAD_DIR = path.join(BACKEND_DIR, 'uploads');
const FRONTEND_DIR = path.join(BACKEND_DIR, '..', 'frontend');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MODULE_COUNT = 5;

const UPLOAD_FOLDERS = [
  'profile', 'subjects', 'modules', 'experiment-covers',
  'experiment-videos', 'sub-experiments', 'tools', 'resources', 'logo',
  'projects', 'projects/covers', 'projects/videos', 'projects/docs'
];

// Each JSON "table": file name + what it contains when first created.
const DATA_FILES = {
  profile: {
    file: 'profile.json',
    default: { name: '', class: '', branch: '', rollNumber: '', section: '', facultyName: '', gitRepoUrl: '', profileImage: '' }
  },
  settings: { file: 'settings.json', default: { logo: '' } },
  subjects: { file: 'subjects.json', default: [] },
  experiments: { file: 'experiments.json', default: [] },
  tools: { file: 'tools.json', default: [] },
  projects: { file: 'projects.json', default: [] },
  resources: { file: 'resources.json', default: [] }
};

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  UPLOAD_FOLDERS.forEach((f) => fs.mkdirSync(path.join(UPLOAD_DIR, f), { recursive: true }));
  Object.values(DATA_FILES).forEach(({ file, default: def }) => {
    const full = path.join(DATA_DIR, file);
    if (!fs.existsSync(full)) fs.writeFileSync(full, JSON.stringify(def, null, 2));
  });
}
ensureStorage();

/* ------------------------------------------------------------------ */
/* 2. Helpers                                                          */
/* ------------------------------------------------------------------ */
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function readJson(key) {
  const full = path.join(DATA_DIR, DATA_FILES[key].file);
  const text = fs.readFileSync(full, 'utf8').trim();
  if (!text) return JSON.parse(JSON.stringify(DATA_FILES[key].default));
  return JSON.parse(text);
}

// Write to a temp file first, then rename: avoids half-written JSON if the server stops mid-write.
function writeJson(key, data) {
  const full = path.join(DATA_DIR, DATA_FILES[key].file);
  const tmp = full + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, full);
}

const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const flag = (v) => v === true || v === 'true' || v === '1' || v === 'on';

const GITHUB_HOST = /(^|\.)github\.com$/i;
const YOUTUBE_HOST = /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i;

// Returns the cleaned URL, '' if empty, or throws a 400 error if invalid.
function validateUrl(value, label, hostPattern, hostName) {
  const v = str(value);
  if (!v) return '';
  let u;
  try { u = new URL(v); } catch (e) { throw new HttpError(400, `${label} is not a valid URL (include https://).`); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new HttpError(400, `${label} must start with http:// or https://.`);
  if (hostPattern && !hostPattern.test(u.hostname)) throw new HttpError(400, `${label} must be a ${hostName} link.`);
  return v;
}

// Convert a stored upload URL (/uploads/folder/file) to a deleted file. Safe against path tricks.
function deleteUpload(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const abs = path.resolve(UPLOAD_DIR, url.slice('/uploads/'.length));
  if (!abs.startsWith(UPLOAD_DIR + path.sep)) return;
  fs.unlink(abs, () => {});
}
const deleteUploads = (urls) => urls.forEach(deleteUpload);

const urlOf = (file) => `/uploads/${path.relative(UPLOAD_DIR, file.destination).split(path.sep).join('/')}/${file.filename}`;

function allFiles(req) {
  if (Array.isArray(req.files)) return req.files;
  if (req.files) return Object.values(req.files).flat();
  return req.file ? [req.file] : [];
}
// All uploaded files for one form field name
const uploaded = (req, field) => allFiles(req).filter((f) => f.fieldname === field);
const cleanupUploaded = (req) => allFiles(req).forEach((f) => deleteUpload(urlOf(f)));

function findOr404(list, id, label) {
  const item = list.find((x) => x.id === id);
  if (!item) throw new HttpError(404, `${label} not found.`);
  return item;
}

// Wraps a route so any thrown error removes freshly-uploaded files and reaches the error handler.
const handle = (fn) => (req, res, next) => {
  try { fn(req, res, next); } catch (err) { cleanupUploaded(req); next(err); }
};

function parseJsonArray(raw, message) {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) throw new Error('not array');
    return parsed;
  } catch (e) { throw new HttpError(400, message); }
}

/* ------------------------------------------------------------------ */
/* 3. Multer configuration                                             */
/* ------------------------------------------------------------------ */
const FILE_RULES = {
  image: { ext: ['.jpg', '.jpeg', '.png', '.webp'], mime: ['image/jpeg', 'image/png', 'image/webp'], msg: 'Images must be JPG, JPEG, PNG or WEBP.' },
  pdf: { ext: ['.pdf'], mime: ['application/pdf'], msg: 'Only PDF files are allowed.' },
  video: { ext: ['.mp4', '.webm', '.mov'], mime: ['video/mp4', 'video/webm', 'video/quicktime'], msg: 'Videos must be MP4, WEBM or MOV.' }
};

function fieldKind(name) {
  if (name === 'pdf') return 'pdf';
  if (name === 'video' || name === 'videos' || name.startsWith('subVideo_')) return 'video';
  if (['coverImage', 'profileImage', 'image', 'logo'].includes(name) || name.startsWith('subCover_')) return 'image';
  return null;
}

// Decide which uploads/ sub-folder a file belongs in.
function folderFor(uploadKind, fieldname) {
  switch (uploadKind) {
    case 'profile': return 'profile';
    case 'logo': return 'logo';
    case 'subject': return 'subjects';
    case 'module': return 'modules';
    case 'experiment': return fieldname === 'coverImage' ? 'experiment-covers' : fieldname === 'video' ? 'experiment-videos' : 'sub-experiments';
    case 'subexperiment': return 'sub-experiments';
    case 'tool': return 'tools';
    case 'resource': return 'resources';
    case 'project': return fieldname === 'coverImage' ? 'projects/covers' : fieldname === 'video' ? 'projects/videos' : 'projects/docs';
    default: return 'subjects';
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, folderFor(req.uploadKind, file.fieldname))),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40) || 'file';
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const kind = fieldKind(file.fieldname);
  if (!kind) return cb(new HttpError(400, `Unexpected file field "${file.fieldname}".`));
  const rule = FILE_RULES[kind];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!rule.ext.includes(ext) || !rule.mime.includes(file.mimetype)) return cb(new HttpError(400, rule.msg));
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: 80 } });

// Sets the upload category, runs multer, and turns multer errors into friendly JSON errors.
const withUpload = (kind, middleware) => (req, res, next) => {
  req.uploadKind = kind;
  middleware(req, res, (err) => {
    if (!err) return next();
    cleanupUploaded(req);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new HttpError(400, 'File is too large. The maximum allowed size is 100 MB.'));
      return next(new HttpError(400, `Upload error: ${err.message}`));
    }
    next(err);
  });
};

/* ------------------------------------------------------------------ */
/* 4. Routes                                                           */
/* ------------------------------------------------------------------ */
const app = express();
app.use(express.json({ limit: '2mb' }));

/* ---------- Profile ---------- */
app.get('/api/profile', handle((req, res) => res.json(readJson('profile'))));

app.put('/api/profile', withUpload('profile', upload.single('profileImage')), handle((req, res) => {
  const old = readJson('profile');
  const b = req.body;
  const profile = {
    name: str(b.name), class: str(b.class), branch: str(b.branch), rollNumber: str(b.rollNumber),
    section: str(b.section), facultyName: str(b.facultyName),
    gitRepoUrl: validateUrl(b.gitRepoUrl, 'Git repository URL'),
    profileImage: old.profileImage || ''
  };
  const toDelete = [];
  if (req.file) { toDelete.push(old.profileImage); profile.profileImage = urlOf(req.file); }
  else if (flag(b.removeImage)) { toDelete.push(old.profileImage); profile.profileImage = ''; }
  writeJson('profile', profile);
  deleteUploads(toDelete);
  res.json(profile);
}));

/* ---------- Subjects ---------- */
const emptyModules = () => Array.from({ length: MODULE_COUNT }, (_, i) => ({
  moduleNumber: i + 1, moduleName: '', pdf: '', videos: [], videoUrl: '', importantQuestions: []
}));

const parseSemester = (v) => { const n = parseInt(v, 10); return n >= 1 && n <= 8 ? n : 1; };
const subjectUpload = upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]);

app.get('/api/subjects', handle((req, res) => res.json(readJson('subjects'))));

app.get('/api/subjects/:id', handle((req, res) => res.json(findOr404(readJson('subjects'), req.params.id, 'Subject'))));

app.post('/api/subjects', withUpload('subject', subjectUpload), handle((req, res) => {
  const b = req.body;
  const name = str(b.name);
  if (!name) throw new HttpError(400, 'Subject name is required.');
  const t = now();
  const cover = uploaded(req, 'coverImage')[0];
  const pdf = uploaded(req, 'pdf')[0];
  const subject = {
    id: newId(), name, code: str(b.code), semester: parseSemester(b.semester), description: str(b.description),
    coverImage: cover ? urlOf(cover) : '', pdf: pdf ? urlOf(pdf) : '',
    modules: emptyModules(), createdAt: t, updatedAt: t
  };
  const subjects = readJson('subjects');
  subjects.push(subject);
  writeJson('subjects', subjects);
  res.status(201).json(subject);
}));

app.put('/api/subjects/:id', withUpload('subject', subjectUpload), handle((req, res) => {
  const subjects = readJson('subjects');
  const subject = findOr404(subjects, req.params.id, 'Subject');
  const b = req.body;
  const toDelete = [];

  if (b.name !== undefined) {
    if (!str(b.name)) throw new HttpError(400, 'Subject name is required.');
    subject.name = str(b.name);
  }
  if (b.code !== undefined) subject.code = str(b.code);
  if (b.semester !== undefined) subject.semester = parseSemester(b.semester);
  if (b.description !== undefined) subject.description = str(b.description);

  // Media: new file replaces old; "remove" flag clears; otherwise KEEP the old file.
  const cover = uploaded(req, 'coverImage')[0];
  if (cover) { toDelete.push(subject.coverImage); subject.coverImage = urlOf(cover); }
  else if (flag(b.removeCover)) { toDelete.push(subject.coverImage); subject.coverImage = ''; }
  const pdf = uploaded(req, 'pdf')[0];
  if (pdf) { toDelete.push(subject.pdf); subject.pdf = urlOf(pdf); }
  else if (flag(b.removePdf)) { toDelete.push(subject.pdf); subject.pdf = ''; }

  subject.updatedAt = now();
  writeJson('subjects', subjects);
  deleteUploads(toDelete);
  res.json(subject);
}));

app.delete('/api/subjects/:id', handle((req, res) => {
  const subjects = readJson('subjects');
  const subject = findOr404(subjects, req.params.id, 'Subject');
  writeJson('subjects', subjects.filter((s) => s.id !== subject.id));
  deleteUpload(subject.coverImage);
  deleteUpload(subject.pdf);
  subject.modules.forEach((m) => { deleteUpload(m.pdf); (m.videos || []).forEach((v) => deleteUpload(v.url)); });
  res.json({ success: true, message: 'Subject deleted.' });
}));

/* ---------- Modules (always exactly 5 per subject) ---------- */
const moduleUpload = upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'videos', maxCount: 10 }]);

function moduleIndex(req) {
  const n = parseInt(req.params.moduleNumber, 10);
  if (!(n >= 1 && n <= MODULE_COUNT)) throw new HttpError(404, `Module number must be between 1 and ${MODULE_COUNT}.`);
  return n - 1;
}

app.get('/api/subjects/:subjectId/modules', handle((req, res) => {
  res.json(findOr404(readJson('subjects'), req.params.subjectId, 'Subject').modules);
}));

app.put('/api/subjects/:subjectId/modules/:moduleNumber', withUpload('module', moduleUpload), handle((req, res) => {
  const subjects = readJson('subjects');
  const subject = findOr404(subjects, req.params.subjectId, 'Subject');
  const idx = moduleIndex(req);
  const old = subject.modules[idx];
  const b = req.body;
  const toDelete = [];
  let updated;

  if (flag(b.clear)) {
    // "Clear information": wipe the module and delete its files.
    toDelete.push(old.pdf, ...(old.videos || []).map((v) => v.url));
    updated = { moduleNumber: idx + 1, moduleName: '', pdf: '', videos: [], videoUrl: '', importantQuestions: [] };
  } else {
    const moduleName = str(b.moduleName);
    if (!moduleName) throw new HttpError(400, 'Module name is required.');

    let pdf = old.pdf;
    const newPdf = uploaded(req, 'pdf')[0];
    if (newPdf) { toDelete.push(old.pdf); pdf = urlOf(newPdf); }
    else if (flag(b.removePdf)) { toDelete.push(old.pdf); pdf = ''; }
    if (!pdf) throw new HttpError(400, 'Please upload a PDF for this module.');

    // Videos: remove the ones the client asked to remove, then append new uploads.
    const removeVideos = parseJsonArray(b.removeVideos, 'removeVideos must be a JSON array.') || [];
    const videos = (old.videos || []).filter((v) => {
      if (removeVideos.includes(v.url)) { toDelete.push(v.url); return false; }
      return true;
    });
    uploaded(req, 'videos').forEach((f) => videos.push({ url: urlOf(f), name: f.originalname }));

    let questions = old.importantQuestions || [];
    const parsedQ = parseJsonArray(b.importantQuestions, 'Important questions data is invalid.');
    if (parsedQ) {
      questions = parsedQ.map((q) => ({ question: str(q && q.question), answer: str(q && q.answer) })).filter((q) => q.question);
    }
    // Video link is optional; if the field is not sent, keep the existing link.
    const videoUrl = b.videoUrl !== undefined ? validateUrl(b.videoUrl, 'Video link') : (old.videoUrl || '');
    updated = { moduleNumber: idx + 1, moduleName, pdf, videos, videoUrl, importantQuestions: questions };
  }

  subject.modules[idx] = updated;
  subject.updatedAt = now();
  writeJson('subjects', subjects);
  deleteUploads(toDelete);
  res.json(updated);
}));

/* ---------- Experiments & Sub-experiments ---------- */
const SUB_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Builds one sub-experiment object from submitted fields + optional new files.
function buildSub(p, label, fallbackNumber, old, coverFile, videoFile, toDelete) {
  const name = str(p.name);
  if (!name) throw new HttpError(400, `${label}: topic name is required.`);
  const sub = {
    id: old ? old.id : newId(),
    number: str(p.number) || fallbackNumber,
    name,
    description: str(p.description),
    detailedDescription: typeof p.detailedDescription === 'string' ? p.detailedDescription.trim() : '',
    coverImage: old ? old.coverImage : '',
    video: old ? old.video : '',
    youtubeUrl: validateUrl(p.youtubeUrl, `${label} video link`),   // key kept as youtubeUrl for existing data; any video URL is accepted
    githubUrl: validateUrl(p.githubUrl, `${label} GitHub URL`, GITHUB_HOST, 'GitHub'),
    code: typeof p.code === 'string' ? p.code : '',
    output: typeof p.output === 'string' ? p.output : ''
  };
  // Keep old media unless replaced or explicitly removed.
  if (coverFile) { if (old) toDelete.push(old.coverImage); sub.coverImage = urlOf(coverFile); }
  else if (old && flag(p.removeCover)) { toDelete.push(old.coverImage); sub.coverImage = ''; }
  if (videoFile) { if (old) toDelete.push(old.video); sub.video = urlOf(videoFile); }
  else if (old && flag(p.removeVideo)) { toDelete.push(old.video); sub.video = ''; }
  return sub;
}

// Full list of sub-experiments sent along with the experiment form.
function buildSubs(req, parsed, existing, toDelete) {
  const result = parsed.map((p, i) => {
    const old = existing.find((e) => e.id && e.id === p.id);
    return buildSub(p || {}, `Sub-experiment ${i + 1}`, SUB_LETTERS[i] || String(i + 1), old,
      uploaded(req, `subCover_${i}`)[0], uploaded(req, `subVideo_${i}`)[0], toDelete);
  });
  // Sub-experiments that were removed in the form: delete their files too.
  existing.forEach((e) => {
    if (!result.some((s) => s.id === e.id)) toDelete.push(e.coverImage, e.video);
  });
  return result;
}

function buildExperiment(req, old) {
  const b = req.body;
  const toDelete = [];
  // On edit, any field that is NOT sent keeps its old value (so partial saves like "Save Code" are safe).
  const text = (key) => (b[key] !== undefined ? str(b[key]) : (old ? old[key] || '' : ''));
  const raw = (key) => (b[key] !== undefined ? (typeof b[key] === 'string' ? b[key] : '') : (old ? old[key] || '' : ''));
  const link = (key, label, host, hostName) => (b[key] !== undefined ? validateUrl(b[key], label, host, hostName) : (old ? old[key] || '' : ''));

  const experimentNumber = text('experimentNumber');
  const name = text('name');
  if (!experimentNumber) throw new HttpError(400, 'Experiment number is required.');
  if (!name) throw new HttpError(400, 'Experiment name is required.');

  // Subject / module are no longer part of the experiment form. Old values are kept; new ones are optional.
  const subjectId = text('subjectId');
  if (b.subjectId !== undefined && subjectId && !readJson('subjects').some((s) => s.id === subjectId)) throw new HttpError(400, 'The selected subject does not exist.');
  const moduleNumber = text('moduleNumber');
  if (b.moduleNumber !== undefined && moduleNumber && !/^[1-5]$/.test(moduleNumber)) throw new HttpError(400, 'Module must be between 1 and 5.');

  const t = now();
  const exp = {
    id: old ? old.id : newId(),
    experimentNumber, name, subjectId, moduleNumber,
    shortDescription: text('shortDescription'),
    descriptionHeading: text('descriptionHeading'),
    detailedDescription: text('detailedDescription'),
    language: text('language'),
    code: raw('code'),
    output: raw('output'),
    coverImage: old ? old.coverImage : '',
    video: old ? old.video : '',
    youtubeUrl: link('youtubeUrl', 'Video link'),   // optional video link (YouTube or any video URL)
    githubUrl: link('githubUrl', 'GitHub URL', GITHUB_HOST, 'GitHub'),
    subExperiments: old ? old.subExperiments || [] : [],
    createdAt: old ? old.createdAt : t,
    updatedAt: t
  };

  const cover = uploaded(req, 'coverImage')[0];
  if (cover) { if (old) toDelete.push(old.coverImage); exp.coverImage = urlOf(cover); }
  else if (old && flag(b.removeCover)) { toDelete.push(old.coverImage); exp.coverImage = ''; }
  const video = uploaded(req, 'video')[0];
  if (video) { if (old) toDelete.push(old.video); exp.video = urlOf(video); }
  else if (old && flag(b.removeVideo)) { toDelete.push(old.video); exp.video = ''; }

  const parsedSubs = parseJsonArray(b.subExperiments, 'Sub-experiment data is invalid.');
  if (parsedSubs) exp.subExperiments = buildSubs(req, parsedSubs, old ? old.subExperiments || [] : [], toDelete);

  return { exp, toDelete };
}

const experimentUpload = upload.any();
const subUpload = upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'video', maxCount: 1 }]);

app.get('/api/experiments', handle((req, res) => res.json(readJson('experiments'))));

app.get('/api/experiments/:id', handle((req, res) => res.json(findOr404(readJson('experiments'), req.params.id, 'Experiment'))));

app.post('/api/experiments', withUpload('experiment', experimentUpload), handle((req, res) => {
  const { exp } = buildExperiment(req, null);
  const list = readJson('experiments');
  list.push(exp);
  writeJson('experiments', list);
  res.status(201).json(exp);
}));

app.put('/api/experiments/:id', withUpload('experiment', experimentUpload), handle((req, res) => {
  const list = readJson('experiments');
  const old = findOr404(list, req.params.id, 'Experiment');
  const { exp, toDelete } = buildExperiment(req, old);
  list[list.indexOf(old)] = exp;
  writeJson('experiments', list);
  deleteUploads(toDelete);
  res.json(exp);
}));

app.delete('/api/experiments/:id', handle((req, res) => {
  const list = readJson('experiments');
  const exp = findOr404(list, req.params.id, 'Experiment');
  writeJson('experiments', list.filter((e) => e.id !== exp.id));
  deleteUploads([exp.coverImage, exp.video]);
  (exp.subExperiments || []).forEach((s) => deleteUploads([s.coverImage, s.video]));
  res.json({ success: true, message: 'Experiment deleted.' });
}));

// Look up a single sub-experiment (with its parent experiment) - used by the details page.
app.get('/api/sub-experiments/:id', handle((req, res) => {
  for (const experiment of readJson('experiments')) {
    const sub = (experiment.subExperiments || []).find((s) => s.id === req.params.id);
    if (sub) return res.json({ experiment, subExperiment: sub });
  }
  throw new HttpError(404, 'Sub-experiment not found.');
}));

// Add / edit / delete a single sub-experiment without re-sending the whole experiment.
app.post('/api/experiments/:id/sub-experiments', withUpload('subexperiment', subUpload), handle((req, res) => {
  const list = readJson('experiments');
  const exp = findOr404(list, req.params.id, 'Experiment');
  exp.subExperiments = exp.subExperiments || [];
  const sub = buildSub(req.body, 'Sub-experiment', SUB_LETTERS[exp.subExperiments.length] || String(exp.subExperiments.length + 1),
    null, uploaded(req, 'coverImage')[0], uploaded(req, 'video')[0], []);
  exp.subExperiments.push(sub);
  exp.updatedAt = now();
  writeJson('experiments', list);
  res.status(201).json(sub);
}));

app.put('/api/experiments/:id/sub-experiments/:subId', withUpload('subexperiment', subUpload), handle((req, res) => {
  const list = readJson('experiments');
  const exp = findOr404(list, req.params.id, 'Experiment');
  const idx = (exp.subExperiments || []).findIndex((s) => s.id === req.params.subId);
  if (idx < 0) throw new HttpError(404, 'Sub-experiment not found.');
  const toDelete = [];
  const sub = buildSub(req.body, 'Sub-experiment', exp.subExperiments[idx].number, exp.subExperiments[idx],
    uploaded(req, 'coverImage')[0], uploaded(req, 'video')[0], toDelete);
  exp.subExperiments[idx] = sub;
  exp.updatedAt = now();
  writeJson('experiments', list);
  deleteUploads(toDelete);
  res.json(sub);
}));

app.delete('/api/experiments/:id/sub-experiments/:subId', handle((req, res) => {
  const list = readJson('experiments');
  const exp = findOr404(list, req.params.id, 'Experiment');
  const sub = (exp.subExperiments || []).find((s) => s.id === req.params.subId);
  if (!sub) throw new HttpError(404, 'Sub-experiment not found.');
  exp.subExperiments = exp.subExperiments.filter((s) => s.id !== sub.id);
  exp.updatedAt = now();
  writeJson('experiments', list);
  deleteUploads([sub.coverImage, sub.video]);
  res.json({ success: true, message: 'Sub-experiment deleted.' });
}));

/* ---------- Tools & Resources (identical shape, so one reusable registrar) ---------- */
function parseTags(raw) {
  let tags = [];
  if (Array.isArray(raw)) tags = raw;
  else if (typeof raw === 'string' && raw.trim().startsWith('[')) { try { tags = JSON.parse(raw); } catch (e) { tags = []; } }
  else if (typeof raw === 'string') tags = raw.split(',');
  return [...new Set(tags.map((t) => str(t)).filter(Boolean))];
}

function buildCatalogItem(req, old, label) {
  const b = req.body;
  const name = str(b.name);
  if (!name) throw new HttpError(400, `${label} name is required.`);
  const priority = ['Low', 'Medium', 'High'].includes(str(b.priority)) ? str(b.priority) : 'Medium';
  const t = now();
  const toDelete = [];
  const item = {
    id: old ? old.id : newId(),
    name, category: str(b.category) || 'Other', description: str(b.description),
    url: validateUrl(b.url, `${label} URL`), image: old ? old.image : '',
    video: old ? old.video || '' : '',
    videoUrl: b.videoUrl !== undefined ? validateUrl(b.videoUrl, 'Video link') : (old ? old.videoUrl || '' : ''),
    notes: str(b.notes), priority, tags: parseTags(b.tags),
    createdAt: old ? old.createdAt : t, updatedAt: t
  };
  const img = uploaded(req, 'image')[0];
  if (img) { if (old) toDelete.push(old.image); item.image = urlOf(img); }
  else if (old && flag(b.removeImage)) { toDelete.push(old.image); item.image = ''; }
  const vid = uploaded(req, 'video')[0];
  if (vid) { if (old) toDelete.push(old.video); item.video = urlOf(vid); }
  else if (old && flag(b.removeVideo)) { toDelete.push(old.video); item.video = ''; }
  return { item, toDelete };
}

function registerCatalog({ key, route, kind, label }) {
  const mw = withUpload(kind, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]));
  app.get(`/api/${route}`, handle((req, res) => res.json(readJson(key))));
  app.get(`/api/${route}/:id`, handle((req, res) => res.json(findOr404(readJson(key), req.params.id, label))));
  app.post(`/api/${route}`, mw, handle((req, res) => {
    const { item } = buildCatalogItem(req, null, label);
    const list = readJson(key);
    list.push(item);
    writeJson(key, list);
    res.status(201).json(item);
  }));
  app.put(`/api/${route}/:id`, mw, handle((req, res) => {
    const list = readJson(key);
    const old = findOr404(list, req.params.id, label);
    const { item, toDelete } = buildCatalogItem(req, old, label);
    list[list.indexOf(old)] = item;
    writeJson(key, list);
    deleteUploads(toDelete);
    res.json(item);
  }));
  app.delete(`/api/${route}/:id`, handle((req, res) => {
    const list = readJson(key);
    const old = findOr404(list, req.params.id, label);
    writeJson(key, list.filter((x) => x.id !== old.id));
    deleteUploads([old.image, old.video]);
    res.json({ success: true, message: `${label} deleted.` });
  }));
}

registerCatalog({ key: 'tools', route: 'tools', kind: 'tool', label: 'Tool' });
registerCatalog({ key: 'resources', route: 'resources', kind: 'resource', label: 'Resource' });

/* ---------- Projects ---------- */
const PROJECT_STATUSES = ['Planned', 'In Progress', 'Completed', 'On Hold'];
const LINKEDIN_HOST = /(^|\.)linkedin\.com$/i;
const isDateString = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

// "Key features": one per line (a JSON array is accepted too)
function parseLines(raw) {
  if (Array.isArray(raw)) return raw.map(str).filter(Boolean);
  if (typeof raw !== 'string') return [];
  if (raw.trim().startsWith('[')) { try { return JSON.parse(raw).map(str).filter(Boolean); } catch (e) { /* treat as text */ } }
  return raw.split(/\r?\n/).map((l) => l.replace(/^\s*[-*\u2022]\s*/, '').trim()).filter(Boolean);
}

function buildProject(req, old) {
  const b = req.body;
  const toDelete = [];
  // On edit, fields that are not sent keep their old values.
  const text = (key) => (b[key] !== undefined ? str(b[key]) : (old ? old[key] || '' : ''));
  const link = (key, label, host, hostName) => (b[key] !== undefined ? validateUrl(b[key], label, host, hostName) : (old ? old[key] || '' : ''));

  const title = text('title');
  const shortDescription = text('shortDescription');
  const detailedDescription = text('detailedDescription');
  const techStack = b.techStack !== undefined ? parseTags(b.techStack) : (old ? old.techStack || [] : []);
  if (!title) throw new HttpError(400, 'Project title is required.');
  if (!shortDescription) throw new HttpError(400, 'Short description is required.');
  if (!detailedDescription) throw new HttpError(400, 'Detailed description is required.');
  if (!techStack.length) throw new HttpError(400, 'Add at least one technology to the tech stack.');

  const status = text('status') || 'In Progress';
  if (!PROJECT_STATUSES.includes(status)) throw new HttpError(400, `Status must be one of: ${PROJECT_STATUSES.join(', ')}.`);
  const startDate = text('startDate');
  const completionDate = text('completionDate');
  if (startDate && !isDateString(startDate)) throw new HttpError(400, 'Start date is not a valid date.');
  if (completionDate && !isDateString(completionDate)) throw new HttpError(400, 'Completion date is not a valid date.');
  if (startDate && completionDate && completionDate < startDate) throw new HttpError(400, 'Completion date cannot be before the start date.');

  const t = now();
  const project = {
    id: old ? old.id : newId(),
    title, shortDescription, detailedDescription, techStack,
    category: text('category'), status, startDate, completionDate,
    keyFeatures: b.keyFeatures !== undefined ? parseLines(b.keyFeatures) : (old ? old.keyFeatures || [] : []),
    role: text('role'),
    githubUrl: link('githubUrl', 'GitHub URL', GITHUB_HOST, 'GitHub'),
    linkedinUrl: link('linkedinUrl', 'LinkedIn URL', LINKEDIN_HOST, 'LinkedIn'),
    liveUrl: link('liveUrl', 'Live demo URL'),
    otherUrl: link('otherUrl', 'Other project URL'),
    youtubeUrl: link('youtubeUrl', 'Video link'),
    coverImage: old ? old.coverImage || '' : '',
    video: old ? old.video || '' : '',
    pdf: old ? old.pdf || '' : '',
    createdAt: old ? old.createdAt : t,
    updatedAt: t
  };

  // New file replaces the old one (old file is deleted only AFTER the project is saved); "remove" flag clears; otherwise keep.
  [['coverImage', 'coverImage', 'removeCover'], ['video', 'video', 'removeVideo'], ['pdf', 'pdf', 'removePdf']].forEach(([field, key, removeFlag]) => {
    const file = uploaded(req, field)[0];
    if (file) { if (old) toDelete.push(old[key]); project[key] = urlOf(file); }
    else if (old && flag(b[removeFlag])) { toDelete.push(old[key]); project[key] = ''; }
  });
  return { project, toDelete };
}

const projectUpload = upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]);

app.get('/api/projects', handle((req, res) => res.json(readJson('projects'))));

app.get('/api/projects/:id', handle((req, res) => res.json(findOr404(readJson('projects'), req.params.id, 'Project'))));

app.post('/api/projects', withUpload('project', projectUpload), handle((req, res) => {
  const { project } = buildProject(req, null);
  const list = readJson('projects');
  list.push(project);
  writeJson('projects', list);
  res.status(201).json(project);
}));

app.put('/api/projects/:id', withUpload('project', projectUpload), handle((req, res) => {
  const list = readJson('projects');
  const old = findOr404(list, req.params.id, 'Project');
  const { project, toDelete } = buildProject(req, old);
  list[list.indexOf(old)] = project;
  writeJson('projects', list);
  deleteUploads(toDelete);
  res.json(project);
}));

app.delete('/api/projects/:id', handle((req, res) => {
  const list = readJson('projects');
  const project = findOr404(list, req.params.id, 'Project');
  writeJson('projects', list.filter((p) => p.id !== project.id));
  deleteUploads([project.coverImage, project.video, project.pdf]);   // only this project's own files
  res.json({ success: true, message: 'Project deleted.' });
}));

/* ---------- Settings: custom DS LAB logo ---------- */
app.get('/api/settings', handle((req, res) => res.json(readJson('settings'))));

app.put('/api/settings/logo', withUpload('logo', upload.single('logo')), handle((req, res) => {
  if (!req.file) throw new HttpError(400, 'Please choose a logo image (PNG, JPG, JPEG or WEBP).');
  const settings = readJson('settings');
  const oldLogo = settings.logo;
  settings.logo = urlOf(req.file);
  writeJson('settings', settings);
  deleteUpload(oldLogo);
  res.json(settings);
}));

app.delete('/api/settings/logo', handle((req, res) => {
  const settings = readJson('settings');
  deleteUpload(settings.logo);
  settings.logo = '';
  writeJson('settings', settings);
  res.json(settings);
}));

/* ---------- Run Code ----------
 * Code never runs inside the Express process. Each run:
 *   - is written to a fresh temporary folder,
 *   - is started as a separate child process (own process group on Linux/macOS),
 *   - has a time limit, an output-size limit and a minimal environment,
 *   - is killed and its folder deleted afterwards.
 * NOTE: a child process is NOT a full security sandbox - it still runs as the same OS user.
 * Use this on your own computer / trusted lab network only.
 */
const RUN_TIMEOUT_MS = 10000;
const RUN_MAX_OUTPUT = 100 * 1024;   // characters of stdout+stderr kept
const RUN_MAX_CODE = 200 * 1024;
const RUN_MAX_CONCURRENT = 3;
let activeRuns = 0;
const isWindows = process.platform === 'win32';

const LANG_ALIASES = { python: 'python', python3: 'python', py: 'python', javascript: 'javascript', js: 'javascript', node: 'javascript', nodejs: 'javascript', java: 'java', c: 'c', 'c++': 'cpp', cpp: 'cpp', r: 'r' };
const LANG_LABELS = { python: 'Python', javascript: 'JavaScript (Node.js)', java: 'Java', c: 'C', cpp: 'C++', r: 'R' };

function commandWorks(cmd, args) {
  try {
    const r = spawnSync(cmd, args, { timeout: 5000, windowsHide: true, stdio: 'ignore' });
    return !r.error && r.status === 0;
  } catch (e) { return false; }
}
const firstWorking = (candidates) => { for (const [cmd, args] of candidates) if (commandWorks(cmd, args)) return cmd; return null; };

// Finds the programs needed for a language (or null when the runtime is not installed).
function findTools(lang) {
  switch (lang) {
    case 'python': { const py = firstWorking([['python3', ['--version']], ['python', ['--version']], ['py', ['--version']]]); return py ? { py } : null; }
    case 'javascript': return { node: process.execPath };
    case 'java': { const javac = firstWorking([['javac', ['-version']]]); const java = firstWorking([['java', ['-version']]]); return javac && java ? { javac, java } : null; }
    case 'c': { const cc = firstWorking([['gcc', ['--version']], ['cc', ['--version']]]); return cc ? { cc } : null; }
    case 'cpp': { const cxx = firstWorking([['g++', ['--version']], ['c++', ['--version']]]); return cxx ? { cxx } : null; }
    case 'r': { const rs = firstWorking([['Rscript', ['--version']]]); return rs ? { rs } : null; }
    default: return null;
  }
}

// Runs one program with time + output limits. Always resolves (never throws, never hangs).
function runProcess(cmd, args, cwd) {
  return new Promise((resolve) => {
    let stdout = '', stderr = '', timedOut = false, truncated = false, finished = false, child;
    const env = { PATH: process.env.PATH || '', HOME: cwd, TMPDIR: cwd, TEMP: cwd, TMP: cwd, PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' };
    if (isWindows) { env.SystemRoot = process.env.SystemRoot; env.PATHEXT = process.env.PATHEXT; }

    const finish = (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut, truncated });
    };
    const killTree = () => {
      try {
        if (isWindows) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
        else process.kill(-child.pid, 'SIGKILL');   // whole process group
      } catch (e) { try { child.kill('SIGKILL'); } catch (e2) { /* already gone */ } }
    };
    const take = (chunk, isErr) => {
      const room = RUN_MAX_OUTPUT - (stdout.length + stderr.length);
      if (room <= 0) { if (!truncated) { truncated = true; killTree(); } return; }
      const text = chunk.toString('utf8');
      const kept = text.slice(0, room);
      if (isErr) stderr += kept; else stdout += kept;
      if (text.length > room && !truncated) { truncated = true; killTree(); }
    };

    try {
      child = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], detached: !isWindows, windowsHide: true });
    } catch (e) { stderr = e.message; return finish(-1); }
    const timer = setTimeout(() => { timedOut = true; killTree(); }, RUN_TIMEOUT_MS);
    child.stdout.on('data', (d) => take(d, false));
    child.stderr.on('data', (d) => take(d, true));
    child.on('error', (e) => { stderr += `${e.message}\n`; finish(-1); });
    child.on('close', (code) => finish(code));
  });
}

async function runProgram(lang, code) {
  const label = LANG_LABELS[lang];
  const tools = findTools(lang);
  if (!tools) return { status: 'unavailable', message: `${label} runtime is not available on this server.`, stdout: '', stderr: '' };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dslab-run-'));
  const started = Date.now();
  try {
    let result;
    let phase = 'run';
    const exe = path.join(dir, isWindows ? 'prog.exe' : 'prog');
    switch (lang) {
      case 'python':
        fs.writeFileSync(path.join(dir, 'main.py'), code);
        result = await runProcess(tools.py, ['-u', 'main.py'], dir); break;
      case 'javascript':
        fs.writeFileSync(path.join(dir, 'main.js'), code);
        result = await runProcess(tools.node, ['main.js'], dir); break;
      case 'java': {
        const m = code.match(/public\s+(?:final\s+|abstract\s+)*class\s+([A-Za-z_]\w*)/);
        const cls = m ? m[1] : 'Main';
        fs.writeFileSync(path.join(dir, `${cls}.java`), code);
        result = await runProcess(tools.javac, [`${cls}.java`], dir);
        phase = 'compile';
        if (!result.timedOut && result.code === 0) { phase = 'run'; result = await runProcess(tools.java, ['-cp', '.', cls], dir); }
        break;
      }
      case 'c':
      case 'cpp': {
        const file = lang === 'c' ? 'main.c' : 'main.cpp';
        fs.writeFileSync(path.join(dir, file), code);
        result = await runProcess(lang === 'c' ? tools.cc : tools.cxx, [file, '-o', exe], dir);
        phase = 'compile';
        if (!result.timedOut && result.code === 0) { phase = 'run'; result = await runProcess(exe, [], dir); }
        break;
      }
      case 'r':
        fs.writeFileSync(path.join(dir, 'main.R'), code);
        result = await runProcess(tools.rs, ['main.R'], dir); break;
      default: throw new HttpError(400, 'Unsupported language.');
    }
    let status = 'success';
    let message = 'Program finished successfully.';
    if (result.timedOut) { status = 'timeout'; message = `Execution stopped: the ${RUN_TIMEOUT_MS / 1000} second time limit was exceeded.`; }
    else if (result.truncated) { status = 'error'; message = 'Execution stopped: the program produced too much output.'; }
    else if (result.code !== 0) { status = 'error'; message = phase === 'compile' ? 'Compilation failed.' : `Program exited with an error (exit code ${result.code}).`; }
    return { status, message, language: label, stdout: result.stdout, stderr: result.stderr, exitCode: result.code, durationMs: Date.now() - started };
  } finally {
    fs.rm(dir, { recursive: true, force: true }, () => {});   // always clean up the temp folder
  }
}

app.get('/api/run/languages', handle((req, res) => {
  res.json(Object.keys(LANG_LABELS).map((id) => ({ id, label: LANG_LABELS[id], available: !!findTools(id) })));
}));

app.post('/api/run', async (req, res, next) => {
  try {
    const { code, language } = req.body || {};
    if (typeof code !== 'string' || !code.trim()) throw new HttpError(400, 'There is no code to run.');
    if (code.length > RUN_MAX_CODE) throw new HttpError(400, 'The code is too long to run (limit 200 KB).');
    const lang = LANG_ALIASES[String(language || '').trim().toLowerCase()];
    if (!lang) {
      throw new HttpError(400, language
        ? `Running ${language} code is not supported. Supported languages: ${Object.values(LANG_LABELS).join(', ')}.`
        : 'Please choose a programming language to run this code.');
    }
    if (activeRuns >= RUN_MAX_CONCURRENT) throw new HttpError(429, 'Too many programs are running right now. Please try again in a moment.');
    activeRuns++;
    try { res.json(await runProgram(lang, code)); } finally { activeRuns--; }
  } catch (err) { next(err); }
});

/* ------------------------------------------------------------------ */
/* 5. Static files + error handling                                    */
/* ------------------------------------------------------------------ */
app.use('/uploads', express.static(UPLOAD_DIR));   // uploaded images, PDFs, videos (supports video seeking)
app.use(express.static(FRONTEND_DIR));             // the website itself

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server.' : err.message });
});

if (require.main === module) app.listen(PORT, () => {
  console.log(`DS LAB is running:  http://localhost:${PORT}`);
});

// Allow tests to import the runner without starting the server.
if (require.main !== module) module.exports = { app, runProgram, findTools, buildProject };
