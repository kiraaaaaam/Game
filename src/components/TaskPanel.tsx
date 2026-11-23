import type { FormEvent } from "react";
import type { Task } from "../game";

type TaskPanelProps = {
  tasks: Task[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

export function TaskPanel({
  tasks,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: TaskPanelProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd();
  }

  return (
    <section className="task-panel" aria-labelledby="tasks-title">
      <h2 id="tasks-title">Мои цели</h2>
      <form onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="task-input">
          Новая цель
        </label>
        <input
          id="task-input"
          name="task"
          type="text"
          maxLength={80}
          placeholder="Например, собрать плитку 128"
          autoComplete="off"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        <button type="submit">Добавить</button>
      </form>
      <ul className="task-list" aria-live="polite">
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.text}</span>
            <button
              type="button"
              aria-label={`Удалить цель: ${task.text}`}
              onClick={() => onRemove(task.id)}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
