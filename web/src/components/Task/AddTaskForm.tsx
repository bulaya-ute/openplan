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
  const [dueAt, setDueAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const now = new Date();
      const start = new Date(now);
      start.setHours(9, 0, 0, 0);
      const due = new Date(dueAt);

      await createTask({
        title: title.trim(),
        parentId,
        projectId,
        taskType,
        weight: 1,
        priority,
        startAt: start.toISOString(),
        dueAt: due.toISOString(),
        sortOrder: 0,
      });
      onClose();
    } catch {
      setError('Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 px-3 py-2 mx-2 mb-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-md"
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
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
        >
          <option value="Parallel">Parallel</option>
          <option value="Sequential">Sequential</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
        >
          <option value="P4">No priority</option>
          <option value="P3">P3 — Medium</option>
          <option value="P2">P2 — High</option>
          <option value="P1">P1 — Urgent</option>
        </select>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium disabled:opacity-50">
          Add task
        </button>
        <button type="button" onClick={onClose}
          className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          Cancel
        </button>
      </div>
    </form>
  );
}
