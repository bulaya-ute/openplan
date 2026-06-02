export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OpenPlan"
    >
      <rect
        x="5" y="18" width="38" height="16" rx="8"
        fill="#1d4ed8"
        transform="rotate(-32 24 26)"
      />
      <rect
        x="37" y="44" width="38" height="16" rx="8"
        fill="#60a5fa"
        transform="rotate(-32 56 52)"
      />
    </svg>
  );
}
