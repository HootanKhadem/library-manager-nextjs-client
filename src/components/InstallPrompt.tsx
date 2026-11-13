"use client";

import {useEffect, useState} from "react";
import {Download, Share, X} from "lucide-react";
import {useLanguage} from "@/src/lib/i18n/context";

const DISMISS_KEY = "pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
    return (window.matchMedia?.("(display-mode: standalone)").matches ?? false)
        || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
        // iPadOS 13+ reports as "MacIntel" but, unlike a real Mac, has a touchscreen.
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function wasDismissed(): boolean {
    try {
        return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
        // localStorage unavailable (private mode); treat as not dismissed.
        return false;
    }
}

function getInitialPlatform(): "android" | "ios" | null {
    if (typeof window === "undefined" || isStandalone() || wasDismissed()) return null;
    return isIos() ? "ios" : null;
}

export function InstallPrompt() {
    const {t} = useLanguage();
    const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [platform, setPlatform] = useState<"android" | "ios" | null>(getInitialPlatform);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (isIos() || isStandalone() || wasDismissed()) return;

        function handler(e: Event) {
            e.preventDefault();
            setDeferredEvent(e as BeforeInstallPromptEvent);
            setPlatform("android");
        }
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    function dismiss() {
        setDismissed(true);
        try {
            localStorage.setItem(DISMISS_KEY, "1");
        } catch {
            // best-effort; the banner simply reappears next visit
        }
    }

    async function install() {
        if (!deferredEvent) return;
        await deferredEvent.prompt();
        await deferredEvent.userChoice;
        dismiss();
    }

    if (!platform || dismissed) return null;

    return (
        <div
            role="status"
            data-testid="install-prompt"
            className="fixed z-40 inset-x-4 bottom-20 lg:bottom-4 lg:inset-x-auto lg:right-4 lg:w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 animate-slideUp"
            style={{boxShadow: "var(--shadow-modal)"}}
        >
            <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                    <Download className="h-4 w-4" aria-hidden="true"/>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{t.installPrompt.title}</p>
                    {platform === "android" ? (
                        <p className="mt-0.5 text-xs text-[var(--muted)]">{t.installPrompt.androidSubtitle}</p>
                    ) : (
                        <div className="mt-0.5 text-xs text-[var(--muted)]">
                            <p>{t.installPrompt.iosSubtitle}</p>
                            <p className="mt-1 flex items-center gap-1">
                                {t.installPrompt.iosStep1}
                                <Share className="h-3 w-3 inline" aria-hidden="true"/>
                            </p>
                            <p>{t.installPrompt.iosStep2}</p>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label={t.common.close}
                    className="rounded-lg p-1 text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
                >
                    <X className="h-4 w-4" aria-hidden="true"/>
                </button>
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={dismiss}
                    className="h-8 px-3 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                    {t.installPrompt.dismiss}
                </button>
                {platform === "android" && (
                    <button
                        type="button"
                        onClick={install}
                        className="h-8 px-3 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        {t.installPrompt.install}
                    </button>
                )}
            </div>
        </div>
    );
}
