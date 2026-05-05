import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {BrowserMultiFormatReader} from "@zxing/browser";
import {BarcodeFormat, DecodeHintType} from "@zxing/library";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";
import {LanguageProvider} from "@/src/lib/i18n/context";

// ---------------------------------------------------------------------------
// Mock @zxing/browser
// ---------------------------------------------------------------------------
jest.mock("@zxing/browser", () => ({
    BrowserMultiFormatReader: jest.fn(),
}));

const MockReader = BrowserMultiFormatReader as jest.MockedClass<typeof BrowserMultiFormatReader>;

let mockDecodeFromCanvas: jest.Mock;
let mockTrackStop: jest.Mock;
let mockGetUserMedia: jest.Mock;

function makeStream(): MediaStream {
    mockTrackStop = jest.fn();
    const track = {stop: mockTrackStop} as unknown as MediaStreamTrack;
    return {getTracks: () => [track]} as unknown as MediaStream;
}

beforeEach(() => {
    jest.useFakeTimers();

    Object.defineProperty(window, "isSecureContext", {value: true, configurable: true});

    mockGetUserMedia = jest.fn().mockResolvedValue(makeStream());
    Object.defineProperty(navigator, "mediaDevices", {
        value: {getUserMedia: mockGetUserMedia},
        configurable: true,
        writable: true,
    });

    HTMLVideoElement.prototype.play = jest.fn().mockResolvedValue(undefined);

    const mockCtx = {drawImage: jest.fn()};
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCtx) as typeof HTMLCanvasElement.prototype.getContext;

    const notFound = Object.assign(new Error("NotFoundException"), {name: "NotFoundException"});
    mockDecodeFromCanvas = jest.fn().mockImplementation(() => {
        throw notFound;
    });
    MockReader.mockImplementation(() => ({
        decodeFromCanvas: mockDecodeFromCanvas,
    }) as unknown as BrowserMultiFormatReader);
});

afterEach(() => {
    jest.useRealTimers();
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

// Simulate: getUserMedia resolves → loadedmetadata fires → interval ticks → decodeFromCanvas settles
async function triggerScan() {
    // Flush getUserMedia promise → .then() runs, sets video.srcObject and onloadedmetadata
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });

    const video = screen.getByTestId("barcode-video") as HTMLVideoElement;
    Object.defineProperty(video, "readyState", {get: () => 4, configurable: true});
    Object.defineProperty(video, "videoWidth", {get: () => 640, configurable: true});
    Object.defineProperty(video, "videoHeight", {get: () => 480, configurable: true});

    // Fire loadedmetadata → starts setInterval
    fireEvent(video, new Event("loadedmetadata"));

    // Advance 100ms → interval callback fires (decodeFromCanvas is synchronous)
    await act(async () => {
        jest.advanceTimersByTime(100);
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

    it("calls onScan with decoded text and then calls onClose", async () => {
        mockDecodeFromCanvas.mockReturnValueOnce({getText: () => "9780141182605"});
        const { onScan, onClose } = renderScanner();
        await triggerScan();
        expect(onScan).toHaveBeenCalledWith("9780141182605");
        expect(onClose).toHaveBeenCalled();
    });

    it("stops stream tracks after successful scan", async () => {
        mockDecodeFromCanvas.mockReturnValueOnce({getText: () => "9780141182605"});
        renderScanner();
        await triggerScan();
        expect(mockTrackStop).toHaveBeenCalled();
    });

    it("does not call onScan when no barcode found (NotFoundException)", async () => {
        const { onScan } = renderScanner();
        await triggerScan();
        expect(onScan).not.toHaveBeenCalled();
    });

    it("shows permission denied message when camera is blocked", async () => {
        const err = new Error("Permission denied");
        err.name = "NotAllowedError";
        mockGetUserMedia.mockRejectedValue(err);

        renderScanner();
        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent(/camera access denied/i);
        });
    });

    it("shows generic error message for other camera errors", async () => {
        mockGetUserMedia.mockRejectedValue(new Error("Device not found"));

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

    it("stops stream tracks on unmount / close", async () => {
        const { rerender } = renderScanner();
        // Let getUserMedia resolve so stream is captured
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        rerender(
            <LanguageProvider initialLanguage="en">
                <BarcodeScanner open={false} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );
        expect(mockTrackStop).toHaveBeenCalled();
    });

    it("renders correctly in Farsi (RTL)", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <BarcodeScanner open={true} onClose={jest.fn()} onScan={jest.fn()} />
            </LanguageProvider>
        );
        expect(screen.getByText("اسکن بارکد")).toBeInTheDocument();
    });

    it("initializes reader with TRY_HARDER and barcode formats", () => {
        renderScanner();
        expect(MockReader).toHaveBeenCalled();
        const hints = MockReader.mock.calls[0][0] as Map<DecodeHintType, unknown>;
        expect(hints.get(DecodeHintType.TRY_HARDER)).toBe(true);
        const formats = hints.get(DecodeHintType.POSSIBLE_FORMATS) as BarcodeFormat[];
        expect(formats).toContain(BarcodeFormat.QR_CODE);
        expect(formats).toContain(BarcodeFormat.EAN_13);
        expect(formats).toContain(BarcodeFormat.CODE_128);
    });

    it("does not call getUserMedia in insecure context", () => {
        Object.defineProperty(window, "isSecureContext", {value: false, configurable: true});
        renderScanner();
        expect(mockGetUserMedia).not.toHaveBeenCalled();
    });
});
