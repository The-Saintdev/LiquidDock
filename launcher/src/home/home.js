// LiquidHome — the shell. Apps + widgets + background, all in one home.

/* ---------------- Apps ---------------- */
const pagesEl = document.getElementById('pages');
const dotsEl = document.getElementById('dots');
const search = document.getElementById('search');
let apps = [];
const PER_PAGE = 32; // 8 x 4

function tileFor(a) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.title = a.name;
  const img = document.createElement('img');
  if (a.icon) img.src = a.icon;
  img.alt = '';
  const label = document.createElement('span');
  label.textContent = a.name;
  tile.append(img, label);
  tile.addEventListener('click', () => window.liquid.launch(a.path));
  return tile;
}
function renderPaged(list) {
  pagesEl.classList.remove('searching');
  pagesEl.innerHTML = ''; dotsEl.innerHTML = '';
  const pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
  for (let p = 0; p < pageCount; p++) {
    const page = document.createElement('div');
    page.className = 'page';
    for (const a of list.slice(p * PER_PAGE, (p + 1) * PER_PAGE)) page.append(tileFor(a));
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
  if (!list.length) {
    const empty = document.createElement('div'); empty.id = 'empty';
    empty.textContent = apps.length ? 'No matches' : 'Loading apps…';
    page.append(empty);
  } else for (const a of list) page.append(tileFor(a));
  pagesEl.append(page);
}
function applyFilter() {
  const q = search.value.trim().toLowerCase();
  if (!q) return renderPaged(apps);
  renderSearch(apps.filter((a) => a.name.toLowerCase().includes(q)));
}
function currentPage() { return pagesEl.clientWidth ? Math.round(pagesEl.scrollLeft / pagesEl.clientWidth) : 0; }
function syncDots() { const i = currentPage(); [...dotsEl.children].forEach((d, k) => d.classList.toggle('active', k === i)); }
pagesEl.addEventListener('scroll', syncDots, { passive: true });
pagesEl.addEventListener('wheel', (e) => {
  if (pagesEl.classList.contains('searching')) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); pagesEl.scrollLeft += e.deltaY; }
}, { passive: false });
search.addEventListener('input', applyFilter);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const t = pagesEl.querySelector('.tile'); if (t) t.click(); }
  else if (e.key === 'ArrowRight') pagesEl.scrollTo({ left: (currentPage() + 1) * pagesEl.clientWidth, behavior: 'smooth' });
  else if (e.key === 'ArrowLeft') pagesEl.scrollTo({ left: (currentPage() - 1) * pagesEl.clientWidth, behavior: 'smooth' });
  else if (e.target !== search && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) search.focus();
});
async function loadApps() {
  apps = await window.liquid.getApps();
  applyFilter();
  console.log(`LiquidHome: ${apps.length} apps, ${apps.filter((a) => a.icon).length} with icons`);
}

/* ---------------- Widgets ---------------- */
const WCODE = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',
  61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️' };
function tickClock() {
  const now = new Date();
  document.querySelector('#clock .time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.querySelector('#clock .date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
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
      document.querySelector('.bat-val').textContent = pct + '%' + (b.charging ? ' ⚡' : '');
      document.querySelector('.bat-bar').style.width = pct + '%';
    } else document.querySelector('.bat-val').textContent = 'n/a';
  } catch {}
}
async function loadWeather() {
  const w = await window.liquid.getWeather();
  if (!w) { document.querySelector('.weather-city').textContent = 'Offline'; document.querySelector('.weather-emoji').textContent = '🌐'; return; }
  document.querySelector('.weather-emoji').textContent = WCODE[w.code] ?? '🌡️';
  document.querySelector('.weather-temp').textContent = w.temp + '°';
  document.querySelector('.weather-city').textContent = w.city || '';
}

/* ---------------- Background switch ---------------- */
const bg = document.getElementById('bg');
async function applyBackground(mode) {
  if (mode === 'wallpaper') {
    const data = await window.liquid.getWallpaper();
    if (data) { bg.style.backgroundImage = `url("${data}")`; document.body.classList.add('wallpaper'); localStorage.setItem('bg', 'wallpaper'); return; }
  }
  bg.style.backgroundImage = ''; document.body.classList.remove('wallpaper'); localStorage.setItem('bg', 'designed');
}
document.getElementById('bg-toggle').addEventListener('click', () => {
  applyBackground(localStorage.getItem('bg') === 'wallpaper' ? 'designed' : 'wallpaper');
});

/* ---------------- Window actions ---------------- */
document.getElementById('min').addEventListener('click', () => window.liquid.minimize());
document.getElementById('quit').addEventListener('click', () => window.liquid.quit());

/* ---------------- Boot ---------------- */
tickClock(); buildCalendar(); tickSystem(); loadWeather(); loadApps();
applyBackground(localStorage.getItem('bg') || 'designed');
setInterval(tickClock, 1000);
setInterval(tickSystem, 2000);
setInterval(loadWeather, 10 * 60 * 1000);
setInterval(buildCalendar, 60 * 60 * 1000);
