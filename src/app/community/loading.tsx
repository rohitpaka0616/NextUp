export default function CommunityLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="mt-2 h-5 w-3/5 rounded bg-white/10" />
            <div className="mt-3 h-4 w-full rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="space-y-4 lg:col-span-4">
        <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="mt-3 h-4 w-full rounded bg-white/10" />
          <div className="mt-2 h-4 w-full rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}
