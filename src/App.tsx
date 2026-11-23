import { useEffect, useReducer } from "react";
import {
  createGame,
  reduceGame,
  type Direction,
  type GameAction,
  type GameState,
} from "./game";
import { loadGame, saveGame } from "./storage";
import { GameHeader } from "./components/GameHeader";
import { Board } from "./components/Board";
import { GameOverlay } from "./components/GameOverlay";
import { TaskPanel } from "./components/TaskPanel";

export function App() {
  const gameReducer = (state: GameState, action: GameAction) =>
    reduceGame(state, action);
  const [state, dispatch] = useReducer(gameReducer, loadGame() ?? createGame());

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      const directions: Partial<Record<string, Direction>> = {
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

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleOverlayAction() {
    dispatch({ type: state.status === "won" ? "continue" : "new-game" });
  }

  return (
    <main className="page">
      <header className="page__intro">
        <h1>2048</h1>
        <p className="page__description">
          Соединяйте одинаковые числа, чтобы получить плитку 2048.
        </p>
      </header>

      <section className="game" aria-label="Игра 2048">
        <GameHeader
          score={state.score}
          bestScore={state.bestScore}
          onNewGame={() => dispatch({ type: "new-game" })}
        />
        <div className="board-wrap">
          <Board board={state.board} />
          <GameOverlay status={state.status} onAction={handleOverlayAction} />
        </div>
        <p className="help">Управление: стрелки на клавиатуре.</p>
      </section>

      <TaskPanel
        tasks={state.tasks}
        draft={state.taskDraft}
        onDraftChange={(value) => dispatch({ type: "set-draft", value })}
        onAdd={() => dispatch({ type: "add-task", id: crypto.randomUUID() })}
        onRemove={(id) => dispatch({ type: "remove-task", id })}
      />

      <footer className="page__footer">
        <p>Партия и цели сохраняются автоматически в этом браузере.</p>
      </footer>
    </main>
  );
}
