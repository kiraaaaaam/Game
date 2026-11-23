type GameHeaderProps = {
  score: number;
  bestScore: number;
  onNewGame: () => void;
};

export function GameHeader({ score, bestScore, onNewGame }: GameHeaderProps) {
  return (
    <header className="top">
      <p>Соберите плитку 2048</p>
      <div className="scores">
        <label>
          Очки <output>{score}</output>
        </label>
        <label>
          Рекорд <output>{bestScore}</output>
        </label>
      </div>
      <button type="button" onClick={onNewGame}>
        Новая игра
      </button>
    </header>
  );
}
