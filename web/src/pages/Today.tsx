import { useEffect } from 'react';
import { useTasksStore } from '../store/tasks';
import TaskList from '../components/Task/TaskList';
import { format } from 'date-fns';

export default function Today() {
  const { tasks, loading, fetchTasks } = useTasksStore();

  useEffect(() => { fetchTasks('today'); }, []);

  return (
    <TaskList
      tasks={tasks}
      loading={loading}
      title={`Today · ${format(new Date(), 'EEE, MMM d')}`}
    />
  );
}
