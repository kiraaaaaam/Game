import { gameSchema } from "./game.js";

const STORAGE_KEY = "simple-2048-save-v2";

export function loadGame() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Не удалось прочитать сохранение игры.", error);
    return null;
  }

  if (!saved) return null;

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }

  const result = gameSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function saveGame(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Не удалось сохранить партию.", error);
  }
}
