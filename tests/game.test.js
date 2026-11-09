import assert from "node:assert/strict";
import test from "node:test";
import {
  createGame,
  gameSchema,
  mergeLine,
  move,
  reduceGame,
} from "../src/game.js";
import { loadGame, saveGame } from "../src/storage.js";

function stateWithBoard(board, overrides = {}) {
  return {
    board,
    score: 0,
    bestScore: 0,
    hasWon: false,
    status: "playing",
    tasks: [],
    taskDraft: "",
    ...overrides,
  };
}

test("a tile can merge only once in one move", () => {
  assert.deepEqual(mergeLine([2, 2, 2, 2]), {
    line: [4, 4, 0, 0],
    points: 8,
  });
  assert.deepEqual(mergeLine([2, 2, 2, 0]), {
    line: [4, 2, 0, 0],
    points: 4,
  });
});

test("a successful move scores merges and adds one tile", () => {
  const state = stateWithBoard([
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const result = move(state, "left", () => 0);

  assert.equal(result.score, 4);
  assert.equal(result.bestScore, 4);
  assert.equal(result.board.flat().filter(Boolean).length, 2);
  assert.equal(result.board[0][0], 4);
});

test("a move that cannot change the board does not produce a new state", () => {
  const state = stateWithBoard(Array.from({ length: 4 }, () => [2, 4, 8, 16]));
  assert.equal(move(state, "left"), null);
});

test("the win tile ends the game once and can be continued", () => {
  const board = [
    [1024, 1024, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const won = move(stateWithBoard(board), "left", () => 0);

  assert.equal(won.status, "won");
  assert.equal(won.hasWon, true);
  assert.equal(reduceGame(won, { type: "continue" }).status, "playing");
});

test("game schema rejects malformed saves and accepts a new game", () => {
  const game = createGame(0, () => 0);
  assert.equal(gameSchema.safeParse(game).success, true);

  game.board[0][0] = 3;
  assert.equal(gameSchema.safeParse(game).success, false);
});

test("corrupted saved data is ignored and valid games can be restored", () => {
  const previousStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  let saved = "{broken";
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => saved,
      setItem: (_key, value) => {
        saved = value;
      },
    },
  });

  try {
    assert.equal(loadGame(), null);
    saved = JSON.stringify({ board: "invalid" });
    assert.equal(loadGame(), null);

    const game = createGame(0, () => 0);
    saveGame(game);
    assert.deepEqual(loadGame(), game);
  } finally {
    if (previousStorage) {
      Object.defineProperty(globalThis, "localStorage", previousStorage);
    } else {
      delete globalThis.localStorage;
    }
  }
});

test("typing a goal survives game actions and goals can be added and removed", () => {
  const typed = reduceGame(createGame(), {
    type: "set-draft",
    value: "  Собрать плитку 128  ",
  });
  const added = reduceGame(typed, { type: "add-task", id: "goal-1" });
  const removed = reduceGame(added, { type: "remove-task", id: "goal-1" });

  assert.equal(added.tasks[0].text, "Собрать плитку 128");
  assert.equal(added.taskDraft, "");
  assert.deepEqual(removed.tasks, []);
});
