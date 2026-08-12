const statConfig = [
  ["str", "筋力"], ["vit", "体力"], ["dex", "器用"],
  ["int", "知力"], ["wis", "精神"], ["luk", "幸運"]
];
const statsRoot = document.querySelector("#stats");
const form = document.querySelector("#character-form");
const preview = document.querySelector("#preview-card");
const savedList = document.querySelector("#saved-list");
const pointStatus = document.querySelector("#point-status");
const STORAGE_KEY = "character-creator.characters";
const MAX_TOTAL = 60;

for (const [key, label] of statConfig) {
  statsRoot.insertAdjacentHTML("beforeend", `
    <div class="stat-row">
      <span>${label}</span>
      <input id="${key}" type="range" min="1" max="20" value="10" />
      <span class="stat-value" id="${key}-value">10</span>
    </div>`);
}

const fields = ["name", "race", "job", "personality", "appearance", ...statConfig.map(([key]) => key)];
fields.forEach(id => document.querySelector(`#${id}`).addEventListener("input", renderPreview));

function getCharacter() {
  const character = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: document.querySelector("#name").value.trim() || "名前のない冒険者",
    race: document.querySelector("#race").value,
    job: document.querySelector("#job").value,
    personality: document.querySelector("#personality").value,
    appearance: document.querySelector("#appearance").value.trim(),
    stats: {}
  };
  for (const [key, label] of statConfig) {
    character.stats[key] = { label, value: Number(document.querySelector(`#${key}`).value) };
  }
  return character;
}

function totalStats(character) {
  return Object.values(character.stats).reduce((sum, stat) => sum + stat.value, 0);
}

function renderPreview() {
  const c = getCharacter();
  for (const [key] of statConfig) document.querySelector(`#${key}-value`).textContent = c.stats[key].value;
  const total = totalStats(c);
  pointStatus.textContent = `合計能力値 ${total} / ${MAX_TOTAL}`;
  pointStatus.style.color = total > MAX_TOTAL ? "#ff9b9b" : "";

  preview.innerHTML = `
    <h2 class="card-name">${escapeHtml(c.name)}</h2>
    <p class="card-meta">${escapeHtml(c.race)} / ${escapeHtml(c.job)} / ${escapeHtml(c.personality)}</p>
    <div class="card-stats">
      ${Object.values(c.stats).map(s => `<div class="card-stat">${s.label}<strong>${s.value}</strong></div>`).join("")}
    </div>
    <div class="card-note">${escapeHtml(c.appearance || "外見や設定はまだ記入されていません。")}</div>`;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const c = getCharacter();
  if (totalStats(c) > MAX_TOTAL) {
    alert(`能力値の合計は ${MAX_TOTAL} 以下にしてください。`);
    return;
  }
  const characters = loadCharacters();
  characters.unshift(c);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  renderSaved();
});

document.querySelector("#randomize").addEventListener("click", () => {
  const names = ["リュカ", "セリア", "ノア", "ミラ", "カイ", "エルナ"];
  document.querySelector("#name").value = names[Math.floor(Math.random() * names.length)];
  ["race", "job", "personality"].forEach(id => {
    const el = document.querySelector(`#${id}`);
    el.selectedIndex = Math.floor(Math.random() * el.options.length);
  });
  let remaining = MAX_TOTAL;
  statConfig.forEach(([key], index) => {
    const slots = statConfig.length - index;
    const max = Math.min(20, remaining - (slots - 1));
    const value = index === statConfig.length - 1 ? remaining : Math.max(1, Math.floor(Math.random() * max) + 1);
    document.querySelector(`#${key}`).value = value;
    remaining -= value;
  });
  renderPreview();
});

document.querySelector("#clear-all").addEventListener("click", () => {
  if (!confirm("保存したキャラクターをすべて削除しますか？")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderSaved();
});

function loadCharacters() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function renderSaved() {
  const characters = loadCharacters();
  if (!characters.length) {
    savedList.innerHTML = '<p class="empty">まだ保存されていません。</p>';
    return;
  }
  savedList.innerHTML = characters.map(c => `
    <div class="saved-item">
      <p><strong>${escapeHtml(c.name)}</strong><br><small>${escapeHtml(c.race)} / ${escapeHtml(c.job)}</small></p>
      <button type="button" data-id="${c.id}">削除</button>
    </div>`).join("");

  savedList.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    const next = loadCharacters().filter(c => c.id !== button.dataset.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    renderSaved();
  }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

renderPreview();
renderSaved();
