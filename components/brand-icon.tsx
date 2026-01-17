export function BrandIcon() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/40">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6.5 9.5h11l1.8 4.5H4.7L6.5 9.5z" />
        <path d="M4.5 14h15v3.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V14z" />
        <path d="M7 11h10" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </svg>
    </div>
  );
}
