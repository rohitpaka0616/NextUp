import type { Status } from "@/lib/db";

const config: Record<Status, { label: string; className: string }> = {
    OPEN: {
        label: "Open",
        className: "bg-badge-open/15 text-badge-open",
    },
    BUILDING: {
        label: "Building",
        className: "bg-badge-building/15 text-badge-building",
    },
    SHIPPED: {
        label: "Shipped",
        className: "bg-badge-shipped/15 text-badge-shipped",
    },
};

export default function StatusBadge({ status }: { status: Status }) {
    const { label, className } = config[status];
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
        >
            {label}
        </span>
    );
}
