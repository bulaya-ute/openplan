import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Pencil, StepForward, Plus } from 'lucide-react';
import type { Task, Priority } from '../../types';
import { useTasksStore } from '../../store/tasks';
import ProgressRing from './ProgressRing';
import AddTaskForm from './AddTaskForm';

const PRIORITY_COLOR: Record<Priority, string> = {
  P1: 'text-red-500',
  P2: 'text-orange-400',
  P3: 'text-blue-500',
  P4: 'text-transparent',
};

const STATUS_STYLE: Record<string, string> = {
  Scheduled: 'text-gray-400',
  Active: '',
  Completed: 'line-through text-gray-400',
  Cancelled: 'line-through text-gray-300',
};

interface Props {
  task: Task;
  depth?: number;
}

export default function TaskRow({ task, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const { tick, deleteTask } = useTasksStore();

  const hasChildren = task.children.length > 0;
  const isComplete = task.status === 'Completed' || task.status === 'Cancelled';
  const isSequential = task.taskType === 'Sequential';

  const handleTick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isComplete) return;
    tick(task.id);
  };

  return (
    <div>
      <div
        className={`group flex items-start gap-2 py-1.5 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
          task.status === 'Active' ? 'border-l-2 border-indigo-400 pl-2' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`mt-0.5 text-gray-400 flex-shrink-0 ${hasChildren ? 'visible' : 'invisible'}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Checkbox / step icon */}
        <button
          onClick={handleTick}
          title={isSequential && hasChildren ? 'Mark next step complete' : 'Mark complete'}
          className={`mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded border transition-colors ${
            isComplete
              ? 'bg-indigo-500 border-indigo-500 text-white'
              : isSequential && hasChildren
              ? 'border-indigo-400 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950'
              : 'border-gray-300 hover:border-indigo-400 dark:border-gray-600'
          }`}
        >
          {isComplete ? (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2}>
              <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : isSequential && hasChildren ? (
            <StepForward size={10} />
          ) : null}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Progress ring (only when has children) */}
            {hasChildren && !isComplete && (
              <ProgressRing progress={task.progress} size={18} />
            )}

            <span className={`text-sm truncate ${STATUS_STYLE[task.status]}`}>
              {task.title}
            </span>

            {/* Priority badge */}
            {task.effectivePriority !== 'P4' && (
              <span className={`text-xs font-semibold flex-shrink-0 ${PRIORITY_COLOR[task.effectivePriority as Priority]}`}>
                {task.effectivePriority}
              </span>
            )}
          </div>

          {/* Sequential "Next:" subtitle */}
          {isSequential && task.nextChildTitle && !isComplete && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              Next: {task.nextChildTitle}
            </p>
          )}

          {/* Progress bar + fraction */}
          {hasChildren && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-0.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {task.completedChildCount}/{task.totalChildCount}
              </span>
            </div>
          )}
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          <button
            onClick={() => setAddingChild(true)}
            title="Add sub-task"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            title="Delete"
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {task.children.map((child) => (
            <TaskRow key={child.id} task={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Add sub-task form */}
      {addingChild && (
        <AddTaskForm
          parentId={task.id}
          projectId={task.projectId ?? undefined}
          depth={depth + 1}
          onClose={() => setAddingChild(false)}
        />
      )}
    </div>
  );
}
