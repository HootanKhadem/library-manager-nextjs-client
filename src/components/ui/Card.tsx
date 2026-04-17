import { HTMLAttributes } from "react";

function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={["bg-[var(--card)] border border-[var(--border)] rounded-xl", className].join(" ")}
            style={{ boxShadow: "var(--shadow-card)" }}
            {...props}
        >
            {children}
        </div>
    );
}

function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={["flex items-center justify-between px-5 py-4 border-b border-[var(--border)]", className].join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}

function CardBody({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={["px-5 py-4", className].join(" ")} {...props}>
            {children}
        </div>
    );
}

function CardFooter({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={["flex items-center px-5 py-3 border-t border-[var(--border)] bg-stone-50/60 rounded-b-xl", className].join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}

export { Card, CardHeader, CardBody, CardFooter };
