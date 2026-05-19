const STEPS = [
    {
        title: "Pitch ideas",
        body: "Share software or product concepts — what problem they solve, who they help, and why now.",
    },
    {
        title: "Vote together",
        body: "The community upvotes what matters. Rankings stay public so prioritization is transparent.",
    },
    {
        title: "Build what wins",
        body: "Ideas with momentum can move from open → in progress → shipped. You see status, not just hype.",
    },
] as const;

export default function SitePurposeSection() {
    return (
        <section id="about" className="scroll-mt-28 mb-10" aria-labelledby="about-heading">
            <div className="rounded-2xl border border-border bg-card/70 p-6 md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                    About NextUp
                </p>
                <h2 id="about-heading" className="mt-2 text-xl font-bold tracking-tight text-white md:text-2xl">
                    A community board for what gets built next
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
                    NextUp is where builders and users propose software ideas, debate them in the open,
                    and use votes to decide what deserves attention. Instead of a private backlog or
                    endless brainstorming, everyone can see what is rising, comment, volunteer to help,
                    and follow ideas as they move toward reality.
                </p>

                <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                    {STEPS.map((step) => (
                        <li
                            key={step.title}
                            className="rounded-xl border border-border bg-background/50 p-4"
                        >
                            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
