export function DecorativeBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.35]" />
      <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-brand/12 blur-3xl" />
      <div className="absolute -right-20 top-32 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="absolute bottom-24 left-1/4 h-56 w-56 rounded-full bg-brand-gold/8 blur-3xl" />
      <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-indigo-300/10 blur-2xl" />
    </div>
  );
}
