import { useEffect } from 'react';
import { useTasksStore } from '../store/tasks';
import TaskList from '../components/Task/TaskList';

export default function Upcoming() {
  const { tasks, loading, fetchTasks } = useTasksStore();

  useEffect(() => { fetchTasks('upcoming'); }, []);

  return <TaskList tasks={tasks} loading={loading} title="Upcoming" />;
}
