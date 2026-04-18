"use client";

import { HTMLAttributes, ReactNode, useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    "data-testid"?: string;
}

function Modal({ open, onClose, children, className = "", "data-testid": testId }: ModalProps) {
    const handleKey = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (!open) return;
        document.addEventListener("keydown", handleKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [open, handleKey]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 animate-fadeIn"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Container */}
            <div
                className={[
                    "relative z-10 w-full bg-[var(--card)] rounded-2xl border border-[var(--border)] animate-slideUp overflow-hidden",
                    className,
                ].join(" ")}
                style={{ boxShadow: "var(--shadow-modal)" }}
                data-testid={testId}
            >
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={["flex items-center justify-between px-6 py-4 border-b border-[var(--border)]", className].join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}

function ModalBody({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={["px-6 py-5", className].join(" ")} {...props}>
            {children}
        </div>
    );
}

function ModalFooter({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={["flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-stone-50/60", className].join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}

interface ModalCloseButtonProps {
    onClose: () => void;
    "aria-label"?: string;
}

function ModalCloseButton({ onClose, "aria-label": ariaLabel = "Close" }: ModalCloseButtonProps) {
    return (
        <button
            onClick={onClose}
            aria-label={ariaLabel}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
        >
            <X className="h-4 w-4" aria-hidden="true" />
        </button>
    );
}

export { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton };
export type { ModalProps };
