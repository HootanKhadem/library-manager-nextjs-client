"use client";

import { ReactNode, useState, useRef, useId } from "react";

interface TooltipProps {
    content: string;
    children: ReactNode;
    side?: "top" | "bottom" | "left" | "right";
}

function Tooltip({ content, children, side = "bottom" }: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const id = useId();

    const positionClasses: Record<string, string> = {
        top:    "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
        bottom: "top-full  left-1/2 -translate-x-1/2 mt-1.5",
        left:   "right-full top-1/2 -translate-y-1/2 me-1.5",
        right:  "left-full  top-1/2 -translate-y-1/2 ms-1.5",
    };

    return (
        <span
            className="relative inline-flex"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocusCapture={() => setVisible(true)}
            onBlurCapture={() => setVisible(false)}
        >
            {children}
            {visible && (
                <span
                    role="tooltip"
                    id={id}
                    className={[
                        "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-stone-900 px-2.5 py-1 text-xs text-white animate-fadeIn",
                        positionClasses[side],
                    ].join(" ")}
                >
                    {content}
                </span>
            )}
        </span>
    );
}

export { Tooltip };
