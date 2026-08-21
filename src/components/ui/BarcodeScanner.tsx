"use client";

import {useEffect, useRef, useState} from "react";
import {ScanLine} from "lucide-react";
import {Modal, ModalBody, ModalCloseButton, ModalHeader} from "@/src/components/ui/Modal";
import {Select} from "@/src/components/ui/Select";
import {useLanguage} from "@/src/lib/i18n/context";
import type {Translations} from "@/src/lib/i18n/types";
import type {IScannerControls} from "@zxing/browser";

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (isbn: string) => void;
}

function describeError(err: unknown, t: Translations): string {
    if (typeof window !== "undefined" && !window.isSecureContext) {
        return t.barcodeScanner.insecureContext;
    }
    if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        return t.barcodeScanner.permissionDenied;
    }
    return t.barcodeScanner.error;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const scannedRef = useRef(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        scannedRef.current = false;
        setErrorMessage(null);
        let cancelled = false;

        void (async () => {
            const {BrowserCodeReader, BrowserMultiFormatReader} = await import("@zxing/browser");
            const {DecodeHintType, BarcodeFormat, NotFoundException} = await import("@zxing/library");
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

            const videoConstraints: MediaTrackConstraints = selectedDeviceId
                ? {
                    deviceId: {exact: selectedDeviceId},
                    width: {min: 640, ideal: 1920},
                    height: {min: 480, ideal: 1080},
                }
                : {
                    facingMode: {ideal: "environment"},
                    width: {min: 640, ideal: 1920},
                    height: {min: 480, ideal: 1080},
                };

            try {
                const controls = await reader.decodeFromConstraints(
                    {video: videoConstraints},
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

                try {
                    const list = await BrowserCodeReader.listVideoInputDevices();
                    if (!cancelled) setDevices(list);
                } catch {
                    // Device enumeration is a nice-to-have; scanning already works without it.
                }
            } catch (err) {
                if (!cancelled) setErrorMessage(describeError(err, t));
                console.error(err);
            }
        })();

        return () => {
            cancelled = true;
            controlsRef.current?.stop();
            controlsRef.current = null;
        };
    }, [open, onClose, onScan, selectedDeviceId, t]);

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
                    {devices.length > 1 && (
                        <Select
                            label={t.barcodeScanner.camera}
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="text-xs"
                            data-testid="barcode-device-select"
                        >
                            <option value="">{t.barcodeScanner.cameraAuto}</option>
                            {devices.map((device, index) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `${t.barcodeScanner.camera} ${index + 1}`}
                                </option>
                            ))}
                        </Select>
                    )}
                    <p role="status" className="text-xs text-center text-muted">
                        {errorMessage ?? t.barcodeScanner.scanning}
                    </p>
                </div>
            </ModalBody>
        </Modal>
    );
}
