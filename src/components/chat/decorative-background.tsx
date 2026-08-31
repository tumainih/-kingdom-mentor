export function DecorativeBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand/10 blur-3xl sm:h-72 sm:w-72" />
      <div className="absolute -right-12 top-24 h-48 w-48 rounded-full bg-brand-gold/8 blur-3xl sm:h-64 sm:w-64" />
      <div className="absolute bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-light/8 blur-3xl" />
    </div>
  );
}
