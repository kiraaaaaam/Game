import type { Board as BoardData } from "../game";

export function Board({ board }: { board: BoardData }) {
  return (
    <div className="board" role="grid" aria-label="Игровое поле 4 на 4">
      {board.flatMap((row, rowIndex) =>
        row.map((value, columnIndex) => (
          <div
            key={`${rowIndex}-${columnIndex}`}
            className={value >= 1024 ? "cell large" : "cell"}
            role="gridcell"
            data-value={value}
          >
            {value || ""}
          </div>
        )),
      )}
    </div>
  );
}
