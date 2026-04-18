import { BookStatus as LibBookStatus } from "@/src/lib/types";
import { Badge, BadgeVariant } from "./Badge";

interface StatusBadgeProps {
    status: LibBookStatus;
    overdue?: boolean;
}

const statusConfig: Record<LibBookStatus, { variant: BadgeVariant; label: string }> = {
    "Owned":    { variant: "success", label: "Owned" },
    "Lent Out": { variant: "warning", label: "Lent Out" },
    "Wishlist": { variant: "muted",   label: "Wishlist" },
    "Read":     { variant: "default", label: "Read" },
};

function StatusBadge({ status, overdue }: StatusBadgeProps) {
    if (overdue) {
        return <Badge variant="danger">Overdue</Badge>;
    }
    const { variant, label } = statusConfig[status] ?? { variant: "muted" as BadgeVariant, label: status };
    return <Badge variant={variant}>{label}</Badge>;
}

export { StatusBadge };
