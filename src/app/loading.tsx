export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl py-10">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-white/10" />
      <div className="grid gap-3">
        {[0, 1, 2].map((k) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="mt-3 h-5 w-2/3 rounded bg-white/10" />
            <div className="mt-2 h-4 w-full rounded bg-white/10" />
            <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
