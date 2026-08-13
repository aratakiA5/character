const message = document.getElementById('message');
const heroEl = document.getElementById('hero');
const enemyEl = document.getElementById('enemy');
const damagePop = document.getElementById('damage-pop');
const buttons = [...document.querySelectorAll('[data-command]')];
const heroHpEl = document.getElementById('hero-hp');
const heroMpEl = document.getElementById('hero-mp');
const enemyHpEl = document.getElementById('enemy-hp');

const hero = { hp: 120, maxHp: 120, mp: 30, maxMp: 30, defending: false };
const enemy = { name: 'グリーンスライム', hp: 85, maxHp: 85 };
let busy = false;
let battleEnded = false;
let idleTimer = null;

const FRAME_SIZE = 48;
const ROW = { idle: 0, attack: 1, hit: 2, victory: 3 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setHeroFrame(row, frame) {
  heroEl.style.backgroundPosition = `${-(frame * FRAME_SIZE)}px ${-(row * FRAME_SIZE)}px`;
}

function startIdle() {
  clearInterval(idleTimer);
  let frame = 0;
  setHeroFrame(ROW.idle, frame);
  idleTimer = setInterval(() => {
    frame = (frame + 1) % 3;
    setHeroFrame(ROW.idle, frame);
  }, 360);
}

function stopIdle() {
  clearInterval(idleTimer);
  idleTimer = null;
}

async function playHeroAnimation(row, frames, frameTime = 120) {
  stopIdle();
  for (const frame of frames) {
    setHeroFrame(row, frame);
    await sleep(frameTime);
  }
}

function renderStatus() {
  heroHpEl.textContent = Math.max(0, hero.hp);
  heroMpEl.textContent = Math.max(0, hero.mp);
  enemyHpEl.textContent = Math.max(0, enemy.hp);
}

function setButtons(enabled) {
  buttons.forEach((button) => { button.disabled = !enabled; });
}

function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function showDamage(target, amount, isHeal = false) {
  const rect = target.getBoundingClientRect();
  const field = document.querySelector('.battlefield').getBoundingClientRect();
  damagePop.textContent = isHeal ? `+${amount}` : amount;
  damagePop.style.left = `${rect.left - field.left + rect.width / 2}px`;
  damagePop.style.top = `${rect.top - field.top + 10}px`;
  damagePop.classList.remove('show');
  void damagePop.offsetWidth;
  damagePop.classList.add('show');
  await sleep(500);
}

async function heroAttack(power = 1) {
  heroEl.classList.add('lunge');
  await playHeroAnimation(ROW.attack, [0, 1, 2, 1], 105);

  const damage = Math.round(roll(18, 27) * power);
  enemy.hp -= damage;
  enemyEl.classList.add('hit');
  message.textContent = `アルトの攻撃！ ${enemy.name}に${damage}のダメージ！`;
  renderStatus();
  await showDamage(enemyEl, damage);

  heroEl.classList.remove('lunge');
  enemyEl.classList.remove('hit');
  startIdle();
}

async function playHeroHit() {
  heroEl.classList.add('flash');
  await playHeroAnimation(ROW.hit, [0, 1, 0, 2], 120);
  heroEl.classList.remove('flash');
  if (!battleEnded) startIdle();
}

async function enemyTurn() {
  if (enemy.hp <= 0 || battleEnded) return;
  await sleep(450);

  const raw = roll(12, 20);
  const damage = hero.defending ? Math.ceil(raw / 2) : raw;
  hero.hp -= damage;
  message.textContent = `${enemy.name}の攻撃！ アルトは${damage}のダメージ！`;
  renderStatus();

  const hitAnim = playHeroHit();
  await showDamage(heroEl, damage);
  await hitAnim;
  hero.defending = false;

  if (hero.hp <= 0) {
    battleEnded = true;
    stopIdle();
    setHeroFrame(ROW.hit, 1);
    message.textContent = 'アルトは倒れた……。クリックしてフィールドへ戻る。';
    document.body.addEventListener('click', () => location.href = '../walking-chip/index.html', { once: true });
  }
}

async function checkVictory() {
  if (enemy.hp > 0) return false;

  battleEnded = true;
  setButtons(false);
  enemyEl.style.opacity = '0';
  stopIdle();
  message.textContent = `${enemy.name}を倒した！ 12 EXP と 8 G を手に入れた。`;

  await playHeroAnimation(ROW.victory, [0, 1, 2, 1], 150);
  setHeroFrame(ROW.victory, 1);
  heroEl.classList.add('victory-hop');
  message.textContent += ' クリックしてフィールドへ戻る。';
  document.body.addEventListener('click', () => location.href = '../walking-chip/index.html', { once: true });
  return true;
}

async function execute(command) {
  if (busy || battleEnded) return;
  busy = true;
  setButtons(false);

  if (command === 'attack') {
    await heroAttack();
  } else if (command === 'magic') {
    if (hero.mp < 6) {
      message.textContent = 'MPが足りない！';
      await sleep(700);
      busy = false;
      setButtons(true);
      return;
    }
    hero.mp -= 6;
    message.textContent = 'アルトはファイアを唱えた！';
    await sleep(350);
    await heroAttack(1.55);
  } else if (command === 'defend') {
    hero.defending = true;
    message.textContent = 'アルトは身を守っている。';
    await sleep(500);
  } else if (command === 'run') {
    if (Math.random() < 0.65) {
      battleEnded = true;
      stopIdle();
      message.textContent = 'うまく逃げ切った！';
      await sleep(550);
      location.href = '../walking-chip/index.html';
      return;
    }
    message.textContent = 'しかし逃げられなかった！';
    await sleep(500);
  }

  renderStatus();
  if (await checkVictory()) return;
  await enemyTurn();

  if (!battleEnded) {
    message.textContent = 'コマンドを選んでください。';
    setButtons(true);
  }
  busy = false;
}

buttons.forEach((button) => {
  button.addEventListener('click', () => execute(button.dataset.command));
});

renderStatus();
setButtons(true);
startIdle();
