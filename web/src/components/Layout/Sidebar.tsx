import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useTasksStore } from '../../store/tasks';
import { CalendarDays, Inbox, CalendarRange, LogOut, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createProject } from '../../api/projects';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects } = useTasksStore();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createProject(newName.trim(), '#6366f1');
    await fetchProjects();
    setNewName('');
    setAdding(false);
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-4 gap-1">
      <div className="px-2 mb-3">
        <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">OpenPlan</span>
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
      </div>

      <NavLink to="/today" className={navClass}>
        <CalendarDays size={16} /> Today
      </NavLink>
      <NavLink to="/upcoming" className={navClass}>
        <CalendarRange size={16} /> Upcoming
      </NavLink>
      <NavLink to="/inbox" className={navClass}>
        <Inbox size={16} /> Inbox
      </NavLink>

      <div className="mt-4 mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</span>
        <button onClick={() => setAdding(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Plus size={14} />
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAddProject} className="px-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => { setAdding(false); setNewName(''); }}
            placeholder="Project name"
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>
      )}

      {projects.filter((p) => !p.isArchived).map((p) => (
        <NavLink key={p.id} to={`/project/${p.id}`} className={navClass}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="truncate">{p.name}</span>
        </NavLink>
      ))}

      <div className="mt-auto">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 px-3 py-1.5 w-full rounded-md text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
