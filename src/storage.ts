import { gameSchema, type GameState } from "./game.ts";

const STORAGE_KEY = "simple-2048-save-v2";

export function loadGame(): GameState | null {
  let saved: string | null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Не удалось прочитать сохранение игры.", error);
    return null;
  }

  if (!saved) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    console.warn("Не удалось разобрать сохранение игры.", error);
    return null;
  }

  const result = gameSchema.safeParse(parsed);
  return result.success ? (result.data as GameState) : null;
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Не удалось сохранить партию.", error);
  }
}
