import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";
import {LanguageProvider} from "@/src/lib/i18n/context";

// ---------------------------------------------------------------------------
// Mock @ericblade/quagga2 (dynamic import)
// ---------------------------------------------------------------------------
type QuaggaInitCb = (err: Error | null) => void;
type QuaggaDetectedCb = (result: { codeResult: { code: string } }) => void;

let mockInit: jest.Mock;
let mockStart: jest.Mock;
let mockStop: jest.Mock;
let mockOnDetected: jest.Mock;
let capturedDetectedCb: QuaggaDetectedCb | null = null;

jest.mock("@ericblade/quagga2", () => ({
    __esModule: true,
    default: {
        get init() {
            return mockInit;
        },
        get start() {
            return mockStart;
        },
        get stop() {
            return mockStop;
        },
        get onDetected() {
            return mockOnDetected;
        },
    },
}));

beforeEach(() => {
    capturedDetectedCb = null;

    Object.defineProperty(window, "isSecureContext", {value: true, configurable: true});

    mockInit = jest.fn((_config: unknown, cb: QuaggaInitCb) => cb(null));
    mockStart = jest.fn();
    mockStop = jest.fn();
    mockOnDetected = jest.fn((cb: QuaggaDetectedCb) => {
        capturedDetectedCb = cb;
    });
});

afterEach(() => {
    jest.clearAllMocks();
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

// Flush dynamic import + init callback + state updates
async function flushInit() {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    });
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

    it("initializes and starts Quagga on open", async () => {
        renderScanner();
        await flushInit();
        expect(mockInit).toHaveBeenCalled();
        expect(mockStart).toHaveBeenCalled();
    });

    it("calls onScan with decoded text then calls onClose", async () => {
        const { onScan, onClose } = renderScanner();
        await flushInit();

        await act(async () => {
            capturedDetectedCb?.({codeResult: {code: "9780141182605"}});
        });

        expect(onScan).toHaveBeenCalledWith("9780141182605");
        expect(onClose).toHaveBeenCalled();
    });

    it("stops Quagga after successful scan", async () => {
        renderScanner();
        await flushInit();

        await act(async () => {
            capturedDetectedCb?.({codeResult: {code: "9780141182605"}});
        });

        expect(mockStop).toHaveBeenCalled();
    });

    it("ignores empty code results", async () => {
        const { onScan } = renderScanner();
        await flushInit();

        await act(async () => {
            capturedDetectedCb?.({codeResult: {code: ""}});
        });

        expect(onScan).not.toHaveBeenCalled();
    });

    it("shows permission denied message when camera is blocked", async () => {
        const err = new Error("Permission denied");
        err.name = "NotAllowedError";
        mockInit = jest.fn((_config: unknown, cb: QuaggaInitCb) => cb(err));

        renderScanner();
        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent(/camera access denied/i);
        });
    });

    it("shows generic error message for other init errors", async () => {
        mockInit = jest.fn((_config: unknown, cb: QuaggaInitCb) => cb(new Error("Device not found")));

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

    it("stops Quagga on unmount after init", async () => {
        const { rerender } = renderScanner();
        await flushInit();

        rerender(
            <LanguageProvider initialLanguage="en">
                <BarcodeScanner open={false} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );

        await flushInit();
        expect(mockStop).toHaveBeenCalled();
    });

    it("renders correctly in Farsi (RTL)", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <BarcodeScanner open={true} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );
        expect(screen.getByText("اسکن بارکد")).toBeInTheDocument();
    });

    it("does not call getUserMedia / init in insecure context", async () => {
        Object.defineProperty(window, "isSecureContext", {value: false, configurable: true});
        renderScanner();
        await flushInit();
        expect(mockInit).not.toHaveBeenCalled();
    });
});
