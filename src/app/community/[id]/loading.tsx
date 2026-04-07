export default function CommunityPostLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
        <div className="h-5 w-20 rounded bg-white/10" />
        <div className="mt-3 h-8 w-2/3 rounded bg-white/10" />
        <div className="mt-2 h-4 w-40 rounded bg-white/10" />
        <div className="mt-6 h-4 w-full rounded bg-white/10" />
        <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-4 animate-pulse">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="mt-2 h-4 w-full rounded bg-white/10" />
      </div>
    </div>
  );
}
