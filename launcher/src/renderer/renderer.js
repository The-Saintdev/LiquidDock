// LiquidLaunch — renderer. No Node here; everything goes through window.liquid.

const grid = document.getElementById('grid');
const search = document.getElementById('search');
let apps = [];

function render(list) {
  grid.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('div');
    empty.id = 'empty';
    empty.textContent = apps.length ? 'No matches' : 'Loading apps…';
    grid.append(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const a of list) {
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
    frag.append(tile);
  }
  grid.append(frag);
}

function applyFilter() {
  const q = search.value.trim().toLowerCase();
  if (!q) return render(apps);
  render(apps.filter((a) => a.name.toLowerCase().includes(q)));
}

async function load() {
  apps = await window.liquid.getApps();
  applyFilter();
  const withIcons = apps.filter((a) => a.icon).length;
  console.log(`LiquidLaunch: ${apps.length} apps rendered, ${withIcons} with icons`);
}

search.addEventListener('input', applyFilter);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.liquid.hide();
  } else if (e.key === 'Enter') {
    const first = grid.querySelector('.tile');
    if (first) first.click();
  } else if (e.target !== search && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    // Start typing anywhere -> jump into the search box (Launchpad behaviour).
    search.focus();
  }
});

// Click empty space to dismiss.
grid.addEventListener('mousedown', (e) => { if (e.target === grid) window.liquid.hide(); });
document.getElementById('top').addEventListener('mousedown', (e) => {
  if (e.target.id === 'top') window.liquid.hide();
});

// Main process asks us to reset when the overlay is (re)summoned.
window.liquid.onReset(() => {
  search.value = '';
  applyFilter();
  search.focus();
});

load();
