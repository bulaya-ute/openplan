import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
