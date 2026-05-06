import React from "react";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {BarcodeScanner} from "@/src/components/ui/BarcodeScanner";
import {LanguageProvider} from "@/src/lib/i18n/context";

// ---------------------------------------------------------------------------
// Mock react-barcode-scanner/polyfill (no-op side-effect import)
// ---------------------------------------------------------------------------
import {BarcodeScanner as Comp} from "react-barcode-scanner";

jest.mock("react-barcode-scanner/polyfill", () => ({}));

// ---------------------------------------------------------------------------
// Mock react-barcode-scanner — captures onCapture so tests can trigger it
// ---------------------------------------------------------------------------
type DetectedBarcode = { rawValue: string };
type OnCaptureFn = (barcodes: DetectedBarcode[]) => void;

let capturedOnCapture: OnCaptureFn | null = null;

jest.mock("react-barcode-scanner", () => ({
    BarcodeScanner: (props: { onCapture?: OnCaptureFn }) => {
        capturedOnCapture = props.onCapture ?? null;
        return React.createElement("div", {"data-testid": "scanner-view"});
    },
}));

// ---------------------------------------------------------------------------
// Mock next/dynamic — runs loader synchronously via require
// ---------------------------------------------------------------------------
jest.mock("next/dynamic", () => () => {
    return function DynamicWrapper(props: Record<string, unknown>) {
        
        return React.createElement(Comp, props);
    };
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

beforeEach(() => {
    capturedOnCapture = null;
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

    it("calls onScan with decoded value then calls onClose", async () => {
        const { onScan, onClose } = renderScanner();

        await act(async () => {
            capturedOnCapture?.([{rawValue: "9780141182605"}]);
        });

        expect(onScan).toHaveBeenCalledWith("9780141182605");
        expect(onClose).toHaveBeenCalled();
    });

    it("ignores empty barcode array", async () => {
        const {onScan} = renderScanner();

        await act(async () => {
            capturedOnCapture?.([]);
        });

        expect(onScan).not.toHaveBeenCalled();
    });

    it("ignores barcode with empty rawValue", async () => {
        const { onScan } = renderScanner();

        await act(async () => {
            capturedOnCapture?.([{rawValue: ""}]);
        });

        expect(onScan).not.toHaveBeenCalled();
    });

    it("only fires onScan once even if onCapture fires multiple times", async () => {
        const {onScan} = renderScanner();

        await act(async () => {
            capturedOnCapture?.([{rawValue: "9780141182605"}]);
            capturedOnCapture?.([{rawValue: "9780141182605"}]);
        });

        expect(onScan).toHaveBeenCalledTimes(1);
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
});
