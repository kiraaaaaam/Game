import type { GameStatus } from "../game";

type GameOverlayProps = {
  status: GameStatus;
  onAction: () => void;
};

export function GameOverlay({ status, onAction }: GameOverlayProps) {
  if (status === "playing") return null;

  const won = status === "won";
  return (
    <div className="overlay">
      <div>
        <h2>{won ? "Вы победили!" : "Ходов больше нет"}</h2>
        <p>
          {won
            ? "Вы собрали 2048. Можно продолжить играть."
            : "Начните новую партию и попробуйте ещё раз."}
        </p>
        <button type="button" onClick={onAction}>
          {won ? "Продолжить" : "Сыграть ещё"}
        </button>
      </div>
    </div>
  );
}
