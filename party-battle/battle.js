const partyEl = document.getElementById('party');
const statusEl = document.getElementById('status');
const commandsEl = document.getElementById('commands');
const messageEl = document.getElementById('message');
const enemyEl = document.getElementById('enemy');
const damagePop = document.getElementById('damage-pop');
const battlefield = document.querySelector('.battlefield');

const DEFAULT_FRAME_W = 72;
const DEFAULT_FRAME_H = 96;
const STATE_ROW = { idle: 0, attack: 1, hit: 2, victory: 3 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const party = [
  { name: 'アルト', job: '剣士', hp: 120, maxHp: 120, mp: 28, maxMp: 28, charRow: 0, power: 23, magic: 12, commands: ['attack', 'defend'], frameCount: 4 },
  { name: 'レナ', job: '女戦士', hp: 145, maxHp: 145, mp: 10, maxMp: 10, charRow: 1, power: 29, magic: 5, commands: ['attack', 'power', 'defend'], spriteType: 'warrior', frameW: 48, frameH: 48, frameCount: 3 },
  { name: 'ミリア', job: '女魔法使い', hp: 84, maxHp: 84, mp: 52, maxMp: 52, charRow: 2, power: 10, magic: 31, commands: ['attack', 'fire', 'defend'], frameCount: 4 },
  { name: 'セラ', job: '女僧侶', hp: 98, maxHp: 98, mp: 46, maxMp: 46, charRow: 3, power: 12, magic: 27, commands: ['attack', 'heal', 'defend'], frameCount: 4 },
];

const enemy = { name: '森の魔獣', hp: 330, maxHp: 330, power: 22 };
let currentIndex = 0;
let busy = false;
let battleEnded = false;

function livingParty() {
  return party.filter((member) => member.hp > 0);
}

function createParty() {
  partyEl.innerHTML = '';
  party.forEach((member, index) => {
    const el = document.createElement('div');
    el.className = `party-member member-${index}${member.spriteType === 'warrior' ? ' warrior-sprite' : ''}`;
    el.dataset.index = index;
    member.el = el;
    partyEl.appendChild(el);
  });
}

function setSprite(member, state = 'idle', frame = 0) {
  if (member.spriteType === 'warrior') {
    const frameW = member.frameW;
    const frameH = member.frameH;
    const safeFrame = frame % member.frameCount;
    const row = STATE_ROW[state];
    member.el.style.backgroundPosition = `${-(safeFrame * frameW)}px ${-(row * frameH)}px`;
    return;
  }

  const safeFrame = frame % member.frameCount;
  const row = member.charRow * 4 + STATE_ROW[state];
  member.el.style.backgroundPosition = `${-(safeFrame * DEFAULT_FRAME_W)}px ${-(row * DEFAULT_FRAME_H)}px`;
}

function renderStatus() {
  statusEl.innerHTML = party.map((member, index) => `
    <div class="status-row ${index === currentIndex && !battleEnded ? 'current' : ''} ${member.hp <= 0 ? 'down' : ''}">
      <strong>${member.name}</strong>
      <span class="job">${member.job}</span>
      <span>HP ${Math.max(0, member.hp)}/${member.maxHp}</span>
      <span>MP ${Math.max(0, member.mp)}/${member.maxMp}</span>
    </div>`).join('') + `
    <div class="enemy-status"><div class="enemy-status-row"><strong>${enemy.name}</strong><span>HP ${Math.max(0, enemy.hp)}/${enemy.maxHp}</span></div></div>`;

  party.forEach((member, index) => {
    if (!member.el) return;
    member.el.classList.toggle('active', index === currentIndex && member.hp > 0 && !battleEnded);
    member.el.classList.toggle('down', member.hp <= 0);
  });
}

const labels = {
  attack: 'こうげき',
  power: '強撃',
  fire: 'ファイア',
  heal: 'ヒール',
  defend: 'ぼうぎょ',
};

function renderCommands() {
  const actor = party[currentIndex];
  commandsEl.innerHTML = '';
  if (!actor || actor.hp <= 0 || battleEnded) return;
  actor.commands.forEach((command) => {
    const button = document.createElement('button');
    button.textContent = labels[command];
    button.dataset.command = command;
    button.disabled = busy;
    button.addEventListener('click', () => executeCommand(command));
    commandsEl.appendChild(button);
  });
}

function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function popDamage(target, amount, heal = false) {
  const rect = target.getBoundingClientRect();
  const field = battlefield.getBoundingClientRect();
  damagePop.textContent = heal ? `+${amount}` : amount;
  damagePop.style.color = heal ? '#9effb0' : '#fff';
  damagePop.style.left = `${rect.left - field.left + rect.width / 2}px`;
  damagePop.style.top = `${rect.top - field.top}px`;
  damagePop.classList.remove('show');
  void damagePop.offsetWidth;
  damagePop.classList.add('show');
  await sleep(470);
}

async function animateMember(member, state, duration = 420) {
  member.el.classList.add(state === 'attack' ? 'attack' : state === 'hit' ? 'hit' : state);
  const count = member.frameCount || 4;
  for (let frame = 0; frame < count; frame++) {
    setSprite(member, state, frame);
    await sleep(duration / count);
  }
  member.el.classList.remove('attack', 'hit');
  if (member.hp > 0) setSprite(member, 'idle', 0);
}

async function attackEnemy(actor, multiplier = 1) {
  const anim = animateMember(actor, 'attack', 360);
  await sleep(170);
  const damage = Math.max(1, Math.round((actor.power + roll(-4, 5)) * multiplier));
  enemy.hp -= damage;
  enemyEl.classList.add('hit');
  messageEl.textContent = `${actor.name}の攻撃！ ${enemy.name}に${damage}のダメージ！`;
  renderStatus();
  await popDamage(enemyEl, damage);
  enemyEl.classList.remove('hit');
  await anim;
}

async function castFire(actor) {
  if (actor.mp < 7) {
    messageEl.textContent = 'MPが足りない！';
    await sleep(650);
    return false;
  }
  actor.mp -= 7;
  messageEl.textContent = `${actor.name}はファイアを唱えた！`;
  await animateMember(actor, 'attack', 320);
  const damage = actor.magic + roll(14, 24);
  enemy.hp -= damage;
  enemyEl.classList.add('hit');
  renderStatus();
  await popDamage(enemyEl, damage);
  enemyEl.classList.remove('hit');
  return true;
}

async function castHeal(actor) {
  if (actor.mp < 6) {
    messageEl.textContent = 'MPが足りない！';
    await sleep(650);
    return false;
  }
  actor.mp -= 6;
  const candidates = livingParty().filter((member) => member.hp < member.maxHp);
  const target = candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || actor;
  const amount = Math.min(target.maxHp - target.hp, actor.magic + roll(18, 28));
  messageEl.textContent = `${actor.name}は${target.name}にヒール！`;
  await animateMember(actor, 'attack', 320);
  target.hp += amount;
  renderStatus();
  await popDamage(target.el, amount, true);
  return true;
}

async function enemyTurn() {
  if (enemy.hp <= 0 || battleEnded) return;
  const candidates = livingParty();
  if (!candidates.length) return;
  await sleep(420);
  const target = candidates[roll(0, candidates.length - 1)];
  const damage = roll(enemy.power - 6, enemy.power + 4);
  target.hp -= damage;
  messageEl.textContent = `${enemy.name}の攻撃！ ${target.name}は${damage}のダメージ！`;
  await animateMember(target, 'hit', 360);
  await popDamage(target.el, damage);
  if (target.hp <= 0) {
    target.hp = 0;
    target.el.classList.add('down');
    messageEl.textContent = `${target.name}は倒れた！`;
    await sleep(450);
  }
  renderStatus();
}

async function checkBattleEnd() {
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    battleEnded = true;
    enemyEl.style.opacity = '0';
    messageEl.textContent = `${enemy.name}を倒した！ PTは勝利した！`;
    renderCommands();
    renderStatus();
    for (const member of livingParty()) {
      member.el.classList.add('victory');
      setSprite(member, 'victory', Math.min(1, (member.frameCount || 4) - 1));
    }
    return true;
  }
  if (!livingParty().length) {
    battleEnded = true;
    messageEl.textContent = 'PTは全滅した……。';
    renderCommands();
    renderStatus();
    return true;
  }
  return false;
}

function nextActor() {
  for (let step = 1; step <= party.length; step++) {
    const index = (currentIndex + step) % party.length;
    if (party[index].hp > 0) {
      currentIndex = index;
      break;
    }
  }
}

async function executeCommand(command) {
  if (busy || battleEnded) return;
  const actor = party[currentIndex];
  if (!actor || actor.hp <= 0) return;
  busy = true;
  renderCommands();

  let consumed = true;
  if (command === 'attack') await attackEnemy(actor);
  if (command === 'power') await attackEnemy(actor, 1.45);
  if (command === 'fire') consumed = await castFire(actor);
  if (command === 'heal') consumed = await castHeal(actor);
  if (command === 'defend') {
    actor.defending = true;
    messageEl.textContent = `${actor.name}は身を守っている。`;
    await sleep(450);
  }

  renderStatus();
  if (!consumed) {
    busy = false;
    renderCommands();
    return;
  }
  if (await checkBattleEnd()) return;

  await enemyTurn();
  if (await checkBattleEnd()) return;

  nextActor();
  messageEl.textContent = `${party[currentIndex].name}の行動を選んでください。`;
  busy = false;
  renderStatus();
  renderCommands();
}

function idleLoop(now) {
  if (!battleEnded) {
    party.forEach((member) => {
      if (member.hp > 0 && !member.el.classList.contains('attack') && !member.el.classList.contains('hit')) {
        const count = member.frameCount || 4;
        const frame = Math.floor(now / 260) % count;
        setSprite(member, 'idle', frame);
      }
    });
  }
  requestAnimationFrame(idleLoop);
}

createParty();
renderStatus();
renderCommands();
requestAnimationFrame(idleLoop);
