import { useEffect, useState } from 'react';
import { useTasksStore } from '../store/tasks';
import TaskRow from '../components/Task/TaskRow';
import AddTaskForm from '../components/Task/AddTaskForm';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';

export default function Upcoming() {
  const { tasks, loading, fetchTasks } = useTasksStore();
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchTasks('upcoming'); }, []);

  // Group tasks by due date (yyyy-MM-dd key keeps them sorted)
  const groups: { date: string; label: string; tasks: typeof tasks }[] = [];
  const seen: Record<string, number> = {};

  for (const task of tasks) {
    let dateKey: string;
    try {
      dateKey = format(parseISO(task.dueAt), 'yyyy-MM-dd');
    } catch {
      dateKey = 'unknown';
    }

    if (seen[dateKey] === undefined) {
      seen[dateKey] = groups.length;
      const label = dateKey === 'unknown'
        ? 'Unknown date'
        : format(parseISO(dateKey), 'EEEE, MMMM d, yyyy');
      groups.push({ date: dateKey, label, tasks: [] });
    }
    groups[seen[dateKey]].tasks.push(task);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Upcoming</h1>

      {groups.length === 0 && (
        <p className="text-sm text-gray-400 py-4">No upcoming tasks.</p>
      )}

      {groups.map(({ date, label, tasks: dayTasks }) => (
        <div key={date} className="mb-7">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {label}
          </h2>
          <div className="space-y-0.5">
            {dayTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}

      {adding ? (
        <AddTaskForm onClose={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={15} /> Add task
        </button>
      )}
    </div>
  );
}
