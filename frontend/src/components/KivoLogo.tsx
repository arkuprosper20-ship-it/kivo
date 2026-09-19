export default function KivoLogo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="KIVO">
      <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#1B4FD6" />
        <path d="M10 8v16M10 16l10-8M11 16l9 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="font-display text-2xl font-extrabold tracking-tight text-ink">KIVO</span>
    </span>
  );
}
