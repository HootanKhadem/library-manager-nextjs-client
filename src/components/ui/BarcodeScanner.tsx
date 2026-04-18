"use client";

import {useEffect, useRef, useState} from "react";
import {ScanLine} from "lucide-react";
import {BrowserMultiFormatReader} from "@zxing/browser";
import {Modal, ModalBody, ModalCloseButton, ModalHeader} from "@/src/components/ui/Modal";
import {useLanguage} from "@/src/lib/i18n/context";

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (isbn: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    // Keep latest callbacks in refs so the effect closure never goes stale
    const onScanRef = useRef(onScan);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onScanRef.current = onScan; });
    useEffect(() => { onCloseRef.current = onClose; });

    const [scanState, setScanState] = useState<"scanning" | "denied" | "error">("scanning");

    useEffect(() => {
        if (!open || !videoRef.current) return;

        setScanState("scanning");
        const reader = new BrowserMultiFormatReader();

        reader
            .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
                if (!result) return; // normal "not found yet" frame
                onScanRef.current(result.getText());
                reader.reset();
                onCloseRef.current();
            })
            .catch((err: Error) => {
                setScanState(err.name === "NotAllowedError" ? "denied" : "error");
            });

        return () => {
            reader.reset();
        };
    }, [open]);

    const statusText =
        scanState === "denied" ? t.barcodeScanner.permissionDenied :
        scanState === "error"  ? t.barcodeScanner.error :
        t.barcodeScanner.scanning;

    return (
        <Modal open={open} onClose={onClose} className="max-w-sm" data-testid="barcode-scanner">
            <ModalHeader>
                <div className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                    <div>
                        <h2 className="text-base font-semibold text-[var(--foreground)]">
                            {t.barcodeScanner.title}
                        </h2>
                        <p className="text-xs text-[var(--muted)]">{t.barcodeScanner.subtitle}</p>
                    </div>
                </div>
                <ModalCloseButton onClose={onClose} aria-label={t.common.close} />
            </ModalHeader>
            <ModalBody>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-stone-900">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            data-testid="barcode-video"
                        />
                        {/* Targeting reticle */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-3/4 h-1/3 border-2 border-[var(--accent)] rounded-lg opacity-80" />
                        </div>
                    </div>
                    <p
                        role="status"
                        className={[
                            "text-xs text-center",
                            scanState === "scanning"
                                ? "text-[var(--muted)]"
                                : "text-[var(--destructive)]",
                        ].join(" ")}
                    >
                        {statusText}
                    </p>
                </div>
            </ModalBody>
        </Modal>
    );
}
