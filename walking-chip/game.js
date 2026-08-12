const stage = document.getElementById('stage');
const player = document.getElementById('player');
const flag = document.getElementById('flag');

const FRAME_SIZE = 32;
const FRAME_COUNT = 3;
const SPEED = 150;
const FRAME_TIME = 0.14;
const ARRIVAL_DISTANCE = 3;

const directionRow = { down: 0, left: 1, right: 2, up: 3 };
const keys = new Set();
const state = {
  x: 416,
  y: 248,
  direction: 'down',
  frame: 1,
  frameTimer: 0,
  target: null,
};

stage.addEventListener('click', (event) => {
  const rect = stage.getBoundingClientRect();
  const half = FRAME_SIZE / 2;
  const x = Math.max(half, Math.min(stage.clientWidth - half, event.clientX - rect.left));
  const y = Math.max(half, Math.min(stage.clientHeight - half, event.clientY - rect.top));

  state.target = { x, y };
  flag.style.display = 'block';
  flag.style.left = `${x}px`;
  flag.style.top = `${y}px`;
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    keys.add(key);
    state.target = null;
    flag.style.display = 'none';
  }
});

window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function getKeyboardVector() {
  let x = 0;
  let y = 0;
  if (keys.has('arrowleft') || keys.has('a')) x -= 1;
  if (keys.has('arrowright') || keys.has('d')) x += 1;
  if (keys.has('arrowup') || keys.has('w')) y -= 1;
  if (keys.has('arrowdown') || keys.has('s')) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.sqrt(2);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

function getMoveVector(dt) {
  const keyboard = getKeyboardVector();
  if (keyboard.x !== 0 || keyboard.y !== 0) return keyboard;
  if (!state.target) return { x: 0, y: 0 };

  const dx = state.target.x - state.x;
  const dy = state.target.y - state.y;
  const distance = Math.hypot(dx, dy);
  const step = SPEED * dt;

  if (distance <= Math.max(ARRIVAL_DISTANCE, step)) {
    state.x = state.target.x;
    state.y = state.target.y;
    state.target = null;
    flag.style.display = 'none';
    return { x: 0, y: 0 };
  }

  return { x: dx / distance, y: dy / distance };
}

function updateDirection(move) {
  if (Math.abs(move.x) > Math.abs(move.y)) {
    state.direction = move.x < 0 ? 'left' : 'right';
  } else if (move.y !== 0) {
    state.direction = move.y < 0 ? 'up' : 'down';
  }
}

function update(dt) {
  const move = getMoveVector(dt);
  const moving = move.x !== 0 || move.y !== 0;

  if (moving) {
    updateDirection(move);
    state.x += move.x * SPEED * dt;
    state.y += move.y * SPEED * dt;
    state.frameTimer += dt;
    if (state.frameTimer >= FRAME_TIME) {
      state.frameTimer -= FRAME_TIME;
      state.frame = (state.frame + 1) % FRAME_COUNT;
    }
  } else {
    state.frame = 1;
    state.frameTimer = 0;
  }

  const half = FRAME_SIZE / 2;
  state.x = Math.max(half, Math.min(stage.clientWidth - half, state.x));
  state.y = Math.max(half, Math.min(stage.clientHeight - half, state.y));
}

function render() {
  player.style.left = `${state.x - FRAME_SIZE / 2}px`;
  player.style.top = `${state.y - FRAME_SIZE / 2}px`;
  player.style.backgroundPosition = `${-(state.frame * FRAME_SIZE)}px ${-(directionRow[state.direction] * FRAME_SIZE)}px`;
}

let previous = performance.now();
function loop(now) {
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

render();
requestAnimationFrame(loop);
