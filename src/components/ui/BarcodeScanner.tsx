"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {ScanLine} from "lucide-react";
import {BrowserMultiFormatReader} from "@zxing/browser";
import {BarcodeFormat, DecodeHintType} from "@zxing/library";
import {Modal, ModalBody, ModalCloseButton, ModalHeader} from "@/src/components/ui/Modal";
import {useLanguage} from "@/src/lib/i18n/context";

const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.4;
const MIN_CROP_WIDTH = 240;
const MAX_CROP_WIDTH = 600;
const MIN_CROP_HEIGHT = 80;
const MAX_CROP_HEIGHT = 400;

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (isbn: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const cropOverlayRef = useRef<HTMLDivElement>(null);
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
        if (!open) return;
        if (!window.isSecureContext) {
            setScanState("insecure");
            return;
        }

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.EAN_13,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        let intervalId: ReturnType<typeof setInterval> | null = null;
        let stream: MediaStream | null = null;
        let stopped = false;

        const stopScanner = () => {
            stopped = true;
            if (intervalId) clearInterval(intervalId);
            stream?.getTracks().forEach((t) => t.stop());
        };

        const captureFrameAndCrop = () => {
            const video = videoRef.current;
            const overlay = cropOverlayRef.current;
            if (!video || !overlay || video.readyState < 2) return;

            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) return;

            tempCanvas.width = video.videoWidth;
            tempCanvas.height = video.videoHeight;
            tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

            const videoRatio = video.videoWidth / video.videoHeight;
            let cropWidth: number, cropHeight: number;
            if (videoRatio / DESIRED_CROP_ASPECT_RATIO > 1) {
                cropHeight = video.videoHeight * CROP_SIZE_FACTOR;
                cropWidth = cropHeight * DESIRED_CROP_ASPECT_RATIO;
            } else {
                cropWidth = video.videoWidth * CROP_SIZE_FACTOR;
                cropHeight = cropWidth / DESIRED_CROP_ASPECT_RATIO;
            }
            cropWidth = Math.max(MIN_CROP_WIDTH, Math.min(MAX_CROP_WIDTH, Math.min(cropWidth, video.videoWidth)));
            cropHeight = Math.max(MIN_CROP_HEIGHT, Math.min(MAX_CROP_HEIGHT, Math.min(cropHeight, video.videoHeight)));

            const cropX = (video.videoWidth - cropWidth) / 2;
            const cropY = (video.videoHeight - cropHeight) / 2;

            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = cropWidth;
            cropCanvas.height = cropHeight;
            const cropCtx = cropCanvas.getContext("2d");
            if (!cropCtx) return;
            cropCtx.drawImage(tempCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

            overlay.style.left = `${(cropX / video.videoWidth) * 100}%`;
            overlay.style.top = `${(cropY / video.videoHeight) * 100}%`;
            overlay.style.width = `${(cropWidth / video.videoWidth) * 100}%`;
            overlay.style.height = `${(cropHeight / video.videoHeight) * 100}%`;

            try {
                const result = reader.decodeFromCanvas(cropCanvas);
                if (stopped) return;
                onScanRef.current(result.getText());
                stopScanner();
                handleClose();
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== "NotFoundException") {
                    console.error("Decoding error:", err);
                }
            }
        };

        setScanState("scanning");
        navigator.mediaDevices
            .getUserMedia({video: {facingMode: {ideal: "environment"}}})
            .then((mediaStream) => {
                if (stopped) {
                    mediaStream.getTracks().forEach((t) => t.stop());
                    return;
                }
                stream = mediaStream;
                const video = videoRef.current;
                if (!video) return;
                video.srcObject = mediaStream;
                video.onloadedmetadata = () => {
                    video.play();
                    intervalId = setInterval(captureFrameAndCrop, 100);
                };
            })
            .catch((err: Error) => {
                setScanState(err.name === "NotAllowedError" ? "denied" : "error");
            });

        return () => {
            stopScanner();
        };
    }, [open, handleClose]);

    const statusText =
        scanState === "denied" ? t.barcodeScanner.permissionDenied :
            scanState === "insecure" ? t.barcodeScanner.insecureContext :
        scanState === "error"  ? t.barcodeScanner.error :
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
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-stone-900">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            data-testid="barcode-video"
                        />
                        <div
                            ref={cropOverlayRef}
                            className="absolute border-2 border-accent rounded-lg pointer-events-none"
                            style={{boxSizing: "border-box"}}
                        />
                    </div>
                    <p
                        role="status"
                        className={[
                            "text-xs text-center",
                            scanState === "scanning"
                                ? "text-muted"
                                : "text-(--destructive)",
                        ].join(" ")}
                    >
                        {statusText}
                    </p>
                </div>
            </ModalBody>
        </Modal>
    );
}
