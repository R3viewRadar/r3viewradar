export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="R3viewRadar logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="20" cy="20" r="18" stroke="hsl(192 85% 52%)" strokeWidth="2" opacity="0.3" />
      {/* Middle ring */}
      <circle cx="20" cy="20" r="12" stroke="hsl(192 85% 52%)" strokeWidth="1.5" opacity="0.55" />
      {/* Inner circle */}
      <circle cx="20" cy="20" r="6" fill="hsl(192 85% 52%)" />
      {/* Star inside */}
      <path
        d="M20 15.5l1.1 2.3 2.5.35-1.8 1.75.43 2.5-2.23-1.18-2.23 1.18.43-2.5L16.4 18.15l2.5-.35z"
        fill="white"
      />
      {/* Radar sweep line */}
      <line x1="20" y1="20" x2="34" y2="8" stroke="hsl(192 85% 52%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
