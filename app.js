const STORAGE_KEY = 'problemDiscovery.v2';
const APP_VERSION = '2.0.0';

const t = {
  en: {
    title: 'Problem Discovery App',
    subtitle: 'Private, local-first system for high-value problem discovery.',
    lang: 'Language',
    nav: ['Home', 'Capture', 'Inbox', 'Review', 'Patterns', 'Problems', 'Settings'],
    save: 'Save',
    quick: 'Quick Capture Inbox',
    structured: 'Structured Observation',
    future: 'Future Reflection',
    task: 'What were you trying to do?',
    friction: 'What blocked / annoyed you?',
    workaround: 'Workaround used',
    category: 'Category',
    statusSaved: 'Saved successfully.',
    empty: 'No data yet. Start with a concrete friction capture.',
    privacy: 'Privacy: all data and API key stay in this browser only.',
    ai: 'AI Assistant',
    aiKey: 'DeepSeek API Key',
    saveKey: 'Save Key',
    removeKey: 'Remove Key',
    testKey: 'Test Connection',
    duplicate: 'Possible duplicate detected. Merge or link?',
  },
  ar: {
    title: 'تطبيق اكتشاف المشكلات',
    subtitle: 'نظام شخصي خاص ومحلي لاكتشاف المشكلات عالية القيمة.',
    lang: 'اللغة',
    nav: ['الرئيسية', 'التقاط', 'الوارد', 'مراجعة', 'الأنماط', 'المشكلات', 'الإعدادات'],
    save: 'حفظ',
    quick: 'التقاط سريع (الوارد)',
    structured: 'ملاحظة منظمة',
    future: 'تفكير مستقبلي',
    task: 'ما الذي كنت تحاول إنجازه؟',
    friction: 'ما الذي أعاقك أو أزعجك؟',
    workaround: 'ما الحل المؤقت الذي استخدمته؟',
    category: 'الفئة',
    statusSaved: 'تم الحفظ بنجاح.',
    empty: 'لا توجد بيانات بعد. ابدأ بالتقاط احتكاك واضح.',
    privacy: 'الخصوصية: كل البيانات والمفتاح محفوظة محليًا في هذا المتصفح فقط.',
    ai: 'مساعد الذكاء الاصطناعي',
    aiKey: 'مفتاح DeepSeek API',
    saveKey: 'حفظ المفتاح',
    removeKey: 'حذف المفتاح',
    testKey: 'اختبار الاتصال',
    duplicate: 'تم رصد تشابه محتمل. هل تريد الدمج أو الربط؟',
  },
};

const categories = ['waiting', 'repetition', 'confusion', 'manual transfer', 'communication gap', 'trust issue', 'coordination problem', 'missing visibility', 'future signal', 'other'];
const spreadScale = ['just me', 'people like me', 'small group', 'clear segment', 'many people'];
const evidenceLabels = ['feeling', 'once', 'repeated me', 'clear workaround', 'multiple similar', 'affects others', 'strong repeated'];
const statuses = ['raw observation', 'needs validation', 'strong problem', 'ready for solution exploration', 'archived'];
const confidenceLevels = ['low', 'medium', 'high'];

const defaultState = {
  language: 'en',
  tab: 'Home',
  captures: [],
  observations: [],
  clusters: [],
  problemCards: [],
  futureSignals: [],
  settings: {
    weights: { frequency: 1.2, pain: 1.3, spread: 1.1, workaround: 1, urgency: 1.1, timeLoss: 1, moneyLoss: 0.7, pay: 1.2, evidence: 1.4 },
    aiKey: '',
  },
};

let state = load();
const uiState = {
  selectedObservationIds: new Set(),
};

function load() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return structuredClone(defaultState);
  }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function tr(k) { const lang = t[state.language] || t.en; return k.split('.').reduce((o, p) => o?.[p], lang) ?? k; }
function val(id) { return document.getElementById(id)?.value ?? ''; }
const norm = s => (s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

function similarity(a, b) {
  const A = new Set(norm(a).split(' ').filter(Boolean));
  const B = new Set(norm(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach(x => B.has(x) && inter++);
  return inter / (A.size + B.size - inter);
}

function opportunityScore(card) {
  const w = state.settings.weights;
  const score = (card.frequency || 0) * w.frequency +
    (card.severity || 0) * w.pain +
    (card.spread || 0) * w.spread +
    (card.workaround ? 5 : 0) * w.workaround +
    (card.urgency || 0) * w.urgency +
    (card.timeLoss || 0) * w.timeLoss +
    (card.moneyLoss || 0) * w.moneyLoss +
    (card.pay || 0) * w.pay +
    (card.evidence || 0) * w.evidence;
  return Math.round(score * 10) / 10;
}

function topBy(arr, field, limit = 5) { return [...arr].sort((a, b) => (b[field] || 0) - (a[field] || 0)).slice(0, limit); }
function counts(arr, field) {
  const m = {};
  arr.forEach(x => { const v = (x[field] || '').toString().trim(); if (v) m[v] = (m[v] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function setLang() {
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', state.language === 'ar');
  document.body.classList.toggle('ltr', state.language !== 'ar');
  document.getElementById('appTitle').textContent = tr('title');
  document.getElementById('appSubtitle').textContent = `${tr('subtitle')} · v${APP_VERSION}`;
  document.getElementById('langLabel').textContent = tr('lang');
  document.getElementById('languageSelect').value = state.language;
}

function nav() {
  const n = document.getElementById('bottomNav');
  n.innerHTML = '';
  t[state.language].nav.forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = label === state.tab ? 'active' : '';
    btn.onclick = () => { state.tab = label; persist(); render(); };
    n.appendChild(btn);
  });
}

function card(html) {
  const c = document.getElementById('cardTemplate').content.firstElementChild.cloneNode(true);
  c.innerHTML = html;
  return c;
}

function drawWeeklyChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    const count = state.observations.filter(o => (o.date || '').slice(0, 10) === d).length;
    return { d: d.slice(5), count };
  });
  const max = Math.max(...days.map(x => x.count), 1);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  days.forEach((x, i) => {
    const w = 34, gap = 8, xPos = 10 + i * (w + gap), h = (x.count / max) * 90;
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(xPos, 120 - h, w, h);
    ctx.fillStyle = '#334155';
    ctx.font = '10px sans-serif';
    ctx.fillText(x.d, xPos, 134);
  });
}

function renderHome(root) {
  const cards = state.problemCards.map(c => ({ ...c, score: opportunityScore(c) }));
  const topProblems = topBy(cards, 'score', 5);
  const weakEvidence = cards.filter(c => c.evidence <= 2 || c.confidence === 'low').length;

  root.append(card(`<div class='grid two'>
    <div><div class='small'>Raw captures</div><div class='kpi'>${state.captures.length}</div></div>
    <div><div class='small'>Structured observations</div><div class='kpi'>${state.observations.length}</div></div>
    <div><div class='small'>Problem cards</div><div class='kpi'>${state.problemCards.length}</div></div>
    <div><div class='small'>Future signals</div><div class='kpi'>${state.futureSignals.length}</div></div>
  </div>`));

  if (!state.captures.length && !state.observations.length) {
    root.append(card(`<p>${tr('empty')}</p><div class='note'>Example: “I copied the same client data into two systems to finish one report.”</div>`));
    return;
  }

  root.append(card(`<h3>Insight Dashboard</h3>
  <div class='grid two'>
    <div><b>Top recurring categories</b>${counts([...state.captures, ...state.observations], 'category').slice(0, 4).map(([k, v]) => `<div>${k} <span class='badge'>${v}</span></div>`).join('') || '-'}</div>
    <div><b>Top recurring contexts</b>${counts(state.observations, 'context').slice(0, 4).map(([k, v]) => `<div>${k} <span class='badge'>${v}</span></div>`).join('') || '-'}</div>
  </div>
  <h4>Weekly trend (observations)</h4>
  <canvas id='weeklyChart' width='320' height='140'></canvas>
  <h4>Top 5 opportunities</h4>
  ${topProblems.map(p => `<div class='item'><b>${p.title}</b> <span class='badge'>${p.score}</span><div class='small'>Confidence: ${p.confidence || 'medium'} | Evidence: ${evidenceLabels[(p.evidence || 1)-1] || p.evidence}</div></div>`).join('') || '-'}
  ${weakEvidence ? `<div class='warn-box'>⚠ ${weakEvidence} card(s) have weak evidence/confidence. Validate before moving to solutions.</div>` : ''}
  `));

  setTimeout(() => drawWeeklyChart('weeklyChart'), 0);
}

function renderCapture(root) {
  root.append(card(`<h3>${tr('quick')}</h3>
  <div class='grid'>
    <div><label>${tr('task')}</label><input id='qTask'/><div class='helper'>Concrete task only, avoid general words.</div></div>
    <div><label>${tr('friction')}</label><textarea id='qFriction'></textarea><div class='helper'>Describe friction (symptom), not solution direction.</div></div>
    <div><label>${tr('workaround')}</label><input id='qWorkaround'/><div class='helper'>Workarounds are strong market signals.</div></div>
    <div><label>${tr('category')}</label><select id='qCategory'>${categories.map(c => `<option>${c}</option>`).join('')}</select></div>
  </div>
  <div class='actions'><button class='primary' id='saveQuick'>${tr('save')}</button></div>`));

  root.append(card(`<h3>${tr('structured')}</h3>
  <div class='grid'>
    <div><label>Date & time</label><input id='sDate' type='datetime-local' value='${new Date().toISOString().slice(0, 16)}'></div>
    <div><label>Context / place</label><input id='sContext'><div class='helper'>Example: office, home, client call.</div></div>
    <div><label>${tr('task')}</label><textarea id='sTask'></textarea></div>
    <div><label>${tr('friction')}</label><textarea id='sFriction'></textarea></div>
    <div><label>${tr('workaround')}</label><input id='sWorkaround'></div>
    <div><label>How often?</label><input id='sFrequency' type='number' min='1' value='1'></div>
    <div><label>Pain 1-5</label><input id='sPain' type='number' min='1' max='5' value='3'></div>
    <div><label>Estimated time wasted (min)</label><input id='sTime' type='number' value='10'></div>
    <div><label>Estimated money wasted</label><input id='sMoney' type='number' value='0'></div>
    <div><label>Affects others?</label><select id='sSpread'>${spreadScale.map((s, i) => `<option value='${i + 1}'>${s}</option>`).join('')}</select></div>
    <div><label>${tr('category')}</label><select id='sCategory'>${categories.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div><label>Tags (comma separated)</label><input id='sTags'></div>
    <div><label>Signal Type</label><select id='sSignal'><option>current problem</option><option>future signal</option><option>not sure</option></select></div>
  </div>
  <div class='actions'><button class='success' id='saveStructured'>${tr('save')}</button></div>`));

  root.append(card(`<h3>${tr('future')}</h3>
    <div class='list'>${[
      'What process today will look inefficient in 10 years?',
      'What task today feels unnecessarily manual?',
      'What workflow will become unacceptable later?',
      'What weak signal can become strong demand?',
      'What do people tolerate today that should not be normal?',
      'What workaround hints at future market need?',
    ].map((q, i) => `<div><label>${q}</label><textarea id='f${i}'></textarea></div>`).join('')}</div>
    <div class='actions'><button id='saveFuture'>${tr('save')}</button></div>`));

  document.getElementById('saveQuick').onclick = () => {
    const c = { id: uid(), date: new Date().toISOString(), task: val('qTask'), friction: val('qFriction'), workaround: val('qWorkaround'), category: val('qCategory'), favorite: false };
    if (!c.task || !c.friction) return alert('Task and friction required');
    state.captures.unshift(c); persist(); alert(tr('statusSaved')); render();
  };

  document.getElementById('saveStructured').onclick = () => {
    const o = {
      id: uid(), date: val('sDate'), context: val('sContext'), task: val('sTask'), friction: val('sFriction'), workaround: val('sWorkaround'),
      frequency: +val('sFrequency') || 1, pain: +val('sPain') || 3, timeLoss: +val('sTime') || 0, moneyLoss: +val('sMoney') || 0,
      spread: +val('sSpread') || 1, category: val('sCategory'), tags: val('sTags').split(',').map(x => x.trim()).filter(Boolean),
      signal: val('sSignal'), important: false,
    };
    if (!o.task || !o.friction) return alert('Task and friction required');
    if (similarity(o.friction, o.workaround) > 0.7) alert('You may be writing a solution. Focus on friction details first.');
    state.observations.unshift(o); persist(); alert(tr('statusSaved')); render();
  };

  document.getElementById('saveFuture').onclick = () => {
    const text = [0, 1, 2, 3, 4, 5].map(i => val(`f${i}`)).filter(Boolean).join('\n');
    if (!text) return;
    state.futureSignals.unshift({ id: uid(), date: new Date().toISOString(), text });
    persist(); alert(tr('statusSaved')); render();
  };
}

function renderInbox(root) {
  root.append(card(`<h3>Inbox (${state.captures.length})</h3>
  <div class='list'>${state.captures.map(c => `<div class='item'><b>${c.task}</b><div>${c.friction}</div><div class='small'>${c.workaround || '-'} | ${c.category}</div>
    <div class='actions'><button data-act='toObs' data-id='${c.id}'>Convert to observation</button><button data-act='fav' data-id='${c.id}'>${c.favorite ? 'Unfavorite' : 'Favorite'}</button></div>
  </div>`).join('') || tr('empty')}</div>`));

  root.querySelectorAll('[data-act="toObs"]').forEach(b => b.onclick = () => {
    const c = state.captures.find(x => x.id === b.dataset.id); if (!c) return;
    state.observations.unshift({ id: uid(), date: new Date().toISOString(), context: '', task: c.task, friction: c.friction, workaround: c.workaround, frequency: 1, pain: 3, timeLoss: 10, moneyLoss: 0, spread: 1, category: c.category, tags: [], signal: 'current problem', important: false });
    state.captures = state.captures.filter(x => x.id !== c.id); persist(); render();
  });
  root.querySelectorAll('[data-act="fav"]').forEach(b => b.onclick = () => {
    const c = state.captures.find(x => x.id === b.dataset.id); c.favorite = !c.favorite; persist(); render();
  });
}

function renderReview(root) {
  const today = new Date().toISOString().slice(0, 10);
  const todayObs = state.observations.filter(o => (o.date || '').slice(0, 10) === today);
  root.append(card(`<h3>End-of-Day Review (${today})</h3>
  <div class='note'>What repeated today? What took too long? Which workaround did you repeat?</div>
  <div class='list'>${todayObs.map(o => `<div class='item'>${o.friction}<div class='actions'><button data-id='${o.id}' data-imp='1'>${o.important ? 'Unmark' : 'Mark important'}</button></div></div>`).join('') || '-'}</div>
  <h4>Pattern hints</h4>${counts(todayObs, 'friction').filter(([, c]) => c > 1).map(([f, c]) => `<div>${f} <span class='badge'>${c}</span></div>`).join('') || '-'}
  `));

  root.querySelectorAll('[data-imp]').forEach(b => b.onclick = () => {
    const o = state.observations.find(x => x.id === b.dataset.id); o.important = !o.important; persist(); render();
  });
}

function buildPatternSuggestions() {
  const base = [...state.captures.map(c => ({ id: c.id, text: `${c.task} ${c.friction}` })), ...state.observations.map(o => ({ id: o.id, text: `${o.task} ${o.friction}` }))];
  const out = [];
  for (let i = 0; i < base.length; i++) {
    for (let j = i + 1; j < base.length; j++) {
      const s = similarity(base[i].text, base[j].text);
      if (s > 0.45) out.push({ a: base[i].id, b: base[j].id, s });
    }
  }
  return out.sort((x, y) => y.s - x.s).slice(0, 10);
}

function renderPatterns(root) {
  const dups = buildPatternSuggestions();
  root.append(card(`<h3>Pattern Detection</h3>
    <div>Recurring categories: ${counts(state.observations, 'category').slice(0, 5).map(([k, v]) => `<span class='tag'>${k}:${v}</span>`).join('')}</div>
    <div>Recurring tasks: ${counts(state.observations, 'task').slice(0, 5).map(([k, v]) => `<span class='tag'>${k.slice(0, 24)}:${v}</span>`).join('')}</div>
    <h4>Duplicate/similar notes</h4>
    ${dups.map(d => `<div class='item'>${tr('duplicate')} <span class='badge'>${Math.round(d.s * 100)}%</span><div class='actions'><button data-link='${d.a},${d.b}'>Link as cluster</button></div></div>`).join('') || '-'}
  `));

  root.querySelectorAll('[data-link]').forEach(b => b.onclick = () => {
    const ids = b.dataset.link.split(',');
    state.clusters.unshift({ id: uid(), title: 'Suggested cluster', summary: 'Auto-linked by similarity', observationIds: ids });
    persist(); render();
  });

  root.append(card(`<h3>Manual Observation Merge</h3>
    <div class='small'>Select related observations, then merge them into one cluster.</div>
    <div class='list'>
      ${state.observations.slice(0, 25).map(o => `
      <label class='item'>
        <input type='checkbox' data-obs-select='${o.id}' ${uiState.selectedObservationIds.has(o.id) ? 'checked' : ''} />
        <div><b>${escapeHtml(o.task || 'Untitled task')}</b><div>${escapeHtml(o.friction || '')}</div></div>
      </label>`).join('') || '<div class=\"small\">No observations yet.</div>'}
    </div>
    <div class='actions'>
      <button id='mergeSelectedObs'>Merge selected as cluster</button>
      <button id='clearSelectedObs'>Clear selection</button>
    </div>
  `));

  root.querySelectorAll('[data-obs-select]').forEach(cb => cb.onchange = () => {
    if (cb.checked) uiState.selectedObservationIds.add(cb.dataset.obsSelect);
    else uiState.selectedObservationIds.delete(cb.dataset.obsSelect);
  });
  const mergeBtn = root.querySelector('#mergeSelectedObs');
  const clearBtn = root.querySelector('#clearSelectedObs');
  if (mergeBtn) mergeBtn.onclick = () => {
    const ids = [...uiState.selectedObservationIds];
    if (ids.length < 2) return alert('Select at least two observations to merge.');
    const selected = state.observations.filter(o => ids.includes(o.id));
    const summary = selected.map(s => s.friction).slice(0, 3).join(' | ');
    state.clusters.unshift({
      id: uid(),
      title: 'Merged cluster',
      summary: summary || 'Manual merged cluster',
      observationIds: ids,
    });
    uiState.selectedObservationIds.clear();
    persist();
    render();
  };
  if (clearBtn) clearBtn.onclick = () => {
    uiState.selectedObservationIds.clear();
    render();
  };
}

function renderProblemEditor(root, editing = null) {
  const p = editing || { title: '', affected: '', job: '', friction: '', workaround: '', weakness: '', evidenceText: '', frequency: 1, severity: 3, spread: 1, timeLoss: 10, moneyLoss: 0, pay: 3, urgency: 3, evidence: 3, confidence: 'medium', status: statuses[1], pinned: false, observationIds: [] };
  root.append(card(`<h3>${editing ? 'Edit Problem Card' : 'Create Problem Card'}</h3>
  <div class='grid'>
    <div><label>Problem title</label><input id='pcTitle' value='${escapeHtml(p.title)}'></div>
    <div><label>Who is affected?</label><input id='pcAffected' value='${escapeHtml(p.affected)}'></div>
    <div><label>Job/task to complete</label><textarea id='pcJob'>${escapeHtml(p.job)}</textarea></div>
    <div><label>Exact friction</label><textarea id='pcFriction'>${escapeHtml(p.friction)}</textarea></div>
    <div><label>Current workaround</label><textarea id='pcWorkaround'>${escapeHtml(p.workaround)}</textarea></div>
    <div><label>Why current options are weak</label><textarea id='pcWeakness'>${escapeHtml(p.weakness)}</textarea></div>
    <div><label>Evidence summary</label><textarea id='pcEvidenceText'>${escapeHtml(p.evidenceText || '')}</textarea></div>
    <div><label>Frequency</label><input id='pcFrequency' type='number' value='${p.frequency}'></div>
    <div><label>Severity</label><input id='pcSeverity' type='number' min='1' max='5' value='${p.severity}'></div>
    <div><label>Spread</label><input id='pcSpread' type='number' min='1' max='5' value='${p.spread}'></div>
    <div><label>Time loss</label><input id='pcTime' type='number' value='${p.timeLoss}'></div>
    <div><label>Money loss</label><input id='pcMoney' type='number' value='${p.moneyLoss}'></div>
    <div><label>Willingness to pay</label><input id='pcPay' type='number' min='1' max='5' value='${p.pay}'></div>
    <div><label>Urgency</label><input id='pcUrgency' type='number' min='1' max='5' value='${p.urgency}'></div>
    <div><label>Evidence strength</label><input id='pcEvidence' type='number' min='1' max='7' value='${p.evidence}'></div>
    <div><label>Confidence</label><select id='pcConfidence'>${confidenceLevels.map(c => `<option ${p.confidence === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div><label>Status</label><select id='pcStatus'>${statuses.map(s => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
  </div>
  <div class='actions'><button class='primary' id='saveProblemCard'>${editing ? 'Update Card' : 'Create Card'}</button></div>
  `));

  document.getElementById('saveProblemCard').onclick = () => {
    const cardData = {
      id: editing?.id || uid(),
      title: val('pcTitle'),
      affected: val('pcAffected'),
      job: val('pcJob'),
      friction: val('pcFriction'),
      workaround: val('pcWorkaround'),
      weakness: val('pcWeakness'),
      evidenceText: val('pcEvidenceText'),
      frequency: +val('pcFrequency') || 1,
      severity: +val('pcSeverity') || 3,
      spread: +val('pcSpread') || 1,
      timeLoss: +val('pcTime') || 0,
      moneyLoss: +val('pcMoney') || 0,
      pay: +val('pcPay') || 3,
      urgency: +val('pcUrgency') || 3,
      evidence: +val('pcEvidence') || 1,
      confidence: val('pcConfidence') || 'medium',
      status: val('pcStatus') || statuses[1],
      pinned: editing?.pinned || false,
      observationIds: editing?.observationIds || [],
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    if (!cardData.title || !cardData.friction) return alert('Title and friction are required');
    if (editing) {
      const idx = state.problemCards.findIndex(x => x.id === editing.id);
      state.problemCards[idx] = cardData;
    } else {
      state.problemCards.unshift(cardData);
    }
    persist(); render();
  };
}

function renderProblems(root) {
  root.append(card(`<h3>Problem Clustering</h3>
  <div class='actions'><button id='newCluster'>Create cluster from latest observations</button><button id='openCardCreate'>New Problem Card</button></div>
  ${state.clusters.map(c => `<div class='item'><b>${c.title}</b><div>${c.summary || ''}</div><div class='small'>Linked obs: ${c.observationIds?.length || 0}</div>
      <div class='actions'><button data-promote='${c.id}'>Promote to card</button></div></div>`).join('') || '<div class="small">No clusters yet.</div>'}
  `));

  root.append(card(`<h3>Problem Cards</h3>
    <div class='grid two'>
      <input id='pSearch' placeholder='keyword'>
      <select id='pSort'><option value='new'>newest</option><option value='score'>highest score</option><option value='pain'>highest pain</option><option value='evidence'>strongest evidence</option><option value='repeat'>most repeated</option></select>
    </div>
    <div class='grid two'>
      <select id='pStatusFilter'>
        <option value=''>all status</option>
        ${statuses.map(s => `<option value='${s}'>${s}</option>`).join('')}
      </select>
      <select id='pConfidenceFilter'>
        <option value=''>all confidence</option>
        ${confidenceLevels.map(c => `<option value='${c}'>${c}</option>`).join('')}
      </select>
      <select id='pEvidenceFilter'>
        <option value='0'>all evidence</option>
        <option value='3'>evidence ≥ 3</option>
        <option value='5'>evidence ≥ 5</option>
        <option value='6'>evidence ≥ 6</option>
      </select>
      <select id='pScoreFilter'>
        <option value='0'>all scores</option>
        <option value='20'>score ≥ 20</option>
        <option value='40'>score ≥ 40</option>
        <option value='60'>score ≥ 60</option>
      </select>
    </div>
    <div id='problemList'></div>`));

  document.getElementById('newCluster').onclick = () => {
    const ids = state.observations.slice(0, 3).map(o => o.id);
    state.clusters.unshift({ id: uid(), title: 'Manual cluster', summary: 'Edit title/summary and suspected root cause.', observationIds: ids });
    persist(); render();
  };

  document.getElementById('openCardCreate').onclick = () => {
    root.innerHTML = '';
    renderProblemEditor(root);
  };

  root.querySelectorAll('[data-promote]').forEach(b => b.onclick = () => {
    const c = state.clusters.find(x => x.id === b.dataset.promote);
    const linked = state.observations.filter(o => c.observationIds?.includes(o.id));
    state.problemCards.unshift({
      id: uid(), title: c.title, affected: 'people like me', job: linked[0]?.task || '', friction: c.summary || linked.map(x => x.friction).join(' | '), workaround: linked.map(x => x.workaround).filter(Boolean)[0] || '', weakness: 'Current options are fragmented/manual.',
      evidenceText: 'Built from linked observations', frequency: linked.length || 1, severity: Math.round(linked.reduce((a, b) => a + (b.pain || 3), 0) / (linked.length || 1)), spread: Math.max(...linked.map(x => x.spread || 1), 1), timeLoss: Math.round(linked.reduce((a, b) => a + (b.timeLoss || 0), 0) / (linked.length || 1)), moneyLoss: Math.round(linked.reduce((a, b) => a + (b.moneyLoss || 0), 0) / (linked.length || 1)),
      pay: 3, urgency: 3, evidence: Math.min(7, linked.length + 2), confidence: 'medium', status: statuses[1], pinned: false, observationIds: c.observationIds || [], createdAt: new Date().toISOString(),
    });
    persist(); render();
  });

  renderProblemList(root);
}

function renderProblemList(root) {
  const el = document.getElementById('problemList');
  if (!el) return;
  const q = (document.getElementById('pSearch').value || '').toLowerCase();
  const sort = document.getElementById('pSort').value;
  const statusFilter = document.getElementById('pStatusFilter')?.value || '';
  const confidenceFilter = document.getElementById('pConfidenceFilter')?.value || '';
  const minEvidence = +(document.getElementById('pEvidenceFilter')?.value || 0);
  const minScore = +(document.getElementById('pScoreFilter')?.value || 0);

  let arr = state.problemCards
    .filter(p => JSON.stringify(p).toLowerCase().includes(q))
    .map(p => ({ ...p, score: opportunityScore(p) }))
    .filter(p => !statusFilter || p.status === statusFilter)
    .filter(p => !confidenceFilter || p.confidence === confidenceFilter)
    .filter(p => (p.evidence || 0) >= minEvidence)
    .filter(p => (p.score || 0) >= minScore);

  if (sort === 'score') arr.sort((a, b) => b.score - a.score);
  else if (sort === 'pain') arr.sort((a, b) => b.severity - a.severity);
  else if (sort === 'evidence') arr.sort((a, b) => b.evidence - a.evidence);
  else if (sort === 'repeat') arr.sort((a, b) => b.frequency - a.frequency);
  else arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  el.innerHTML = arr.map(p => `<div class='item'>
      <div class='row-between'><b>${escapeHtml(p.title || 'Untitled')}</b><span class='badge'>${p.score}</span></div>
      <div class='small'>Status: ${p.status} | Confidence: ${p.confidence} | Evidence: ${evidenceLabels[(p.evidence || 1)-1]}</div>
      <div>${escapeHtml(p.friction || '')}</div>
      ${(p.evidence <= 2 || p.confidence === 'low') ? `<div class='warn-box'>⚠ Weak confidence/evidence. Run validation interviews before solution work.</div>` : ''}
      <div class='actions'>
        <button data-pin='${p.id}'>${p.pinned ? 'Unpin' : 'Pin'}</button>
        <button data-top='${p.id}'>Mark top opportunity</button>
        <button data-edit='${p.id}'>Edit full card</button>
      </div>
    </div>`).join('') || tr('empty');

  el.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { const p = state.problemCards.find(x => x.id === b.dataset.pin); p.pinned = !p.pinned; persist(); renderProblemList(root); });
  el.querySelectorAll('[data-top]').forEach(b => b.onclick = () => { const p = state.problemCards.find(x => x.id === b.dataset.top); p.status = statuses[3]; persist(); renderProblemList(root); });
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const p = state.problemCards.find(x => x.id === b.dataset.edit);
    root.innerHTML = '';
    renderProblemEditor(root, p);
  });

  document.getElementById('pSearch').oninput = () => renderProblemList(root);
  document.getElementById('pSort').onchange = () => renderProblemList(root);
  document.getElementById('pStatusFilter').onchange = () => renderProblemList(root);
  document.getElementById('pConfidenceFilter').onchange = () => renderProblemList(root);
  document.getElementById('pEvidenceFilter').onchange = () => renderProblemList(root);
  document.getElementById('pScoreFilter').onchange = () => renderProblemList(root);
}

function renderSettings(root) {
  const w = state.settings.weights;
  root.append(card(`<h3>Onboarding</h3>
    <div class='note'>This is not a note app. Focus on repeated frictions, concrete workarounds, and evidence strength before any solution.</div>
    <ul><li>Weak: “Need better system”.</li><li>Strong: “I copied the same data into two tools while preparing a report.”</li><li>Link repeated observations to build one strong problem card.</li></ul>
  `));

  root.append(card(`<h3>Data & Privacy</h3><p>${tr('privacy')}</p>
    <div class='actions'><button id='exportJson'>Export JSON</button><button id='exportCsv'>Export CSV</button><input id='importJson' type='file' accept='application/json'></div>
  `));

  root.append(card(`<h3>Opportunity Weights</h3>
    <div class='grid two'>${Object.entries(w).map(([k, v]) => `<div><label>${k}</label><input data-w='${k}' type='number' step='0.1' value='${v}'></div>`).join('')}</div>
  `));

  root.append(card(`<h3>${tr('ai')}</h3>
    <label>${tr('aiKey')}</label><input id='aiKeyInput' type='password' value='${state.settings.aiKey || ''}' placeholder='sk-...'>
    <div class='actions'><button id='saveKey'>${tr('saveKey')}</button><button id='removeKey'>${tr('removeKey')}</button><button id='testKey'>${tr('testKey')}</button></div>
    <pre id='aiOutput' class='item small'></pre>
  `));

  root.querySelectorAll('[data-w]').forEach(inp => inp.onchange = () => { state.settings.weights[inp.dataset.w] = +inp.value || 1; persist(); });
  document.getElementById('saveKey').onclick = () => { state.settings.aiKey = val('aiKeyInput').trim(); persist(); alert('Saved'); };
  document.getElementById('removeKey').onclick = () => { state.settings.aiKey = ''; persist(); alert('Removed'); render(); };
  document.getElementById('testKey').onclick = () => testAIKey();

  document.getElementById('exportJson').onclick = () => download('problem-discovery.json', JSON.stringify(state, null, 2));
  document.getElementById('exportCsv').onclick = () => download('observations.csv', toCSV(state.observations));
  document.getElementById('importJson').onchange = e => {
    const f = e.target.files?.[0]; if (!f) return;
    f.text().then(txt => { state = { ...defaultState, ...JSON.parse(txt) }; persist(); render(); });
  };
}

async function deepseek(prompt, data) {
  const key = state.settings.aiKey;
  if (!key) throw new Error('No API key saved');
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are a critical research thinking assistant. Output suggestions only.' },
        { role: 'user', content: `${prompt}\n\n${JSON.stringify(data).slice(0, 12000)}` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content || 'No response';
}

async function testAIKey() {
  const out = document.getElementById('aiOutput');
  out.textContent = 'Testing...';
  try {
    const text = await deepseek('Reply with connection-ok', { ping: true });
    out.textContent = `Success: ${text}`;
  } catch (e) {
    out.textContent = `Error: ${e.message}`;
  }
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

function toCSV(rows) {
  const keys = ['id', 'date', 'context', 'task', 'friction', 'workaround', 'frequency', 'pain', 'timeLoss', 'moneyLoss', 'spread', 'category', 'tags', 'signal'];
  const esc = v => `"${(Array.isArray(v) ? v.join('|') : v ?? '').toString().replaceAll('"', '""')}"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}

function escapeHtml(str = '') { return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }

function seedDemo() {
  if (state.captures.length || state.observations.length || state.problemCards.length) return;
  state.captures = [
    { id: uid(), date: new Date().toISOString(), task: 'Prepare weekly team report', friction: 'Copied KPI values from chat to spreadsheet then dashboard.', workaround: 'Temporary notes + copy/paste loop', category: 'manual transfer', favorite: false },
    { id: uid(), date: new Date().toISOString(), task: 'تجهيز تقرير أسبوعي', friction: 'نسخت نفس البيانات يدويًا بين نظامين أكثر من مرة.', workaround: 'ملف ملاحظات وسيط', category: 'repetition', favorite: false },
  ];
  state.observations = [
    { id: uid(), date: new Date().toISOString(), context: 'office', task: 'Invoice approval follow-up', friction: 'Waiting for manual email confirmation delays payout.', workaround: 'Repeated reminders', frequency: 4, pain: 4, timeLoss: 45, moneyLoss: 0, spread: 3, category: 'waiting', tags: ['finance'], signal: 'current problem', important: true },
    { id: uid(), date: new Date().toISOString(), context: 'remote', task: 'Customer onboarding', friction: 'Asked for same details in two forms.', workaround: 'Copied answers from first form', frequency: 3, pain: 3, timeLoss: 25, moneyLoss: 0, spread: 4, category: 'repetition', tags: ['onboarding'], signal: 'future signal', important: false },
  ];
  state.problemCards = [
    { id: uid(), title: 'Duplicate data entry across tools', affected: 'operations teams', job: 'Complete reports quickly', friction: 'Same data entered repeatedly across disconnected systems.', workaround: 'Copy/paste and temporary notes', weakness: 'Tools do not sync cleanly.', evidenceText: 'Observed repeatedly with workarounds.', frequency: 5, severity: 4, spread: 4, timeLoss: 40, moneyLoss: 20, pay: 4, urgency: 4, evidence: 6, confidence: 'medium', status: 'strong problem', pinned: true, createdAt: new Date().toISOString(), observationIds: [] },
  ];
  persist();
}

function render() {
  setLang(); nav();
  const root = document.getElementById('app');
  root.innerHTML = '';
  const m = {
    Home: renderHome, Capture: renderCapture, Inbox: renderInbox, Review: renderReview, Patterns: renderPatterns, Problems: renderProblems, Settings: renderSettings,
    'الرئيسية': renderHome, 'التقاط': renderCapture, 'الوارد': renderInbox, 'مراجعة': renderReview, 'الأنماط': renderPatterns, 'المشكلات': renderProblems, 'الإعدادات': renderSettings,
  };
  (m[state.tab] || renderHome)(root);
}

document.getElementById('languageSelect').onchange = e => {
  state.language = e.target.value;
  state.tab = t[state.language].nav[0];
  persist();
  render();
};

seedDemo();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
render();
