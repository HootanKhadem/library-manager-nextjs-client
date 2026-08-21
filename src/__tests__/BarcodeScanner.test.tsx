import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {BrowserMultiFormatReader} from "@zxing/browser";
import {NotFoundException as MockNotFoundException} from "@zxing/library";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";
import {LanguageProvider} from "@/src/lib/i18n/context";

// ---------------------------------------------------------------------------
// Mock @zxing/library — provides the enums/exception class the component imports
// ---------------------------------------------------------------------------
jest.mock("@zxing/library", () => {
    class NotFoundException extends Error {
    }

    return {
        NotFoundException,
        DecodeHintType: {POSSIBLE_FORMATS: "POSSIBLE_FORMATS"},
        BarcodeFormat: {
            EAN_13: "EAN_13",
            EAN_8: "EAN_8",
            CODE_128: "CODE_128",
            CODE_39: "CODE_39",
            UPC_A: "UPC_A",
            UPC_E: "UPC_E",
        },
    };
});

// ---------------------------------------------------------------------------
// Mock @zxing/browser — captures the continuous-decode callback + constraints
// so tests can trigger scans and inspect what was requested, and exposes a
// stoppable controls object plus a device-enumeration hook.
// ---------------------------------------------------------------------------
type DecodeCallback = (
    result: { getText: () => string } | undefined,
    error: Error | undefined
) => void;

let capturedCallback: DecodeCallback | null = null;
let lastConstraints: MediaStreamConstraints | null = null;
let decodeCallCount = 0;
const stop = jest.fn();
const listVideoInputDevicesMock = jest.fn().mockResolvedValue([]);

jest.mock("@zxing/browser", () => ({
    BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
        decodeFromConstraints: jest.fn(
            (constraints: MediaStreamConstraints, _video: unknown, callback: DecodeCallback) => {
                decodeCallCount += 1;
                lastConstraints = constraints;
                capturedCallback = callback;
                return Promise.resolve({stop});
            }
        ),
    })),
    BrowserCodeReader: {
        listVideoInputDevices: (...args: unknown[]) => listVideoInputDevicesMock(...args),
    },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderScanner(props: Partial<React.ComponentProps<typeof BarcodeScanner>> = {}) {
    const onClose = jest.fn();
    const onScan = jest.fn();
    const { rerender } = render(
        <LanguageProvider initialLanguage="en">
            <BarcodeScanner open={true} onClose={onClose} onScan={onScan} {...props} />
        </LanguageProvider>
    );
    return { onClose, onScan, rerender };
}

beforeEach(() => {
    capturedCallback = null;
    lastConstraints = null;
    decodeCallCount = 0;
    listVideoInputDevicesMock.mockResolvedValue([]);
});

afterEach(() => {
    jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("BarcodeScanner", () => {
    it("renders nothing when closed", () => {
        render(
            <LanguageProvider initialLanguage="en">
                <BarcodeScanner open={false} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );
        expect(screen.queryByTestId("barcode-scanner")).toBeNull();
    });

    it("renders modal with title and container when open", () => {
        renderScanner();
        expect(screen.getByTestId("barcode-scanner")).toBeInTheDocument();
        expect(screen.getByText("Scan Barcode")).toBeInTheDocument();
        expect(screen.getByTestId("barcode-container")).toBeInTheDocument();
    });

    it("shows scanning status message", () => {
        renderScanner();
        expect(screen.getByRole("status")).toHaveTextContent(/scanning/i);
    });

    it("mounts scanner view when open", () => {
        renderScanner();
        expect(screen.getByTestId("scanner-view")).toBeInTheDocument();
    });

    it("requests the environment-facing camera by default, at a clearer resolution", async () => {
        renderScanner();
        await waitFor(() => expect(decodeCallCount).toBe(1));
        const video = (lastConstraints?.video ?? {}) as MediaTrackConstraints;
        expect(video.facingMode).toEqual({ideal: "environment"});
        expect(video.width).toEqual({min: 640, ideal: 1920});
        expect(video.height).toEqual({min: 480, ideal: 1080});
    });

    it("calls onScan with decoded value then calls onClose", async () => {
        const { onScan, onClose } = renderScanner();

        await waitFor(() => expect(capturedCallback).not.toBeNull());

        await act(async () => {
            capturedCallback?.({getText: () => "9780141182605"}, undefined);
        });

        expect(onScan).toHaveBeenCalledWith("9780141182605");
        expect(onClose).toHaveBeenCalled();
    });

    it("ignores decode misses (no result)", async () => {
        const {onScan} = renderScanner();

        await waitFor(() => expect(capturedCallback).not.toBeNull());

        await act(async () => {
            capturedCallback?.(undefined, new MockNotFoundException());
        });

        expect(onScan).not.toHaveBeenCalled();
    });

    it("only fires onScan once even if callback fires multiple times", async () => {
        const {onScan} = renderScanner();

        await waitFor(() => expect(capturedCallback).not.toBeNull());

        await act(async () => {
            capturedCallback?.({getText: () => "9780141182605"}, undefined);
            capturedCallback?.({getText: () => "9780141182605"}, undefined);
        });

        expect(onScan).toHaveBeenCalledTimes(1);
    });

    it("stops the scanner controls on unmount/close", async () => {
        const {rerender, onClose} = renderScanner();

        await waitFor(() => expect(capturedCallback).not.toBeNull());

        rerender(
            <LanguageProvider initialLanguage="en">
                <BarcodeScanner open={false} onClose={onClose} onScan={jest.fn()}/>
            </LanguageProvider>
        );

        expect(stop).toHaveBeenCalled();
    });

    it("calls onClose when the close button is clicked", () => {
        const { onClose } = renderScanner();
        fireEvent.click(screen.getByRole("button", { name: /close/i }));
        expect(onClose).toHaveBeenCalled();
    });

    it("does not mount scanner view when closed", () => {
        renderScanner({open: false});
        expect(screen.queryByTestId("scanner-view")).toBeNull();
    });

    it("renders correctly in Farsi (RTL)", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <BarcodeScanner open={true} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );
        expect(screen.getByText("اسکن بارکد")).toBeInTheDocument();
    });

    describe("camera selection", () => {
        it("hides the device picker when only one (or zero) cameras are available", async () => {
            listVideoInputDevicesMock.mockResolvedValue([
                {deviceId: "d1", label: "Back Camera", kind: "videoinput"} as MediaDeviceInfo,
            ]);
            renderScanner();
            await waitFor(() => expect(decodeCallCount).toBe(1));
            expect(screen.queryByTestId("barcode-device-select")).toBeNull();
        });

        it("lists cameras and restarts scanning against the selected device", async () => {
            listVideoInputDevicesMock.mockResolvedValue([
                {deviceId: "d1", label: "Back Camera", kind: "videoinput"} as MediaDeviceInfo,
                {deviceId: "d2", label: "Front Camera", kind: "videoinput"} as MediaDeviceInfo,
            ]);
            renderScanner();

            const select = await screen.findByTestId("barcode-device-select");
            expect(screen.getByText("Back Camera")).toBeInTheDocument();
            expect(screen.getByText("Front Camera")).toBeInTheDocument();
            expect(decodeCallCount).toBe(1);

            await act(async () => {
                fireEvent.change(select, {target: {value: "d2"}});
            });

            await waitFor(() => expect(decodeCallCount).toBe(2));
            expect(stop).toHaveBeenCalled();
            const video = (lastConstraints?.video ?? {}) as MediaTrackConstraints;
            expect(video.deviceId).toEqual({exact: "d2"});
        });
    });

    describe("camera errors", () => {
        it("shows a permission-denied message when getUserMedia is rejected", async () => {
            Object.defineProperty(window, "isSecureContext", {value: true, configurable: true});
            jest.mocked(BrowserMultiFormatReader).mockImplementationOnce(
                () =>
                    ({
                        decodeFromConstraints: jest.fn().mockRejectedValue(
                            new DOMException("denied", "NotAllowedError")
                        ),
                    }) as unknown as BrowserMultiFormatReader
            );

            renderScanner();

            expect(
                await screen.findByText("Camera access denied. Please allow camera permission and try again.")
            ).toBeInTheDocument();
        });
    });
});
