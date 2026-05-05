"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {ScanLine} from "lucide-react";
import {Modal, ModalBody, ModalCloseButton, ModalHeader} from "@/src/components/ui/Modal";
import {useLanguage} from "@/src/lib/i18n/context";

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (isbn: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const onScanRef = useRef(onScan);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onScanRef.current = onScan; });
    useEffect(() => { onCloseRef.current = onClose; });

    const [scanState, setScanState] = useState<"scanning" | "denied" | "error" | "insecure">("scanning");
    const handleClose = useCallback(() => {
        setScanState("scanning");
        onCloseRef.current();
    }, []);

    useEffect(() => {
        if (!open || !containerRef.current) return;
        if (!window.isSecureContext) {
            setScanState("insecure");
            return;
        }

        let stopped = false;
        let initialized = false;

        const start = async () => {
            try {
                const {default: Quagga} = await import("@ericblade/quagga2");
                if (stopped) return;

                await new Promise<void>((resolve, reject) => {
                    Quagga.init(
                        {
                            inputStream: {
                                type: "LiveStream",
                                target: containerRef.current!,
                                constraints: {
                                    facingMode: {ideal: "environment"},
                                    width: {min: 640},
                                    height: {min: 480},
                                },
                            },
                            locator: {patchSize: "medium", halfSample: true},
                            numOfWorkers: 0,
                            decoder: {
                                readers: [
                                    "ean_reader",
                                    "ean_8_reader",
                                    "code_128_reader",
                                    "code_39_reader",
                                    "upc_reader",
                                    "upc_e_reader",
                                ],
                            },
                            locate: true,
                        },
                        (err) => (err ? reject(err) : resolve())
                    );
                });

                initialized = true;
                if (stopped) {
                    Quagga.stop();
                    return;
                }

                Quagga.start();
                setScanState("scanning");

                Quagga.onDetected((result) => {
                    const code = result.codeResult.code;
                    if (!code || stopped) return;
                    stopped = true;
                    Quagga.stop();
                    onScanRef.current(code);
                    handleClose();
                });
            } catch (err: unknown) {
                if (stopped) return;
                const isPermission =
                    err instanceof Error &&
                    (err.name === "NotAllowedError" || err.message?.includes("Permission"));
                setScanState(isPermission ? "denied" : "error");
            }
        };

        start();

        return () => {
            stopped = true;
            if (initialized) {
                import("@ericblade/quagga2")
                    .then(({default: Quagga}) => {
                        try {
                            Quagga.stop();
                        } catch { /* ignore */
                        }
                    })
                    .catch(() => { /* ignore */
                    });
            }
        };
    }, [open, handleClose]);

    const statusText =
        scanState === "denied" ? t.barcodeScanner.permissionDenied :
            scanState === "insecure" ? t.barcodeScanner.insecureContext :
                scanState === "error" ? t.barcodeScanner.error :
                    t.barcodeScanner.scanning;

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
                        ref={containerRef}
                        className="relative w-full aspect-video rounded-xl overflow-hidden bg-stone-900 [&_video]:absolute [&_video]:inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:w-full [&_canvas]:h-full"
                        data-testid="barcode-container"
                    >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-3/4 h-1/3 border-2 border-accent rounded-lg opacity-80"/>
                        </div>
                    </div>
                    <p
                        role="status"
                        className={[
                            "text-xs text-center",
                            scanState === "scanning" ? "text-muted" : "text-(--destructive)",
                        ].join(" ")}
                    >
                        {statusText}
                    </p>
                </div>
            </ModalBody>
        </Modal>
    );
}
