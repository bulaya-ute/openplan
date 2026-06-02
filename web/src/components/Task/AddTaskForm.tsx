import { useState } from 'react';
import { useTasksStore } from '../../store/tasks';
import type { TaskType, Priority } from '../../types';
import { format } from 'date-fns';

interface Props {
  parentId?: string;
  projectId?: string;
  depth?: number;
  onClose: () => void;
}

export default function AddTaskForm({ parentId, projectId, depth = 0, onClose }: Props) {
  const { createTask } = useTasksStore();
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Parallel');
  const [priority, setPriority] = useState<Priority>('P4');
  const [startAt, setStartAt] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await createTask({
        title: title.trim(),
        parentId,
        projectId,
        taskType,
        weight: 1,
        priority,
        startAt: new Date(startAt).toISOString(),
        dueAt: new Date(dueAt).toISOString(),
        sortOrder: 0,
      });
      onClose();
    } catch {
      setError('Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 px-3 py-3 mx-2 mb-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50"
      style={{ marginLeft: `${depth * 20 + 8}px` }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900 dark:text-white"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as TaskType)}
          className={fieldClass}
        >
          <option value="Parallel">Parallel</option>
          <option value="Sequential">Sequential</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className={fieldClass}
        >
          <option value="P4">No priority</option>
          <option value="P3">P3 — Medium</option>
          <option value="P2">P2 — High</option>
          <option value="P1">P1 — Urgent</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Start</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Due</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? 'Adding…' : 'Add task'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
