import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { Status } from "@/lib/db";

interface IdeaCardProps {
    id: string;
    title: string;
    shortDesc: string;
    status: Status;
    authorName: string;
    voteCount: number;
    rank: number;
}

export default function IdeaCard({
    id,
    title,
    shortDesc,
    status,
    authorName,
    voteCount,
    rank,
}: IdeaCardProps) {
    return (
        <Link href={`/idea/${id}`} className="group block">
            <div className="card-elevated flex items-start gap-5 p-5 transition-all duration-200 hover:border-accent/40">
                {/* Rank + votes */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                    <span className="text-xs font-medium text-muted">#{rank}</span>
                    <div className="flex flex-col items-center rounded-lg bg-accent/10 px-3 py-2">
                        <span className="text-lg font-bold text-accent">{voteCount}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                            votes
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                        <h3 className="truncate text-lg font-semibold transition-colors group-hover:text-accent">
                            {title}
                        </h3>
                        <StatusBadge status={status} />
                    </div>
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted">
                        {shortDesc}
                    </p>
                    <span className="text-xs text-muted">by {authorName}</span>
                </div>
            </div>
        </Link>
    );
}
