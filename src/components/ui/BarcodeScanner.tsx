"use client";

import {useEffect, useRef} from "react";
import {NotFoundException} from "@zxing/library";
import {ScanLine} from "lucide-react";
import {Modal, ModalBody, ModalCloseButton, ModalHeader} from "@/src/components/ui/Modal";
import {useLanguage} from "@/src/lib/i18n/context";
import type {IScannerControls} from "@zxing/browser";

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (isbn: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const scannedRef = useRef(false);

    useEffect(() => {
        if (!open) return;
        scannedRef.current = false;
        let cancelled = false;

        void (async () => {
            const {BrowserMultiFormatReader} = await import("@zxing/browser");
            const {DecodeHintType, BarcodeFormat} = await import("@zxing/library");
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.CODE_128,
                BarcodeFormat.CODE_39,
                BarcodeFormat.UPC_A,
                BarcodeFormat.UPC_E,
            ]);
            const reader = new BrowserMultiFormatReader(hints);

            if (cancelled || !videoRef.current) return;

            try {
                const controls = await reader.decodeFromConstraints(
                    {
                        video: {
                            facingMode: {ideal: "environment"},
                            width: {min: 640},
                            height: {min: 480},
                        },
                    },
                    videoRef.current,
                    (result, error) => {
                        if (scannedRef.current || !result) {
                            if (error && !(error instanceof NotFoundException)) {
                                console.error(error);
                            }
                            return;
                        }
                        scannedRef.current = true;
                        onScan(result.getText());
                        controlsRef.current?.stop();
                        onClose();
                    }
                );
                if (cancelled) {
                    controls.stop();
                    return;
                }
                controlsRef.current = controls;
            } catch (err) {
                console.error(err);
            }
        })();

        return () => {
            cancelled = true;
            controlsRef.current?.stop();
            controlsRef.current = null;
        };
    }, [open, onClose, onScan]);

    const handleClose = () => {
        scannedRef.current = false;
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} className="max-w-sm" data-testid="barcode-scanner">
            <ModalHeader>
                <div className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-accent" aria-hidden="true" />
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            {t.barcodeScanner.title}
                        </h2>
                        <p className="text-xs text-muted">{t.barcodeScanner.subtitle}</p>
                    </div>
                </div>
                <ModalCloseButton onClose={handleClose} aria-label={t.common.close} />
            </ModalHeader>
            <ModalBody>
                <div className="flex flex-col items-center gap-3">
                    <div
                        className="relative w-full aspect-video rounded-xl overflow-hidden bg-stone-900 [&_video]:absolute [&_video]:inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                        data-testid="barcode-container"
                    >
                        {open && (
                            <video ref={videoRef} data-testid="scanner-view" muted playsInline/>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-3/4 h-1/3 border-2 border-accent rounded-lg opacity-80"/>
                        </div>
                    </div>
                    <p role="status" className="text-xs text-center text-muted">
                        {t.barcodeScanner.scanning}
                    </p>
                </div>
            </ModalBody>
        </Modal>
    );
}
