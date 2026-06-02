import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Flag, Layers, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTasksStore, findTaskById } from '../../store/tasks';
import type { ItemStatus, Priority, Task, TaskType } from '../../types';
import ProgressRing from './ProgressRing';

interface Props {
  taskId: string;
  onClose: () => void;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  P1: 'Urgent', P2: 'High', P3: 'Medium', P4: 'None',
};

const PRIORITY_COLOR: Record<Priority, string> = {
  P1: 'text-red-500 bg-red-50 dark:bg-red-950/30',
  P2: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  P3: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  P4: 'text-gray-400 bg-gray-50 dark:bg-gray-800',
};

const STATUS_COLOR: Record<string, string> = {
  Scheduled: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
  Active: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  Completed: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  Cancelled: 'text-gray-400 bg-gray-50 dark:bg-gray-800',
};

function toInputValue(iso: string) {
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

export default function TaskDetailModal({ taskId, onClose }: Props) {
  const { tasks, updateTask, tick } = useTasksStore();
  const [stack, setStack] = useState<string[]>([taskId]);

  const currentId = stack[stack.length - 1];
  const task = findTaskById(tasks, currentId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P4');
  const [taskType, setTaskType] = useState<TaskType>('Parallel');
  const [status, setStatus] = useState<ItemStatus>('Scheduled');
  const [startAt, setStartAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [weight, setWeight] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setTaskType(task.taskType);
    setStatus(task.status);
    setStartAt(toInputValue(task.startAt));
    setDueAt(toInputValue(task.dueAt));
    setWeight(task.weight);
    setDirty(false);
  }, [currentId]);

  const navigate = (id: string) => setStack((s) => [...s, id]);
  const goBack = () => setStack((s) => s.slice(0, -1));

  const handleSave = async () => {
    if (!task || saving) return;
    setSaving(true);
    try {
      await updateTask(currentId, {
        title,
        description,
        priority,
        taskType,
        status,
        startAt: new Date(startAt).toISOString(),
        dueAt: new Date(dueAt).toISOString(),
        weight,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setTaskType(task.taskType);
    setStatus(task.status);
    setStartAt(toInputValue(task.startAt));
    setDueAt(toInputValue(task.dueAt));
    setWeight(task.weight);
    setDirty(false);
  };

  const mark = (field: string) => () => { void field; setDirty(true); };

  const isComplete = task?.status === 'Completed' || task?.status === 'Cancelled';

  if (!task) return null;

  const breadcrumb = stack.map((id) => findTaskById(tasks, id)?.title ?? '…');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[88vh] border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          {stack.length > 1 && (
            <button
              onClick={goBack}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-1 min-w-0 text-xs text-gray-400 truncate">
            {breadcrumb.map((title, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight size={10} className="flex-shrink-0" />}
                <span className={`truncate ${i === breadcrumb.length - 1 ? 'text-gray-600 dark:text-gray-300 font-medium' : ''}`}>
                  {title}
                </span>
              </span>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Title */}
          <div className="flex items-start gap-3">
            {/* Tick button */}
            <button
              onClick={() => { if (!isComplete) { tick(task.id); } }}
              disabled={isComplete}
              className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                isComplete
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {isComplete && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              className={`flex-1 text-lg font-semibold bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300 ${
                isComplete ? 'line-through text-gray-400' : ''
              }`}
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
            placeholder="Add a description…"
            rows={3}
            className="w-full bg-transparent outline-none text-sm text-gray-600 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600 resize-none"
          />

          {/* Field grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as ItemStatus); setDirty(true); }}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer ${STATUS_COLOR[status]}`}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Flag size={10} /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value as Priority); setDirty(true); }}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer ${PRIORITY_COLOR[priority]}`}
              >
                <option value="P1">P1 — {PRIORITY_LABEL.P1}</option>
                <option value="P2">P2 — {PRIORITY_LABEL.P2}</option>
                <option value="P3">P3 — {PRIORITY_LABEL.P3}</option>
                <option value="P4">P4 — {PRIORITY_LABEL.P4}</option>
              </select>
            </div>

            {/* Task type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Layers size={10} /> Type
              </label>
              <select
                value={taskType}
                onChange={(e) => { setTaskType(e.target.value as TaskType); mark('taskType')(); }}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 outline-none cursor-pointer"
              >
                <option value="Parallel">Parallel</option>
                <option value="Sequential">Sequential</option>
              </select>
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Weight</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={weight}
                onChange={(e) => { setWeight(parseFloat(e.target.value) || 1); setDirty(true); }}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none w-full"
              />
            </div>

            {/* Start time */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Clock size={10} /> Start
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => { setStartAt(e.target.value); setDirty(true); }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none w-full"
              />
            </div>

            {/* Due time */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Clock size={10} /> Due
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => { setDueAt(e.target.value); setDirty(true); }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none w-full"
              />
            </div>
          </div>

          {/* Progress (if has children) */}
          {task.totalChildCount > 0 && (
            <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <ProgressRing progress={task.progress} size={32} />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {task.completedChildCount} of {task.totalChildCount} subtasks done
                </p>
                <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${task.progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sequential "Next:" hint */}
          {task.taskType === 'Sequential' && task.nextChildTitle && !isComplete && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <ArrowRight size={12} />
              <span>Next: <span className="font-medium">{task.nextChildTitle}</span></span>
            </div>
          )}

          {/* Subtasks */}
          {task.children.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Subtasks
              </h3>
              <div className="space-y-1">
                {task.children.map((child) => (
                  <SubtaskRow key={child.id} task={child} onNavigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — save/discard only when dirty */}
        {dirty && (
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
            <button
              onClick={handleDiscard}
              className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SubtaskRow({ task, onNavigate }: { task: Task; onNavigate: (id: string) => void }) {
  const isComplete = task.status === 'Completed' || task.status === 'Cancelled';
  const { tick } = useTasksStore();

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
      onClick={() => onNavigate(task.id)}
    >
      {/* Mini checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); if (!isComplete) tick(task.id); }}
        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          isComplete
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }`}
      >
        {isComplete && (
          <svg className="w-2 h-2" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-sm min-w-0 truncate ${isComplete ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
        {task.title}
      </span>

      {/* Child count if any */}
      {task.totalChildCount > 0 && (
        <span className="text-xs text-gray-400 flex-shrink-0">
          {task.completedChildCount}/{task.totalChildCount}
        </span>
      )}

      {/* Priority badge */}
      {task.effectivePriority !== 'P4' && (
        <span className={`text-xs font-semibold flex-shrink-0 ${
          task.effectivePriority === 'P1' ? 'text-red-500' :
          task.effectivePriority === 'P2' ? 'text-orange-500' : 'text-blue-500'
        }`}>
          {task.effectivePriority}
        </span>
      )}

      <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
