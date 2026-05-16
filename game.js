const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const speedEl = document.querySelector("#speed");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");

const tileCount = 24;
const tileSize = canvas.width / tileCount;
const initialSnake = [
  { x: 11, y: 12 },
  { x: 10, y: 12 },
  { x: 9, y: 12 },
];

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem("snakeBestScore")) || 0;
let gameTimer;
let gameState = "ready";
let moveDelay = 150;

const keys = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

function resetGame() {
  snake = initialSnake.map((part) => ({ ...part }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  moveDelay = 150;
  food = createFood();
  gameState = "ready";
  updateHud();
  showOverlay("贪吃蛇", "按方向键或 WASD 开始", "开始游戏");
  draw();
}

function startGame() {
  if (gameState === "playing") {
    return;
  }

  gameState = "playing";
  overlay.classList.add("is-hidden");
  scheduleNextMove();
}

function pauseGame() {
  if (gameState === "playing") {
    gameState = "paused";
    clearTimeout(gameTimer);
    showOverlay("已暂停", "按空格或点击按钮继续", "继续");
    pauseButton.textContent = "继续";
    return;
  }

  if (gameState === "paused") {
    pauseButton.textContent = "暂停";
    startGame();
  }
}

function restartGame() {
  clearTimeout(gameTimer);
  resetGame();
  startGame();
}

function scheduleNextMove() {
  clearTimeout(gameTimer);
  gameTimer = setTimeout(() => {
    moveSnake();
    if (gameState === "playing") {
      scheduleNextMove();
    }
  }, moveDelay);
}

function moveSnake() {
  direction = nextDirection;
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  if (hitWall(nextHead) || hitSnake(nextHead)) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += 10;
    moveDelay = Math.max(70, moveDelay - 4);
    food = createFood();
  } else {
    snake.pop();
  }

  updateHud();
  draw();
}

function createFood() {
  let position;

  do {
    position = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((part) => part.x === position.x && part.y === position.y));

  return position;
}

function hitWall(position) {
  return position.x < 0 || position.x >= tileCount || position.y < 0 || position.y >= tileCount;
}

function hitSnake(position) {
  return snake.some((part) => part.x === position.x && part.y === position.y);
}

function endGame() {
  clearTimeout(gameTimer);
  gameState = "ended";
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("snakeBestScore", String(bestScore));
  updateHud();
  showOverlay("游戏结束", `本局得分 ${score}`, "再来一局");
  pauseButton.textContent = "暂停";
}

function showOverlay(title, message, buttonText) {
  overlay.querySelector("h1").textContent = title;
  overlay.querySelector("p").textContent = message;
  startButton.textContent = buttonText;
  overlay.classList.remove("is-hidden");
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  speedEl.textContent = `${Math.round(150 / moveDelay * 10) / 10}x`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--grid");
  ctx.lineWidth = 1;

  for (let i = 1; i < tileCount; i += 1) {
    const pos = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawFood() {
  const centerX = food.x * tileSize + tileSize / 2;
  const centerY = food.y * tileSize + tileSize / 2;

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--food");
  ctx.beginPath();
  ctx.arc(centerX, centerY, tileSize * 0.34, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  snake.forEach((part, index) => {
    const inset = index === 0 ? 2 : 3;
    ctx.fillStyle = index === 0
      ? getComputedStyle(document.documentElement).getPropertyValue("--snake-head")
      : getComputedStyle(document.documentElement).getPropertyValue("--snake");
    ctx.fillRect(
      part.x * tileSize + inset,
      part.y * tileSize + inset,
      tileSize - inset * 2,
      tileSize - inset * 2
    );
  });
}

function setDirection(newDirection) {
  const reversing = newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;

  if (!reversing) {
    nextDirection = newDirection;
  }
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    pauseGame();
    return;
  }

  const newDirection = keys[event.code] || keys[event.key];

  if (newDirection) {
    event.preventDefault();
    setDirection(newDirection);
    if (gameState === "ready") {
      startGame();
    }
  }
});

startButton.addEventListener("click", () => {
  if (gameState === "ended") {
    resetGame();
  }
  startGame();
});

pauseButton.addEventListener("click", pauseGame);
restartButton.addEventListener("click", restartGame);

resetGame();
