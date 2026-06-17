import { WifiOff } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

interface ErrorStateProps {
    heading?: string;
    description?: string;
    retryLabel?: string;
    onRetry?: () => void;
    className?: string;
}

function ErrorState({
    heading = "Something went wrong",
    description,
    retryLabel = "Try again",
    onRetry,
    className = "",
}: ErrorStateProps) {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center gap-3 py-16 text-center",
                className,
            ].join(" ")}
        >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[var(--destructive)]">
                <WifiOff className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{heading}</h3>
                {description && (
                    <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
                )}
            </div>
            {onRetry && (
                <div className="mt-1">
                    <Button variant="secondary" size="sm" onClick={onRetry}>
                        {retryLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}

export { ErrorState };
export type { ErrorStateProps };
