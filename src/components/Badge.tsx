/**
 * components/Badge.tsx
 *
 * Displays a coloured pill badge for a book's status.
 *
 * i18n: the badge label is sourced from t.badge[status] so it translates
 * automatically when the language switches.
 * The statusStyles map uses the BookStatus enum values (English) as keys,
 * which are internal identifiers — they never change regardless of locale.
 */

"use client";
import {BookStatus} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";

interface BadgeProps {
    status: BookStatus;
}

// Internal CSS class map — keyed by the canonical English status value.
// These are data identifiers, not display strings, so they stay in English.
const statusStyles: Record<BookStatus, string> = {
    Owned: "bg-[rgba(74,103,65,0.1)] text-[#4a6741] border border-[rgba(74,103,65,0.25)]",
    "Lent Out": "bg-[rgba(160,48,32,0.1)] text-[#a03020] border border-[rgba(160,48,32,0.25)]",
    Wishlist: "bg-[rgba(196,116,42,0.1)] text-[#c4742a] border border-[rgba(196,116,42,0.25)]",
    Read: "bg-[rgba(61,28,2,0.08)] text-[#7a3d12] border border-[rgba(61,28,2,0.15)]",
};

// Map canonical status to the translation key
const statusToKey: Record<BookStatus, keyof { owned: string; lentOut: string; wishlist: string; read: string }> = {
    Owned: "owned",
    "Lent Out": "lentOut",
    Wishlist: "wishlist",
    Read: "read",
};

export default function Badge({status}: BadgeProps) {
    const {t} = useLanguage();
    // Look up the translated label; fall back to the raw status if key missing
    const label = t.badge[statusToKey[status]] ?? status;

    return (
        <span
            className={`inline-block px-2.5 py-0.5 rounded font-mono text-[0.6rem] tracking-widest uppercase font-bold ${statusStyles[status]}`}
        >
      {label}
    </span>
    );
}
