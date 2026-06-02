interface Props {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({ progress, size = 20, strokeWidth = 2.5 }: Props) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="rotate-[-90deg]" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth={strokeWidth} className="text-gray-200 dark:text-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="text-indigo-500 transition-all duration-300" />
    </svg>
  );
}
