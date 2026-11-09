import { z } from "zod";

export const SIZE = 4;
export const WINNING_TILE = 2048;

const DIRECTIONS = {
  left: [0, 1],
  right: [0, -1],
  up: [1, 0],
  down: [-1, 0],
};

export function mergeLine(line) {
  const tiles = line.filter(Boolean);
  const merged = [];
  let points = 0;

  for (let index = 0; index < tiles.length; index += 1) {
    if (tiles[index] === tiles[index + 1]) {
      const doubled = tiles[index] * 2;
      merged.push(doubled);
      points += doubled;
      index += 1;
    } else {
      merged.push(tiles[index]);
    }
  }

  while (merged.length < SIZE) merged.push(0);
  return { line: merged, points };
}

function addTile(board, random) {
  const empty = [];
  board.forEach((row, rowIndex) =>
    row.forEach((value, columnIndex) => {
      if (value === 0) empty.push([rowIndex, columnIndex]);
    }),
  );

  if (empty.length === 0) return;

  const [row, column] = empty[Math.floor(random() * empty.length)];
  board[row][column] = random() < 0.9 ? 2 : 4;
}

export function createGame(bestScore = 0, random = Math.random) {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  addTile(board, random);
  addTile(board, random);

  return {
    board,
    score: 0,
    bestScore,
    hasWon: false,
    status: "playing",
    tasks: [],
    taskDraft: "",
  };
}

export function hasMoves(board) {
  return board.some((row, rowIndex) =>
    row.some(
      (value, columnIndex) =>
        value === 0 ||
        (columnIndex < SIZE - 1 && value === row[columnIndex + 1]) ||
        (rowIndex < SIZE - 1 && value === board[rowIndex + 1][columnIndex]),
    ),
  );
}

export function move(state, direction, random = Math.random) {
  const step = DIRECTIONS[direction];
  if (!step) throw new Error(`Неизвестное направление: ${direction}`);

  const [rowStep, columnStep] = step;
  const startRow = rowStep === -1 ? SIZE - 1 : 0;
  const startColumn = columnStep === -1 ? SIZE - 1 : 0;
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  let points = 0;

  for (let lane = 0; lane < SIZE; lane += 1) {
    const cells = Array.from({ length: SIZE }, (_, index) => [
      rowStep === 0 ? lane : startRow + index * rowStep,
      columnStep === 0 ? lane : startColumn + index * columnStep,
    ]);
    const result = mergeLine(
      cells.map(([row, column]) => state.board[row][column]),
    );
    points += result.points;
    cells.forEach(([row, column], index) => {
      board[row][column] = result.line[index];
    });
  }

  if (
    board.every((row, rowIndex) =>
      row.every(
        (value, columnIndex) => value === state.board[rowIndex][columnIndex],
      ),
    )
  ) {
    return null;
  }

  addTile(board, random);
  const score = state.score + points;
  const won = board.some((row) => row.some((value) => value >= WINNING_TILE));
  const hasWon = state.hasWon || won;
  const status =
    won && !state.hasWon ? "won" : hasMoves(board) ? "playing" : "lost";

  return {
    ...state,
    board,
    score,
    bestScore: Math.max(state.bestScore, score),
    hasWon,
    status,
  };
}

const tileSchema = z
  .number()
  .int()
  .nonnegative()
  .refine(
    (tile) => tile === 0 || (tile >= 2 && Number.isInteger(Math.log2(tile))),
  );

export const gameSchema = z
  .object({
    board: z.array(z.array(tileSchema).length(SIZE)).length(SIZE),
    score: z.number().int().nonnegative(),
    bestScore: z.number().int().nonnegative(),
    hasWon: z.boolean(),
    status: z.enum(["playing", "won", "lost"]),
    tasks: z.array(
      z.object({
        id: z.string().min(1),
        text: z.string().trim().min(1),
      }),
    ),
    taskDraft: z.string(),
  })
  .refine((state) => state.bestScore >= state.score);

export function reduceGame(state, action, random = Math.random) {
  switch (action.type) {
    case "move":
      return state.status === "playing"
        ? (move(state, action.direction, random) ?? state)
        : state;
    case "new-game":
      return {
        ...createGame(state.bestScore, random),
        tasks: state.tasks,
        taskDraft: state.taskDraft,
      };
    case "continue":
      return state.status === "won" ? { ...state, status: "playing" } : state;
    case "set-draft":
      return { ...state, taskDraft: action.value };
    case "add-task": {
      const text = state.taskDraft.trim();
      if (!text) return state;

      return {
        ...state,
        taskDraft: "",
        tasks: [...state.tasks, { id: action.id, text }],
      };
    }
    case "remove-task":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
      };
    default:
      return state;
  }
}
