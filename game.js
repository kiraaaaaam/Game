
const SIZE = 4;

const STORAGE_KEY = "simple-2048-save-v1";

const WINNING_TILE = 2048;

const template = document.createElement("template");
template.innerHTML = `
  <link rel="stylesheet" href="./game.css">

  <section class="game" aria-label="Игра 2048">
    <header class="top">
      <p>Соберите плитку 2048</p>

      <div class="scores">
        <label>Очки <output data-score>0</output></label>
        <label>Рекорд <output data-best>0</output></label>
      </div>

      <button data-new>Новая игра</button>
    </header>

    <div class="board-wrap">
      <div class="board" data-board role="grid" aria-label="Игровое поле 4 на 4"></div>

      <div class="overlay" data-overlay hidden>
        <div><h2 data-title></h2><p data-message></p><button data-action></button></div>
      </div>
    </div>

    <p class="help">Управление: только клавиши со стрелками на клавиатуре.</p>

    <p class="sr-only" data-announcer aria-live="polite"></p>
  </section>
`;

function newGame(bestScore = 0) {
  const state = {
    board: Array.from(
      { length: SIZE },
      () => Array(SIZE).fill(0)
    ),
    score: 0,
    bestScore,
    hasWon: false,
    status: "playing"
  };
  addTile(state.board);
  addTile(state.board);
  return state;
}

function addTile(board) {
  const empty = [];

  board.forEach((row, r) => row.forEach((value, c) => {
    if (value === 0) empty.push([r, c]);
  }));

  if (!empty.length) return;

  const [row, column] = empty[Math.floor(Math.random() * empty.length)];

  board[row][column] = Math.random() < 0.9 ? 2 : 4;
}

function mergeLine(line) {
  const tiles = line.filter(Boolean);
  const merged = [];
  let points = 0;

  // За один ход каждая плитка объединяется только один раз.
  for (let i = 0; i < tiles.length; i += 1) {
    if (tiles[i] === tiles[i + 1]) {
      const doubled = tiles[i] * 2;
      merged.push(doubled);
      points += doubled;
      i += 1;
    } else {
      merged.push(tiles[i]);
    }
  }

  while (merged.length < SIZE) merged.push(0);

  return { line: merged, points };
}

function move(state, direction) {
  const step = {
    left: [0, 1], right: [0, -1], up: [1, 0], down: [-1, 0]
  }[direction];

  if (!step) throw new Error(`Неизвестное направление: ${direction}`);

  const [dr, dc] = step;
  const startRow = dr === -1 ? SIZE - 1 : 0;
  const startColumn = dc === -1 ? SIZE - 1 : 0;
  const next = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  let points = 0;

  for (let lane = 0; lane < SIZE; lane += 1) {

    const cells = Array.from({ length: SIZE }, (_, i) => [
      dr === 0 ? lane : startRow + i * dr,
      dc === 0 ? lane : startColumn + i * dc
    ]);

    const result = mergeLine(cells.map(([r, c]) => state.board[r][c]));
    points += result.points;

    cells.forEach(([r, c], i) => { next[r][c] = result.line[i]; });
  }

  if (next.every((row, r) => row.every((value, c) => value === state.board[r][c]))) {
    return false;
  }

  state.board = next;
  state.score += points;
  state.bestScore = Math.max(state.bestScore, state.score);
  addTile(next);

  const won = next.some((row) => row.some((value) => value >= WINNING_TILE));
  if (won && !state.hasWon) {
    state.hasWon = true;
    state.status = "won";
  } else if (!hasMoves(next)) {
    state.status = "lost";
  }
  return true;
}

function hasMoves(board) {
  return board.some((row, r) => row.some((value, c) =>
    value === 0 ||
    (c < SIZE - 1 && value === row[c + 1]) ||
    (r < SIZE - 1 && value === board[r + 1][c])
  ));
}

function isValid(state) {

  if (!state || !Array.isArray(state.board) || state.board.length !== SIZE) return false;

  const validBoard = state.board.every((row) =>
    Array.isArray(row) && row.length === SIZE && row.every((tile) =>
      Number.isSafeInteger(tile) && tile >= 0 &&
      (tile === 0 || (tile >= 2 && Number.isInteger(Math.log2(tile))))
    )
  );

  return validBoard &&
    Number.isSafeInteger(state.score) && state.score >= 0 &&
    Number.isSafeInteger(state.bestScore) && state.bestScore >= 0 &&
    typeof state.hasWon === "boolean" &&
    ["playing", "won", "lost"].includes(state.status);
}

function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const state = JSON.parse(saved);

    if (!isValid(state)) {
      console.warn("Сохранение игры повреждено или имеет неверный формат.");
      return null;
    }
    return state;
  } catch (error) {
    console.warn("Не удалось загрузить сохранение игры.", error);
    return null;
  }
}

function saveGame(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Не удалось сохранить партию.", error);
  }
}

class Game2048 extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(template.content.cloneNode(true));

    this.$ = (selector) => this.shadowRoot.querySelector(selector);
    this.boardElement = this.$("[data-board]");

    this.cells = Array.from({ length: SIZE * SIZE }, () => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      this.boardElement.append(cell);
      return cell;
    });

    this.state = loadGame() || newGame();

    this.onClick = this.onClick.bind(this);
    this.onKey = this.onKey.bind(this);
    this.onOverlayAction = this.onOverlayAction.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this.onClick);

    this.$("[data-action]").addEventListener("click", this.onOverlayAction);

    window.addEventListener("keydown", this.onKey);

    this.render();
    saveGame(this.state);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this.onClick);
    this.$("[data-action]").removeEventListener("click", this.onOverlayAction);
    window.removeEventListener("keydown", this.onKey);
  }

  render() {
    this.cells.forEach((cell, i) => {
      const value = this.state.board[Math.floor(i / SIZE)][i % SIZE];

      cell.textContent = value || "";

      cell.dataset.value = value;

      cell.classList.toggle("large", value >= 1024);
    });

    this.$("[data-score]").value = this.state.score;
    this.$("[data-best]").value = this.state.bestScore;

    const messages = {
      won: ["Вы победили!", "Вы собрали 2048. Можно продолжить играть.", "Продолжить"],
      lost: ["Ходов больше нет", "Начните новую партию и попробуйте ещё раз.", "Сыграть ещё"]
    };
    const overlay = this.$("[data-overlay]");

    if (this.state.status === "playing") {
      overlay.hidden = true;
    } else {
      const [title, message, action] = messages[this.state.status];
      this.$("[data-title]").textContent = title;
      this.$("[data-message]").textContent = message;
      this.$("[data-action]").textContent = action;
      overlay.hidden = false;
    }
  }

  play(direction) {
    if (this.state.status !== "playing" || !move(this.state, direction)) return;

    this.render();
    saveGame(this.state);

    // Объявляем новый счёт экранному диктору.
    this.$("[data-announcer]").textContent = `Очки: ${this.state.score}`;
  }

  onClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.hasAttribute("data-new")) this.startNewGame();
  }

  onKey(event) {
    const directions = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right"
    };
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      this.play(direction);
    }
  }

  onOverlayAction() {
    if (this.state.status === "won") {
      this.state.status = "playing";
      this.render();
      saveGame(this.state);
    } else {
      this.startNewGame();
    }
  }

  startNewGame() {
    this.state = newGame(this.state.bestScore);
    this.render();
    saveGame(this.state);
  }
}

customElements.define("game-2048", Game2048);
