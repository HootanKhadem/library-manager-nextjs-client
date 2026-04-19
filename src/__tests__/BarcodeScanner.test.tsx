import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {BrowserMultiFormatReader} from "@zxing/browser";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";
import {LanguageProvider} from "@/src/lib/i18n/context";

// ---------------------------------------------------------------------------
// Mock @zxing/browser — instance is configured in beforeEach to avoid TDZ
// ---------------------------------------------------------------------------
jest.mock("@zxing/browser", () => ({
    BrowserMultiFormatReader: jest.fn(),
}));

const MockReader = BrowserMultiFormatReader as jest.MockedClass<typeof BrowserMultiFormatReader>;

type ScanCallback = (result: { getText: () => string } | null, err?: Error) => void;

let mockStop: jest.Mock;
let mockControls: { stop: jest.Mock };
let mockDecodeFromVideoDevice: jest.Mock;
let capturedCallback: ScanCallback | null;

beforeEach(() => {
    Object.defineProperty(window, "isSecureContext", {
        value: true,
        configurable: true,
    });
    capturedCallback = null;
    mockStop = jest.fn();
    mockControls = { stop: mockStop };
    mockDecodeFromVideoDevice = jest.fn((_deviceId: unknown, _el: unknown, cb: ScanCallback) => {
        capturedCallback = cb;
        return Promise.resolve(mockControls);
    });
    MockReader.mockImplementation(() => ({
        decodeFromVideoDevice: mockDecodeFromVideoDevice,
    }) as unknown as BrowserMultiFormatReader);
});

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

    it("renders modal with title and video when open", () => {
        renderScanner();
        expect(screen.getByTestId("barcode-scanner")).toBeInTheDocument();
        expect(screen.getByText("Scan Barcode")).toBeInTheDocument();
        expect(screen.getByTestId("barcode-video")).toBeInTheDocument();
    });

    it("shows scanning status message", () => {
        renderScanner();
        expect(screen.getByRole("status")).toHaveTextContent(/scanning/i);
    });

    it("calls onScan with the decoded text and then calls onClose", async () => {
        const { onScan, onClose } = renderScanner();
        await act(async () => {
            capturedCallback?.({ getText: () => "9780141182605" });
        });
        expect(onScan).toHaveBeenCalledWith("9780141182605");
        expect(onClose).toHaveBeenCalled();
        await waitFor(() => {
            expect(mockStop).toHaveBeenCalled();
        });
    });

    it("stops scanner even if decode callback runs before controls resolve", async () => {
        let resolveControls: ((value: { stop: jest.Mock }) => void) | null = null;
        mockDecodeFromVideoDevice.mockImplementation((_deviceId: unknown, _el: unknown, cb: ScanCallback) => {
            capturedCallback = cb;
            return new Promise((resolve) => {
                resolveControls = resolve;
            });
        });

        const { onScan, onClose } = renderScanner();

        await act(async () => {
            capturedCallback?.({ getText: () => "9780306406157" });
        });

        expect(onScan).toHaveBeenCalledWith("9780306406157");
        expect(onClose).toHaveBeenCalled();
        expect(mockStop).not.toHaveBeenCalled();

        await act(async () => {
            resolveControls?.(mockControls);
        });

        await waitFor(() => {
            expect(mockStop).toHaveBeenCalledTimes(1);
        });
    });

    it("ignores null results (normal 'not found yet' frames)", async () => {
        const { onScan } = renderScanner();
        await act(async () => {
            capturedCallback?.(null);
        });
        expect(onScan).not.toHaveBeenCalled();
    });

    it("shows permission denied message when camera is blocked", async () => {
        const permissionError = Object.assign(new Error("Permission denied"), { name: "NotAllowedError" });
        mockDecodeFromVideoDevice.mockReturnValue(Promise.reject(permissionError));

        renderScanner();
        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent(/camera access denied/i);
        });
    });

    it("shows generic error message for other camera errors", async () => {
        const genericError = new Error("Device not found");
        mockDecodeFromVideoDevice.mockReturnValue(Promise.reject(genericError));

        renderScanner();
        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent(/could not read barcode/i);
        });
    });

    it("calls onClose when the close button is clicked", () => {
        const { onClose } = renderScanner();
        fireEvent.click(screen.getByRole("button", { name: /close/i }));
        expect(onClose).toHaveBeenCalled();
    });

    it("stops scanner on unmount", async () => {
        const { rerender } = renderScanner();
        rerender(
            <LanguageProvider initialLanguage="en">
                <BarcodeScanner open={false} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );
        await waitFor(() => {
            expect(mockStop).toHaveBeenCalled();
        });
    });

    it("renders correctly in Farsi (RTL)", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <BarcodeScanner open={true} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );
        expect(screen.getByText("اسکن بارکد")).toBeInTheDocument();
    });
});
