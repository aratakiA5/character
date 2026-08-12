const stage = document.getElementById('stage');
const player = document.getElementById('player');

const FRAME_SIZE = 32;
const FRAME_COUNT = 3;
const SPEED = 150;
const FRAME_TIME = 0.14;

const directionRow = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

const keys = new Set();
const state = {
  x: 416,
  y: 248,
  direction: 'down',
  frame: 1,
  frameTimer: 0,
};

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => keys.clear());

function getMoveVector() {
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

function updateDirection(move) {
  if (Math.abs(move.x) > Math.abs(move.y)) {
    state.direction = move.x < 0 ? 'left' : 'right';
  } else if (move.y !== 0) {
    state.direction = move.y < 0 ? 'up' : 'down';
  }
}

function update(dt) {
  const move = getMoveVector();
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

  const backgroundX = -(state.frame * FRAME_SIZE);
  const backgroundY = -(directionRow[state.direction] * FRAME_SIZE);
  player.style.backgroundPosition = `${backgroundX}px ${backgroundY}px`;
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
