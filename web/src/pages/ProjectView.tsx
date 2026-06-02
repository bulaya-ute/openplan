import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTasksStore } from '../store/tasks';
import TaskList from '../components/Task/TaskList';

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const { tasks, loading, projects, fetchTasks } = useTasksStore();

  useEffect(() => {
    if (id) fetchTasks('project', id);
  }, [id]);

  const project = projects.find((p) => p.id === id);

  return (
    <TaskList
      tasks={tasks}
      loading={loading}
      title={project?.name ?? 'Project'}
      projectId={id}
    />
  );
}
