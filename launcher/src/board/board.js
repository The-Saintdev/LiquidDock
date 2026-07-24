// LiquidBoard — desktop widget logic. Always running, pinned to the wallpaper.

const WCODE = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',
  61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️' };

function tickClock() {
  const now = new Date();
  document.querySelector('.clock-time').textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.querySelector('.clock-date').textContent =
    now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function buildCalendar() {
  const grid = document.querySelector('.cal-grid');
  const now = new Date();
  document.querySelector('.cal-title').textContent =
    now.toLocaleDateString([], { month: 'long', year: 'numeric' });
  grid.innerHTML = '';
  for (const d of ['S', 'M', 'T', 'W', 'T', 'F', 'S']) {
    const h = document.createElement('span'); h.className = 'head'; h.textContent = d; grid.append(h);
  }
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let i = 0; i < first; i++) { const s = document.createElement('span'); s.className = 'empty'; s.textContent = '.'; grid.append(s); }
  for (let d = 1; d <= days; d++) {
    const s = document.createElement('span'); s.textContent = d;
    if (d === now.getDate()) s.className = 'today';
    grid.append(s);
  }
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
      const b = await navigator.getBattery();
      const pct = Math.round(b.level * 100);
      document.querySelector('.bat-val').textContent = pct + '%' + (b.charging ? ' ⚡' : '');
      document.querySelector('.bat-bar').style.width = pct + '%';
    } else {
      document.querySelector('.bat-val').textContent = 'n/a';
    }
  } catch {}
}

async function loadWeather() {
  const w = await window.liquid.getWeather();
  if (!w) {
    document.querySelector('.weather-city').textContent = 'Offline';
    document.querySelector('.weather-emoji').textContent = '🌐';
    return;
  }
  document.querySelector('.weather-emoji').textContent = WCODE[w.code] ?? '🌡️';
  document.querySelector('.weather-temp').textContent = w.temp + '°';
  document.querySelector('.weather-city').textContent = w.city || '';
}

tickClock(); buildCalendar(); tickSystem(); loadWeather();
setInterval(tickClock, 1000);
setInterval(tickSystem, 2000);
setInterval(loadWeather, 10 * 60 * 1000);
setInterval(buildCalendar, 60 * 60 * 1000);
console.log('LiquidBoard: widgets initialized');
