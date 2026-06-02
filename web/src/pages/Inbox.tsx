import { useEffect } from 'react';
import { useTasksStore } from '../store/tasks';
import TaskList from '../components/Task/TaskList';

export default function Inbox() {
  const { tasks, loading, fetchTasks } = useTasksStore();

  useEffect(() => { fetchTasks('inbox'); }, []);

  return <TaskList tasks={tasks} loading={loading} title="Inbox" />;
}
