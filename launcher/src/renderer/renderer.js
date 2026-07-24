// LiquidLaunch — launcher (app grid only). Widgets live on the desktop board.

const appEl = document.getElementById('app');
const pagesEl = document.getElementById('pages');
const dotsEl = document.getElementById('dots');
const search = document.getElementById('search');

let apps = [];
const PER_PAGE = 35; // 7 columns x 5 rows

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
  pagesEl.scrollTo({ left: i * pagesEl.clientWidth, behavior: 'smooth' });
}
function currentPage() {
  return pagesEl.clientWidth ? Math.round(pagesEl.scrollLeft / pagesEl.clientWidth) : 0;
}
function syncDots() {
  const i = currentPage();
  [...dotsEl.children].forEach((d, k) => d.classList.toggle('active', k === i));
}
pagesEl.addEventListener('scroll', syncDots, { passive: true });
pagesEl.addEventListener('wheel', (e) => {
  if (pagesEl.classList.contains('searching')) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); pagesEl.scrollLeft += e.deltaY; }
}, { passive: false });

async function loadApps() {
  apps = await window.liquid.getApps();
  applyFilter();
  const withIcons = apps.filter((a) => a.icon).length;
  console.log(`LiquidLaunch: ${apps.length} apps rendered, ${withIcons} with icons`);
}

search.addEventListener('input', applyFilter);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return window.liquid.hide();
  if (e.key === 'Enter') { const t = pagesEl.querySelector('.tile'); if (t) t.click(); }
  else if (e.key === 'ArrowRight') scrollToPage(currentPage() + 1);
  else if (e.key === 'ArrowLeft') scrollToPage(currentPage() - 1);
  else if (e.target !== search && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) search.focus();
});

pagesEl.addEventListener('mousedown', (e) => {
  if (e.target === pagesEl || e.target.classList.contains('page')) window.liquid.hide();
});

window.liquid.onReset(() => {
  search.value = '';
  applyFilter();
  search.focus();
  scrollToPage(0);
  appEl.classList.remove('reopen');
  void appEl.offsetWidth;
  appEl.classList.add('reopen');
});

loadApps();
