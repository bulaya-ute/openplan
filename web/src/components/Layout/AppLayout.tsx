import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useTasksStore } from '../../store/tasks';
import Sidebar from './Sidebar';
import TaskDetailModal from '../Task/TaskDetailModal';

export default function AppLayout() {
  const { user } = useAuthStore();
  const { modalTaskId, closeTaskModal } = useTasksStore();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {modalTaskId && (
        <TaskDetailModal taskId={modalTaskId} onClose={closeTaskModal} />
      )}
    </div>
  );
}
