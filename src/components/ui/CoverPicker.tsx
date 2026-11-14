"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { resizeImageToDataUrl } from "@/src/lib/image";

interface CoverPickerProps {
    label: string;
    value: string;
    onChange: (dataUrl: string) => void;
    chooseLabel: string;
    removeLabel: string;
}

export function CoverPicker({ label, value, onChange, chooseLabel, removeLabel }: CoverPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            onChange(await resizeImageToDataUrl(file));
        } catch {
            // unreadable image: leave the current value untouched
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
            <div className="relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)]">
                {value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={value} alt={label} className="h-full w-full object-cover" />
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex flex-col items-center gap-1 px-2 text-center text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                        <ImagePlus className="h-5 w-5" aria-hidden="true" />
                        {chooseLabel}
                    </button>
                )}
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        aria-label={`${removeLabel} — ${label}`}
                        className="absolute end-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 cursor-pointer"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" aria-label={`${chooseLabel} — ${label}`} />
        </div>
    );
}
