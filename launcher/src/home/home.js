// LiquidHome — macOS-style shell. Menu bar + desktop widgets + Launchpad + Settings.

let apps = [];
let cfg = null;
const PER_PAGE_ROWS = 5;

const pagesEl = document.getElementById('pages');
const dotsEl = document.getElementById('dots');
const search = document.getElementById('search');
const launchpad = document.getElementById('launchpad');
const settings = document.getElementById('settings');

/* ---------------- Config ---------------- */
function applyConfig() {
  document.documentElement.style.setProperty('--icon', cfg.iconSize + 'px');
  document.documentElement.style.setProperty('--cols', cfg.columns);
  document.body.classList.toggle('mactiles', !!cfg.macTiles);
  document.body.classList.toggle('wallpaper', cfg.background === 'wallpaper');
  for (const w of ['weather', 'system', 'calendar']) {
    document.querySelector(`.card.${w}`).classList.toggle('hidden', !cfg.widgets[w]);
  }
  if (!window.liquid.dev) document.body.classList.add('shell');
  applyBackground(cfg.background);
  renderApps();
}

/* ---------------- Background ---------------- */
const bg = document.getElementById('bg');
async function applyBackground(mode) {
  if (mode === 'wallpaper') {
    const data = await window.liquid.getWallpaper();
    if (data) { bg.style.backgroundImage = `url("${data}")`; document.body.classList.add('wallpaper'); return; }
  }
  bg.style.backgroundImage = '';
  document.body.classList.remove('wallpaper');
}

/* ---------------- Launchpad (app menu) ---------------- */
function perPage() { return cfg.columns * PER_PAGE_ROWS; }

function tileFor(a) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.title = a.name;
  const ico = document.createElement('div');
  ico.className = 'ico';
  const img = document.createElement('img');
  if (a.icon) img.src = a.icon;
  img.alt = '';
  ico.append(img);
  const label = document.createElement('span');
  label.textContent = a.name;
  tile.append(ico, label);
  tile.addEventListener('click', () => { window.liquid.launch(a.path); closeOverlays(); });
  return tile;
}
function renderPaged(list) {
  pagesEl.classList.remove('searching');
  pagesEl.innerHTML = ''; dotsEl.innerHTML = '';
  const pp = perPage();
  const pageCount = Math.max(1, Math.ceil(list.length / pp));
  for (let p = 0; p < pageCount; p++) {
    const page = document.createElement('div');
    page.className = 'page';
    for (const a of list.slice(p * pp, (p + 1) * pp)) page.append(tileFor(a));
    pagesEl.append(page);
    const dot = document.createElement('div');
    dot.className = 'dot' + (p === 0 ? ' active' : '');
    dot.addEventListener('click', () => pagesEl.scrollTo({ left: p * pagesEl.clientWidth, behavior: 'smooth' }));
    dotsEl.append(dot);
  }
}
function renderSearch(list) {
  pagesEl.classList.add('searching'); dotsEl.innerHTML = ''; pagesEl.innerHTML = '';
  const page = document.createElement('div'); page.className = 'page';
  if (!list.length) { const e = document.createElement('div'); e.id = 'empty'; e.textContent = 'No matches'; page.append(e); }
  else for (const a of list) page.append(tileFor(a));
  pagesEl.append(page);
}
function renderApps() {
  const q = search.value.trim().toLowerCase();
  if (!q) renderPaged(apps);
  else renderSearch(apps.filter((a) => a.name.toLowerCase().includes(q)));
}
function currentPage() { return pagesEl.clientWidth ? Math.round(pagesEl.scrollLeft / pagesEl.clientWidth) : 0; }
pagesEl.addEventListener('scroll', () => { const i = currentPage(); [...dotsEl.children].forEach((d, k) => d.classList.toggle('active', k === i)); }, { passive: true });
pagesEl.addEventListener('wheel', (e) => {
  if (pagesEl.classList.contains('searching')) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); pagesEl.scrollLeft += e.deltaY; }
}, { passive: false });
search.addEventListener('input', renderApps);

async function loadApps() {
  apps = await window.liquid.getApps();
  renderApps();
  console.log(`LiquidHome: ${apps.length} apps, ${apps.filter((a) => a.icon).length} with icons`);
}

/* ---------------- Overlays ---------------- */
function openLaunchpad() {
  settings.classList.add('hidden');
  launchpad.classList.remove('hidden');
  search.value = ''; renderApps();
  pagesEl.scrollTo({ left: 0 }); search.focus();
}
function openSettings() { launchpad.classList.add('hidden'); settings.classList.remove('hidden'); }
function closeOverlays() { launchpad.classList.add('hidden'); settings.classList.add('hidden'); }

document.getElementById('open-launchpad').addEventListener('click', openLaunchpad);
document.getElementById('mb-logo').addEventListener('click', openLaunchpad);
document.getElementById('open-settings').addEventListener('click', openSettings);
launchpad.addEventListener('mousedown', (e) => { if (e.target === launchpad || e.target.classList.contains('page')) closeOverlays(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return closeOverlays();
  if (launchpad.classList.contains('hidden')) return;
  if (e.key === 'Enter') { const t = pagesEl.querySelector('.tile'); if (t) t.click(); }
  else if (e.key === 'ArrowRight') pagesEl.scrollTo({ left: (currentPage() + 1) * pagesEl.clientWidth, behavior: 'smooth' });
  else if (e.key === 'ArrowLeft') pagesEl.scrollTo({ left: (currentPage() - 1) * pagesEl.clientWidth, behavior: 'smooth' });
  else if (e.target !== search && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) search.focus();
});

/* ---------------- Settings page ---------------- */
function bindSettings() {
  const $ = (id) => document.getElementById(id);
  $('s-bg').value = cfg.background;
  $('s-iconsize').value = cfg.iconSize; $('s-iconsize-val').textContent = cfg.iconSize + 'px';
  $('s-cols').value = cfg.columns; $('s-cols-val').textContent = cfg.columns;
  $('s-mactiles').checked = cfg.macTiles;
  $('s-clock24').checked = cfg.clock24;
  $('s-w-weather').checked = cfg.widgets.weather;
  $('s-w-system').checked = cfg.widgets.system;
  $('s-w-calendar').checked = cfg.widgets.calendar;

  async function save(patch) { cfg = await window.liquid.setConfig(patch); applyConfig(); }
  $('s-bg').addEventListener('change', (e) => save({ background: e.target.value }));
  $('s-iconsize').addEventListener('input', (e) => { $('s-iconsize-val').textContent = e.target.value + 'px'; save({ iconSize: +e.target.value }); });
  $('s-cols').addEventListener('input', (e) => { $('s-cols-val').textContent = e.target.value; save({ columns: +e.target.value }); });
  $('s-mactiles').addEventListener('change', (e) => save({ macTiles: e.target.checked }));
  $('s-clock24').addEventListener('change', (e) => save({ clock24: e.target.checked }));
  $('s-w-weather').addEventListener('change', (e) => save({ widgets: { weather: e.target.checked } }));
  $('s-w-system').addEventListener('change', (e) => save({ widgets: { system: e.target.checked } }));
  $('s-w-calendar').addEventListener('change', (e) => save({ widgets: { calendar: e.target.checked } }));
  $('s-close').addEventListener('click', closeOverlays);
}

/* ---------------- Widgets + menu-bar status ---------------- */
const WCODE = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',
  61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️' };
function tickClock() {
  const now = new Date();
  const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !cfg.clock24 });
  document.getElementById('mb-clock').textContent = t;
}
function buildCalendar() {
  const grid = document.querySelector('.cal-grid'); const now = new Date();
  document.querySelector('.cal-title').textContent = now.toLocaleDateString([], { month: 'long', year: 'numeric' });
  grid.innerHTML = '';
  for (const d of ['S','M','T','W','T','F','S']) { const h = document.createElement('span'); h.className = 'head'; h.textContent = d; grid.append(h); }
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let i = 0; i < first; i++) { const s = document.createElement('span'); s.className = 'empty'; s.textContent = '.'; grid.append(s); }
  for (let d = 1; d <= days; d++) { const s = document.createElement('span'); s.textContent = d; if (d === now.getDate()) s.className = 'today'; grid.append(s); }
}
async function tickSystem() {
  try {
    const s = await window.liquid.getSystem();
    const cpu = Math.round(s.cpu * 100);
    document.querySelector('.cpu-val').textContent = cpu + '%';
    document.querySelector('.cpu-bar').style.width = cpu + '%';
    const gb = (n) => (n / 1073741824).toFixed(1);
    document.querySelector('.mem-val').textContent = `${gb(s.memUsed)} / ${gb(s.memTotal)} GB`;
    document.querySelector('.mem-bar').style.width = Math.round((s.memUsed / s.memTotal) * 100) + '%';
  } catch {}
  try {
    if (navigator.getBattery) {
      const b = await navigator.getBattery(); const pct = Math.round(b.level * 100);
      const txt = pct + '%' + (b.charging ? ' ⚡' : '');
      document.querySelector('.bat-val').textContent = txt;
      document.querySelector('.bat-bar').style.width = pct + '%';
      document.getElementById('mb-battery').textContent = '🔋 ' + txt;
    } else { document.querySelector('.bat-val').textContent = 'n/a'; document.getElementById('mb-battery').textContent = ''; }
  } catch {}
}
async function loadWeather() {
  const w = await window.liquid.getWeather();
  if (!w) { document.querySelector('.weather-city').textContent = 'Offline'; document.querySelector('.weather-emoji').textContent = '🌐'; document.getElementById('mb-weather').textContent = ''; return; }
  document.querySelector('.weather-emoji').textContent = WCODE[w.code] ?? '🌡️';
  document.querySelector('.weather-temp').textContent = w.temp + '°';
  document.querySelector('.weather-city').textContent = w.city || '';
  document.getElementById('mb-weather').textContent = `${WCODE[w.code] ?? ''} ${w.temp}°`;
}

/* ---------------- Window controls (dev only) ---------------- */
document.getElementById('min').addEventListener('click', () => window.liquid.minimize());
document.getElementById('quit').addEventListener('click', () => window.liquid.quit());

/* ---------------- Boot ---------------- */
(async function boot() {
  cfg = await window.liquid.getConfig();
  applyConfig();
  bindSettings();
  await loadApps();
  tickClock(); buildCalendar(); tickSystem(); loadWeather();
  setInterval(tickClock, 1000);
  setInterval(tickSystem, 2000);
  setInterval(loadWeather, 10 * 60 * 1000);
  setInterval(buildCalendar, 60 * 60 * 1000);
})();
