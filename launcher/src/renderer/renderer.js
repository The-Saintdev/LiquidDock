// LiquidLaunch — renderer. No Node here; everything goes through window.liquid.

const appEl = document.getElementById('app');
const pagesEl = document.getElementById('pages');
const dotsEl = document.getElementById('dots');
const search = document.getElementById('search');
const widgetsEl = document.getElementById('widgets');
const tabs = document.getElementById('tabs');

let apps = [];
let currentView = 'apps';
const PER_PAGE = 35; // 7 columns x 5 rows

/* ---------------- Apps (Launchpad) ---------------- */

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
  pagesEl.innerHTML = '';
  dotsEl.innerHTML = '';
  const pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
  for (let p = 0; p < pageCount; p++) {
    const page = document.createElement('div');
    page.className = 'page';
    for (const a of list.slice(p * PER_PAGE, (p + 1) * PER_PAGE)) page.append(tileFor(a));
    pagesEl.append(page);

    const dot = document.createElement('div');
    dot.className = 'dot' + (p === 0 ? ' active' : '');
    dot.addEventListener('click', () => scrollToPage(p));
    dotsEl.append(dot);
  }
}

function renderSearch(list) {
  pagesEl.classList.add('searching');
  dotsEl.innerHTML = '';
  pagesEl.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';
  if (!list.length) {
    const empty = document.createElement('div');
    empty.id = 'empty';
    empty.textContent = apps.length ? 'No matches' : 'Loading apps…';
    page.append(empty);
  } else {
    for (const a of list) page.append(tileFor(a));
  }
  pagesEl.append(page);
}

function applyFilter() {
  const q = search.value.trim().toLowerCase();
  if (!q) return renderPaged(apps);
  renderSearch(apps.filter((a) => a.name.toLowerCase().includes(q)));
}

function scrollToPage(i) {
  const w = pagesEl.clientWidth;
  pagesEl.scrollTo({ left: i * w, behavior: 'smooth' });
}
function currentPage() {
  return pagesEl.clientWidth ? Math.round(pagesEl.scrollLeft / pagesEl.clientWidth) : 0;
}
function syncDots() {
  const i = currentPage();
  [...dotsEl.children].forEach((d, k) => d.classList.toggle('active', k === i));
}
pagesEl.addEventListener('scroll', syncDots, { passive: true });
// Vertical wheel -> horizontal paging (Launchpad feel).
pagesEl.addEventListener('wheel', (e) => {
  if (pagesEl.classList.contains('searching')) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault();
    pagesEl.scrollLeft += e.deltaY;
  }
}, { passive: false });

async function loadApps() {
  apps = await window.liquid.getApps();
  applyFilter();
  const withIcons = apps.filter((a) => a.icon).length;
  console.log(`LiquidLaunch: ${apps.length} apps rendered, ${withIcons} with icons`);
}

/* ---------------- Widgets ---------------- */

const WCODE = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',
  61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️' };

function buildWidgets() {
  widgetsEl.innerHTML = `
    <div class="card" id="w-clock"><h3>Clock</h3><div class="clock-time">--:--</div><div class="clock-date"></div></div>
    <div class="card" id="w-weather"><h3>Weather</h3><div class="weather-row"><span class="weather-emoji">…</span><span class="weather-temp">--°</span></div><div class="weather-city">Locating…</div></div>
    <div class="card" id="w-system"><h3>System</h3>
      <div class="stat"><div class="stat-label"><span>CPU</span><span class="cpu-val">–</span></div><div class="bar"><i class="cpu-bar" style="width:0%"></i></div></div>
      <div class="stat"><div class="stat-label"><span>Memory</span><span class="mem-val">–</span></div><div class="bar"><i class="mem-bar" style="width:0%"></i></div></div>
      <div class="stat"><div class="stat-label"><span>Battery</span><span class="bat-val">–</span></div><div class="bar"><i class="bat-bar" style="width:0%"></i></div></div>
    </div>
    <div class="card" id="w-cal"><h3 class="cal-title">Calendar</h3><div class="cal-grid"></div></div>`;
  buildCalendar();
}

function tickClock() {
  const el = document.querySelector('#w-clock');
  if (!el) return;
  const now = new Date();
  el.querySelector('.clock-time').textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  el.querySelector('.clock-date').textContent =
    now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function buildCalendar() {
  const grid = document.querySelector('#w-cal .cal-grid');
  const title = document.querySelector('#w-cal .cal-title');
  if (!grid) return;
  const now = new Date();
  title.textContent = now.toLocaleDateString([], { month: 'long', year: 'numeric' });
  grid.innerHTML = '';
  for (const d of ['S','M','T','W','T','F','S']) {
    const h = document.createElement('span'); h.className = 'head'; h.textContent = d; grid.append(h);
  }
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let i = 0; i < first; i++) { const s = document.createElement('span'); s.className = 'empty'; s.textContent = '.'; grid.append(s); }
  for (let d = 1; d <= days; d++) {
    const s = document.createElement('span');
    s.textContent = d;
    if (d === now.getDate()) s.className = 'today';
    grid.append(s);
  }
}

async function tickSystem() {
  const el = document.querySelector('#w-system');
  if (!el) return;
  try {
    const s = await window.liquid.getSystem();
    const cpu = Math.round(s.cpu * 100);
    el.querySelector('.cpu-val').textContent = cpu + '%';
    el.querySelector('.cpu-bar').style.width = cpu + '%';
    const memPct = Math.round((s.memUsed / s.memTotal) * 100);
    const gb = (n) => (n / 1073741824).toFixed(1);
    el.querySelector('.mem-val').textContent = `${gb(s.memUsed)} / ${gb(s.memTotal)} GB`;
    el.querySelector('.mem-bar').style.width = memPct + '%';
  } catch {}
  try {
    if (navigator.getBattery) {
      const b = await navigator.getBattery();
      const pct = Math.round(b.level * 100);
      el.querySelector('.bat-val').textContent = pct + '%' + (b.charging ? ' ⚡' : '');
      el.querySelector('.bat-bar').style.width = pct + '%';
    } else {
      el.querySelector('.bat-val').textContent = 'n/a';
    }
  } catch {}
}

async function loadWeather() {
  const el = document.querySelector('#w-weather');
  if (!el) return;
  const w = await window.liquid.getWeather();
  if (!w) { el.querySelector('.weather-city').textContent = 'Offline'; el.querySelector('.weather-emoji').textContent = '🌐'; return; }
  el.querySelector('.weather-emoji').textContent = WCODE[w.code] ?? '🌡️';
  el.querySelector('.weather-temp').textContent = w.temp + '°';
  el.querySelector('.weather-city').textContent = w.city || '';
}

let clockTimer = null, sysTimer = null;
function startWidgets() {
  buildWidgets();
  tickClock(); tickSystem(); loadWeather();
  clearInterval(clockTimer); clearInterval(sysTimer);
  clockTimer = setInterval(tickClock, 1000);
  sysTimer = setInterval(tickSystem, 2000);
}
function stopWidgets() { clearInterval(clockTimer); clearInterval(sysTimer); }

/* ---------------- View switching ---------------- */

function setView(view) {
  currentView = view;
  document.getElementById('view-apps').hidden = view !== 'apps';
  document.getElementById('view-widgets').hidden = view !== 'widgets';
  document.body.classList.toggle('view-widgets', view === 'widgets');
  [...tabs.children].forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'widgets') startWidgets();
  else { stopWidgets(); search.focus(); }
}
tabs.addEventListener('click', (e) => { if (e.target.dataset.view) setView(e.target.dataset.view); });

/* ---------------- Keyboard + reset ---------------- */

search.addEventListener('input', applyFilter);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return window.liquid.hide();
  if (currentView !== 'apps') { if (e.key === 'Tab') { e.preventDefault(); setView('apps'); } return; }
  if (e.key === 'Enter') { const t = pagesEl.querySelector('.tile'); if (t) t.click(); }
  else if (e.key === 'ArrowRight') { scrollToPage(currentPage() + 1); }
  else if (e.key === 'ArrowLeft') { scrollToPage(currentPage() - 1); }
  else if (e.key === 'Tab') { e.preventDefault(); setView('widgets'); }
  else if (e.target !== search && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) search.focus();
});

// Click empty space to dismiss.
pagesEl.addEventListener('mousedown', (e) => { if (e.target === pagesEl || e.target.classList.contains('page')) window.liquid.hide(); });

window.liquid.onReset(() => {
  setView('apps');
  search.value = '';
  applyFilter();
  search.focus();
  scrollToPage(0);
  appEl.classList.remove('reopen');
  void appEl.offsetWidth; // restart the open animation
  appEl.classList.add('reopen');
});

loadApps().then(() => {
  if (location.search.includes('smoke')) { setView('widgets'); console.log('SMOKE: widgets view built'); }
});
