import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, StepForward, Plus, Clock } from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import type { Task, Priority } from '../../types';
import { useTasksStore } from '../../store/tasks';
import AddTaskForm from './AddTaskForm';

const PRIORITY_COLOR: Record<Priority, string> = {
  P1: 'text-red-500',
  P2: 'text-orange-400',
  P3: 'text-blue-500',
  P4: 'text-transparent',
};

const STATUS_STYLE: Record<string, string> = {
  Scheduled: 'text-gray-500 dark:text-gray-400',
  Active: 'text-gray-900 dark:text-white',
  Completed: 'line-through text-gray-400',
  Cancelled: 'line-through text-gray-300',
};

function formatDue(iso: string) {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return `Today · ${format(d, 'HH:mm')}`;
    return format(d, 'MMM d · HH:mm');
  } catch {
    return '';
  }
}

interface Props {
  task: Task;
  depth?: number;
}

export default function TaskRow({ task, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const { tick, deleteTask, openTaskModal } = useTasksStore();

  const isRoot = depth === 0;
  const hasChildren = task.children.length > 0;
  const isComplete = task.status === 'Completed' || task.status === 'Cancelled';
  const isSequential = task.taskType === 'Sequential';
  const isOverdue = !isComplete && isPast(parseISO(task.dueAt));

  const handleTick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isComplete) return;
    tick(task.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingChild(true);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  const row = (
    <div
      className={`group flex items-start gap-2 py-2.5 px-3 transition-colors
        ${isRoot
          ? `hover:bg-gray-50/70 dark:hover:bg-gray-800/30 ${task.status === 'Active' ? 'border-l-2 border-blue-400' : ''}`
          : `hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg ${task.status === 'Active' ? 'border-l-2 border-blue-400' : ''}`
        }
      `}
      style={{ paddingLeft: `${depth * 20 + 12}px` }}
    >
      {/* Expand toggle — only for root-level tasks */}
      {isRoot ? (
        <button
          onClick={handleExpand}
          className={`mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      ) : (
        <span className="w-3.5 flex-shrink-0" />
      )}

      {/* Checkbox / step icon */}
      <button
        onClick={handleTick}
        title={isSequential && hasChildren ? 'Mark next step complete' : 'Mark complete'}
        className={`mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full border transition-colors ${
          isComplete
            ? 'bg-blue-500 border-blue-500 text-white'
            : isSequential && hasChildren
            ? 'border-blue-400 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded'
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'
        }`}
      >
        {isComplete ? (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : isSequential && hasChildren ? (
          <StepForward size={9} />
        ) : null}
      </button>

      {/* Main content — clicking opens modal */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => openTaskModal(task.id)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${STATUS_STYLE[task.status]}`}>
            {task.title}
          </span>

          {/* Priority badge */}
          {task.effectivePriority !== 'P4' && (
            <span className={`text-xs font-bold flex-shrink-0 ${PRIORITY_COLOR[task.effectivePriority as Priority]}`}>
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

        {/* Due date + progress bar row */}
        <div className="flex items-center gap-2 mt-0.5">
          {!isComplete && (
            <span className={`flex items-center gap-1 text-xs flex-shrink-0 ${
              isOverdue ? 'text-red-500' : 'text-gray-400'
            }`}>
              <Clock size={10} />
              {formatDue(task.dueAt)}
            </span>
          )}

          {/* Progress bar (root tasks with children) */}
          {isRoot && hasChildren && (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="flex-1 h-0.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {task.completedChildCount}/{task.totalChildCount}
              </span>
            </div>
          )}

          {/* Subtask count for non-root tasks with children */}
          {!isRoot && hasChildren && (
            <span className="text-xs text-gray-400">
              {task.completedChildCount}/{task.totalChildCount} subtasks
            </span>
          )}
        </div>
      </div>

      {/* Actions (hover) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        {isRoot && (
          <button
            onClick={handleAddChild}
            title="Add sub-task"
            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus size={13} />
          </button>
        )}
        <button
          onClick={handleDelete}
          title="Delete"
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );

  // Root tasks are wrapped in a white card that contains their children
  if (isRoot) {
    return (
      <div className={`mb-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden ${
        task.status === 'Active' ? 'shadow-blue-100 dark:shadow-blue-950' : ''
      }`}>
        {row}

        {/* Children rendered inside the card */}
        {expanded && hasChildren && (
          <div className="border-t border-gray-100 dark:border-gray-800">
            {task.children.map((child) => (
              <TaskRow key={child.id} task={child} depth={depth + 1} />
            ))}
          </div>
        )}

        {/* Add sub-task form inside the card */}
        {addingChild && (
          <div className="border-t border-gray-100 dark:border-gray-800">
            <AddTaskForm
              parentId={task.id}
              projectId={task.projectId ?? undefined}
              depth={depth + 1}
              onClose={() => setAddingChild(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Child tasks are plain rows (no card — they live inside the parent's card)
  return (
    <div>
      {row}
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
