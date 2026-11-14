import { BookStatus as LibBookStatus } from "@/src/lib/types";
import { Badge, BadgeVariant } from "./Badge";
import { useLanguage } from "@/src/lib/i18n/context";

interface StatusBadgeProps {
    status: LibBookStatus;
    overdue?: boolean;
}

const statusVariant: Record<LibBookStatus, BadgeVariant> = {
    "Owned": "success",
    "Lent Out": "warning",
    "Wishlist": "muted",
    "Read": "default",
};

function StatusBadge({ status, overdue }: StatusBadgeProps) {
    const { t } = useLanguage();
    if (overdue) {
        return <Badge variant="danger">{t.common.overdue}</Badge>;
    }
    const labels: Record<LibBookStatus, string> = {
        "Owned": t.badge.owned,
        "Lent Out": t.badge.lentOut,
        "Wishlist": t.badge.wishlist,
        "Read": t.badge.read,
    };
    return <Badge variant={statusVariant[status] ?? "muted"}>{labels[status] ?? status}</Badge>;
}

export { StatusBadge };
