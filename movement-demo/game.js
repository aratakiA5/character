const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const positionLabel = document.getElementById('position');
const resetButton = document.getElementById('reset');

const keys = new Set();

const world = {
  gravity: 1800,
  floorY: 470,
};

const player = {
  x: 120,
  y: 300,
  width: 48,
  height: 72,
  vx: 0,
  vy: 0,
  speed: 360,
  jumpPower: 720,
  grounded: false,
  facing: 1,
};

function resetPlayer() {
  player.x = 120;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
}

function isDown(...codes) {
  return codes.some((code) => keys.has(code));
}

function tryJump() {
  if (!player.grounded) return;
  player.vy = -player.jumpPower;
  player.grounded = false;
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) {
    event.preventDefault();
  }

  const wasDown = keys.has(event.code);
  keys.add(event.code);

  if (!wasDown && ['Space', 'KeyW', 'ArrowUp'].includes(event.code)) {
    tryJump();
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

resetButton.addEventListener('click', resetPlayer);

function update(dt) {
  let direction = 0;
  if (isDown('ArrowLeft', 'KeyA')) direction -= 1;
  if (isDown('ArrowRight', 'KeyD')) direction += 1;

  player.vx = direction * player.speed;
  if (direction !== 0) player.facing = direction;

  player.vy += world.gravity * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }

  const floorTop = world.floorY - player.height;
  if (player.y >= floorTop) {
    player.y = floorTop;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  positionLabel.textContent = `X: ${Math.round(player.x)} / Y: ${Math.round(player.y)} / ${player.grounded ? 'GROUND' : 'AIR'}`;
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#172554');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, world.floorY, canvas.width, canvas.height - world.floorY);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, world.floorY);
  ctx.lineTo(canvas.width, world.floorY);
  ctx.stroke();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  ctx.save();
  ctx.translate(x + player.width / 2, y);
  ctx.scale(player.facing, 1);
  ctx.translate(-player.width / 2, 0);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(8, 24, 32, 38);

  ctx.fillStyle = '#f2c9a5';
  ctx.beginPath();
  ctx.arc(24, 15, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(4, 28, 8, 32);
  ctx.fillRect(36, 28, 8, 32);

  ctx.fillStyle = '#334155';
  ctx.fillRect(10, 60, 10, 12);
  ctx.fillRect(28, 60, 10, 12);

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(29, 13, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function draw() {
  drawBackground();
  drawPlayer();
}

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

resetPlayer();
requestAnimationFrame(loop);
