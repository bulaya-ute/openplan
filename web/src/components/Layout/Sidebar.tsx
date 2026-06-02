import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useTasksStore } from '../../store/tasks';
import { useThemeStore, type Theme } from '../../store/theme';
import { CalendarDays, Inbox, CalendarRange, LogOut, Plus, Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createProject } from '../../api/projects';
import Logo from '../Logo';

const THEME_OPTIONS: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects } = useTasksStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60'
    }`;

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createProject(newName.trim(), '#3b82f6');
    await fetchProjects();
    setNewName('');
    setAdding(false);
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-4 gap-0.5">
      {/* Logo / user */}
      <div className="px-2 mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Logo size={28} />
          <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">OpenPlan</span>
        </div>
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

      {/* Projects */}
      <div className="mt-5 mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</span>
        <button
          onClick={() => setAdding(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAddProject} className="px-2 mb-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => { setAdding(false); setNewName(''); }}
            placeholder="Project name"
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </form>
      )}

      {projects.filter((p) => !p.isArchived).map((p) => (
        <NavLink key={p.id} to={`/project/${p.id}`} className={navClass}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="truncate">{p.name}</span>
        </NavLink>
      ))}

      {/* Bottom actions */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {/* Theme switcher */}
        <div className="px-2 py-1 flex items-center gap-1">
          <span className="text-xs text-gray-400 flex-1">Theme</span>
          <div className="flex items-center gap-0.5">
            {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={label}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === value
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}
