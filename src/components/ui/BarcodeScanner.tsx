"use client";

import {useCallback, useRef} from "react";
import dynamic from "next/dynamic";
import {ScanLine} from "lucide-react";
import {Modal, ModalBody, ModalCloseButton, ModalHeader} from "@/src/components/ui/Modal";
import {useLanguage} from "@/src/lib/i18n/context";

interface DetectedBarcode {
    rawValue: string;
}

const BarcodeScannerView = dynamic(
    async () => {
        await import("react-barcode-scanner/polyfill");
        return import("react-barcode-scanner").then((m) => m.BarcodeScanner);
    },
    {ssr: false}
);

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (isbn: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const { t } = useLanguage();
    const scannedRef = useRef(false);

    const handleCapture = useCallback(
        (barcodes: DetectedBarcode[]) => {
            if (scannedRef.current || barcodes.length === 0) return;
            const code = barcodes[0].rawValue;
            if (!code) return;
            scannedRef.current = true;
            onScan(code);
            onClose();
        },
        [onScan, onClose]
    );

    const handleClose = useCallback(() => {
        scannedRef.current = false;
        onClose();
    }, [onClose]);

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
                            <BarcodeScannerView
                                options={{
                                    formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
                                    delay: 500,
                                }}
                                trackConstraints={{
                                    facingMode: {ideal: "environment"},
                                    width: {min: 640},
                                    height: {min: 480},
                                }}
                                onCapture={handleCapture}
                            />
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
