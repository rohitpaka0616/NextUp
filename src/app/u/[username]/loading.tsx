export default function UserProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10" />
          <div>
            <div className="h-6 w-48 rounded bg-white/10" />
            <div className="mt-2 h-4 w-32 rounded bg-white/10" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-2 h-6 w-12 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="mt-2 h-4 w-full rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
