import type { Task } from '../../types';
import TaskRow from './TaskRow';
import AddTaskForm from './AddTaskForm';
import { useState } from 'react';
import { Plus } from 'lucide-react';

interface Props {
  tasks: Task[];
  loading?: boolean;
  title: string;
  projectId?: string;
}

export default function TaskList({ tasks, loading, title, projectId }: Props) {
  const [adding, setAdding] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>

      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 py-4">No tasks here.</p>
        )}
      </div>

      {adding ? (
        <div className="mt-2">
          <AddTaskForm projectId={projectId} onClose={() => setAdding(false)} />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={15} /> Add task
        </button>
      )}
    </div>
  );
}
