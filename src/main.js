import { createGame, reduceGame } from "./game.js";
import { loadGame, saveGame } from "./storage.js";

const boardElement = document.querySelector("[data-board]");
const scoreElement = document.querySelector("[data-score]");
const bestElement = document.querySelector("[data-best]");
const overlayElement = document.querySelector("[data-overlay]");
const taskInput = document.querySelector("[data-task-input]");
const taskList = document.querySelector("[data-task-list]");

const cells = Array.from(boardElement.querySelectorAll(".cell"));

let state = loadGame() ?? createGame();
let renderScheduled = false;

function render() {
  cells.forEach((cell, index) => {
    const value = state.board[Math.floor(index / 4)][index % 4];
    cell.textContent = value || "";
    cell.dataset.value = value;
    cell.classList.toggle("large", value >= 1024);
  });

  scoreElement.value = state.score;
  bestElement.value = state.bestScore;
  if (taskInput.value !== state.taskDraft) taskInput.value = state.taskDraft;

  const messages = {
    won: [
      "Вы победили!",
      "Вы собрали 2048. Можно продолжить играть.",
      "Продолжить",
    ],
    lost: [
      "Ходов больше нет",
      "Начните новую партию и попробуйте ещё раз.",
      "Сыграть ещё",
    ],
  };

  if (state.status === "playing") {
    overlayElement.hidden = true;
  } else {
    const [title, message, action] = messages[state.status];
    document.querySelector("[data-title]").textContent = title;
    document.querySelector("[data-message]").textContent = message;
    document.querySelector("[data-action]").textContent = action;
    overlayElement.hidden = false;
  }

  const taskItems = state.tasks.map((task) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    const removeButton = document.createElement("button");
    text.textContent = task.text;
    removeButton.type = "button";
    removeButton.dataset.removeTask = task.id;
    removeButton.setAttribute("aria-label", `Удалить цель: ${task.text}`);
    removeButton.textContent = "Удалить";
    item.append(text, removeButton);
    return item;
  });
  taskList.replaceChildren(...taskItems);
}

function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    render();
  });
}

function dispatch(action) {
  state = reduceGame(state, action);
  saveGame(state);
  scheduleRender();
}

function handleKey(event) {
  if (event.target instanceof HTMLInputElement) return;

  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const direction = directions[event.key];
  if (!direction) return;

  event.preventDefault();
  dispatch({ type: "move", direction });
}

function handleInput(event) {
  dispatch({ type: "set-draft", value: event.target.value });
}

function handleSubmit(event) {
  event.preventDefault();
  dispatch({ type: "add-task", id: crypto.randomUUID() });
}

function handleClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button");
  if (!button) return;

  if (button.hasAttribute("data-new")) {
    dispatch({ type: "new-game" });
  } else if (button.hasAttribute("data-action")) {
    dispatch({ type: state.status === "won" ? "continue" : "new-game" });
  } else if (button.hasAttribute("data-remove-task")) {
    dispatch({ type: "remove-task", id: button.dataset.removeTask });
  }
}

document.addEventListener("keydown", handleKey);
document.addEventListener("input", (event) => {
  if (event.target === taskInput) handleInput(event);
});
document.addEventListener("submit", (event) => {
  if (event.target.matches("[data-task-form]")) handleSubmit(event);
});
document.addEventListener("click", handleClick);

render();
saveGame(state);
