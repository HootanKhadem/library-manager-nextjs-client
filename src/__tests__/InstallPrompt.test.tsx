import {fireEvent, render, screen} from "@testing-library/react";
import {LanguageProvider} from "@/src/lib/i18n/context";
import {InstallPrompt} from "@/src/components/InstallPrompt";

function setUserAgent(ua: string, platform = "Linux", maxTouchPoints = 0) {
    Object.defineProperty(navigator, "userAgent", {value: ua, configurable: true});
    Object.defineProperty(navigator, "platform", {value: platform, configurable: true});
    Object.defineProperty(navigator, "maxTouchPoints", {value: maxTouchPoints, configurable: true});
}

function renderPrompt() {
    return render(
        <LanguageProvider>
            <InstallPrompt/>
        </LanguageProvider>
    );
}

describe("InstallPrompt", () => {
    const androidUa = "Mozilla/5.0 (Linux; Android 14) Chrome/120";
    const iosUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";

    beforeEach(() => {
        localStorage.clear();
        setUserAgent(androidUa);
    });

    it("renders nothing until a platform signal arrives", () => {
        renderPrompt();
        expect(screen.queryByTestId("install-prompt")).not.toBeInTheDocument();
    });

    it("shows the Android banner with an Install button after beforeinstallprompt fires", () => {
        renderPrompt();
        const event = new Event("beforeinstallprompt", {cancelable: true}) as Event & {
            prompt: () => Promise<void>;
            userChoice: Promise<{ outcome: string }>;
        };
        event.prompt = jest.fn().mockResolvedValue(undefined);
        event.userChoice = Promise.resolve({outcome: "accepted"});
        fireEvent(window, event);

        expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Install"})).toBeInTheDocument();
    });

    it("calls prompt() and dismisses when Install is clicked", async () => {
        renderPrompt();
        const promptFn = jest.fn().mockResolvedValue(undefined);
        const event = new Event("beforeinstallprompt", {cancelable: true}) as Event & {
            prompt: () => Promise<void>;
            userChoice: Promise<{ outcome: string }>;
        };
        event.prompt = promptFn;
        event.userChoice = Promise.resolve({outcome: "accepted"});
        fireEvent(window, event);

        fireEvent.click(screen.getByRole("button", {name: "Install"}));
        await Promise.resolve();
        await Promise.resolve();

        expect(promptFn).toHaveBeenCalledTimes(1);
    });

    it("shows iOS instructions instead of an Install button on iOS Safari", () => {
        setUserAgent(iosUa);
        renderPrompt();
        expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Install"})).not.toBeInTheDocument();
    });

    it("does not render again after the user dismisses it", () => {
        setUserAgent(iosUa);
        renderPrompt();
        fireEvent.click(screen.getByRole("button", {name: "Not now"}));
        expect(screen.queryByTestId("install-prompt")).not.toBeInTheDocument();

        localStorage.setItem("pwa-install-dismissed", "1");
        const {unmount} = renderPrompt();
        expect(screen.queryByTestId("install-prompt")).not.toBeInTheDocument();
        unmount();
    });
});
