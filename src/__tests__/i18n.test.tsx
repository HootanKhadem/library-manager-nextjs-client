/**
 * __tests__/i18n.test.tsx
 *
 * Tests for the internationalisation (i18n) layer:
 *  - LanguageProvider provides English by default
 *  - Switching to Farsi updates t values and dir
 *  - RTL dir attribute is applied to <html> and <body> on Farsi
 *  - LanguageSwitcher renders and switches language on click
 *  - interpolate() helper replaces {placeholder} tokens
 *  - Sidebar renders Farsi nav labels after switching to Farsi
 *  - Topbar renders Farsi page title after switching to Farsi
 *
 * MOCKS
 * -----
 * - next/image and next/link are mocked per project convention
 * - LanguageProvider is imported directly and used to wrap components,
 *   with initialLanguage prop to force a specific starting locale
 */

import React from "react";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {interpolate, LanguageProvider, useLanguage} from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import en from "@/lib/i18n/translations/en";
import fa from "@/lib/i18n/translations/fa";

// ─── Mocks required by next/image and next/link ───────────────────────────────
jest.mock("next/image", () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

jest.mock("next/link", () => ({
    __esModule: true,
    default: ({children, href}: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// ─── Helper component that exposes hook values via data-testid ────────────────
function LangDisplay() {
    const {language, dir, t} = useLanguage();
    return (
        <div>
            <span data-testid="lang">{language}</span>
            <span data-testid="dir">{dir}</span>
            <span data-testid="nav-dashboard">{t.sidebar.navDashboard}</span>
            <span data-testid="badge-owned">{t.badge.owned}</span>
        </div>
    );
}

// ─── interpolate() utility ───────────────────────────────────────────────────
describe("interpolate()", () => {
    it("replaces a single placeholder", () => {
        expect(interpolate("Hello {name}", {name: "World"})).toBe("Hello World");
    });

    it("replaces multiple occurrences of the same placeholder", () => {
        expect(interpolate("{x} and {x}", {x: "foo"})).toBe("foo and foo");
    });

    it("replaces multiple different placeholders", () => {
        expect(
            interpolate("Lent {title} to {person}", {title: "Ficciones", person: "Lucas"})
        ).toBe("Lent Ficciones to Lucas");
    });

    it("returns the template unchanged when no vars match", () => {
        expect(interpolate("No placeholders here", {})).toBe("No placeholders here");
    });

    it("works with the Farsi template", () => {
        // The Farsi lent subtitle has {count}
        const result = interpolate(fa.lent.subtitle, {count: "6"});
        expect(result).toContain("6");
        // The result should NOT contain the raw placeholder
        expect(result).not.toContain("{count}");
    });

    it("works with the English subtitle template", () => {
        const result = interpolate(en.books.subtitle, {count: "42"});
        expect(result).toBe("Your complete personal library — 42 volumes catalogued");
    });
});

// ─── LanguageProvider default (English) ──────────────────────────────────────
describe("LanguageProvider — English default", () => {
    it("provides language=en and dir=ltr by default", () => {
        render(
            <LanguageProvider>
                <LangDisplay/>
            </LanguageProvider>
        );
        expect(screen.getByTestId("lang").textContent).toBe("en");
        expect(screen.getByTestId("dir").textContent).toBe("ltr");
    });

    it("provides English translations", () => {
        render(
            <LanguageProvider>
                <LangDisplay/>
            </LanguageProvider>
        );
        expect(screen.getByTestId("nav-dashboard").textContent).toBe("Dashboard");
        expect(screen.getByTestId("badge-owned").textContent).toBe("Owned");
    });
});

// ─── LanguageProvider initialLanguage="fa" ───────────────────────────────────
describe("LanguageProvider — Farsi (RTL)", () => {
    it("provides language=fa and dir=rtl when initialLanguage=fa", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <LangDisplay/>
            </LanguageProvider>
        );
        expect(screen.getByTestId("lang").textContent).toBe("fa");
        expect(screen.getByTestId("dir").textContent).toBe("rtl");
    });

    it("provides Farsi translations", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <LangDisplay/>
            </LanguageProvider>
        );
        // The Farsi dashboard nav label
        expect(screen.getByTestId("nav-dashboard").textContent).toBe(fa.sidebar.navDashboard);
        // The Farsi badge label for "Owned"
        expect(screen.getByTestId("badge-owned").textContent).toBe(fa.badge.owned);
    });

    it("sets dir=rtl on document.documentElement after mounting", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <LangDisplay/>
            </LanguageProvider>
        );
        // LanguageProvider's useEffect sets this attribute on the html element
        expect(document.documentElement.getAttribute("dir")).toBe("rtl");
        expect(document.documentElement.getAttribute("lang")).toBe("fa");
    });

    it("adds font-vazirmatn class to document.body for Farsi", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <LangDisplay/>
            </LanguageProvider>
        );
        expect(document.body.classList.contains("font-vazirmatn")).toBe(true);
    });
});

// ─── setLanguage() switching ─────────────────────────────────────────────────
function SwitchTest() {
    const {language, dir, t, setLanguage} = useLanguage();
    return (
        <div>
            <span data-testid="lang">{language}</span>
            <span data-testid="dir">{dir}</span>
            <span data-testid="nav-label">{t.sidebar.navDashboard}</span>
            <button onClick={() => setLanguage("fa")}>switch-fa</button>
            <button onClick={() => setLanguage("en")}>switch-en</button>
        </div>
    );
}

describe("setLanguage() switching", () => {
    beforeEach(() => {
        // Reset html attrs before each test
        document.documentElement.removeAttribute("dir");
        document.documentElement.removeAttribute("lang");
        document.body.className = "";
    });

    it("switches from English to Farsi and updates dir", () => {
        render(
            <LanguageProvider>
                <SwitchTest/>
            </LanguageProvider>
        );
        expect(screen.getByTestId("lang").textContent).toBe("en");

        act(() => {
            fireEvent.click(screen.getByText("switch-fa"));
        });

        expect(screen.getByTestId("lang").textContent).toBe("fa");
        expect(screen.getByTestId("dir").textContent).toBe("rtl");
        expect(screen.getByTestId("nav-label").textContent).toBe(fa.sidebar.navDashboard);
    });

    it("switches back to English and restores ltr", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <SwitchTest/>
            </LanguageProvider>
        );
        act(() => {
            fireEvent.click(screen.getByText("switch-en"));
        });
        expect(screen.getByTestId("lang").textContent).toBe("en");
        expect(screen.getByTestId("dir").textContent).toBe("ltr");
        expect(screen.getByTestId("nav-label").textContent).toBe(en.sidebar.navDashboard);
    });

    it("removes font-vazirmatn class when switching back to English", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <SwitchTest/>
            </LanguageProvider>
        );
        expect(document.body.classList.contains("font-vazirmatn")).toBe(true);

        act(() => {
            fireEvent.click(screen.getByText("switch-en"));
        });

        expect(document.body.classList.contains("font-vazirmatn")).toBe(false);
    });
});

// ─── LanguageSwitcher component ───────────────────────────────────────────────
describe("LanguageSwitcher component", () => {
    it("renders buttons for all registered languages", () => {
        render(
            <LanguageProvider>
                <LanguageSwitcher/>
            </LanguageProvider>
        );
        // English and Farsi buttons should both be visible
        expect(screen.getByRole("button", {name: /English/i})).toBeInTheDocument();
        // Farsi native name
        expect(screen.getByRole("button", {name: /Switch to \u0641\u0627\u0631\u0633\u06CC/i})).toBeInTheDocument();
    });

    it("marks the active language button as pressed", () => {
        render(
            <LanguageProvider initialLanguage="en">
                <LanguageSwitcher/>
            </LanguageProvider>
        );
        const enBtn = screen.getByRole("button", {name: /Switch to English/i});
        expect(enBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("calls setLanguage when a language button is clicked", () => {
        render(
            <LanguageProvider>
                <LanguageSwitcher/>
                <LangDisplay/>
            </LanguageProvider>
        );
        expect(screen.getByTestId("lang").textContent).toBe("en");

        act(() => {
            // Click the Farsi button
            fireEvent.click(screen.getByRole("button", {name: /Switch to \u0641\u0627\u0631\u0633\u06CC/i}));
        });

        expect(screen.getByTestId("lang").textContent).toBe("fa");
        expect(screen.getByTestId("dir").textContent).toBe("rtl");
    });
});

// ─── Sidebar: Farsi labels ────────────────────────────────────────────────────
describe("Sidebar i18n", () => {
    const defaultProps = {
        activePage: "dashboard" as const,
        onNavigate: jest.fn(),
        isOpen: false,
        onClose: jest.fn(),
        onAddBook: jest.fn(),
    };

    it("renders English nav labels by default", () => {
        render(
            <LanguageProvider>
                <Sidebar {...defaultProps} />
            </LanguageProvider>
        );
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("All Books")).toBeInTheDocument();
    });

    it("renders Farsi nav labels when language is Farsi", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <Sidebar {...defaultProps} />
            </LanguageProvider>
        );
        // fa.sidebar.navDashboard = "داشبورد"
        expect(screen.getByText(fa.sidebar.navDashboard)).toBeInTheDocument();
        expect(screen.getByText(fa.sidebar.navAllBooks)).toBeInTheDocument();
        expect(screen.getByText(fa.sidebar.addNewBook)).toBeInTheDocument();
    });
});

// ─── Topbar: Farsi page titles ────────────────────────────────────────────────
describe("Topbar i18n", () => {
    const defaultProps = {
        activePage: "dashboard" as const,
        onMenuToggle: jest.fn(),
        searchQuery: "",
        onSearchChange: jest.fn(),
    };

    it("renders English title by default", () => {
        render(
            <LanguageProvider>
                <Topbar {...defaultProps} />
            </LanguageProvider>
        );
        // en.topbar.pages.dashboard = ["Dashboard", "Overview"]
        expect(screen.getByTestId("topbar-title")).toHaveTextContent("Dashboard");
    });

    it("renders Farsi title when language is Farsi", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <Topbar {...defaultProps} />
            </LanguageProvider>
        );
        // fa.topbar.pages.dashboard = ["داشبورد", "نمای کلی"]
        const [faTitle] = fa.topbar.pages.dashboard;
        expect(screen.getByTestId("topbar-title")).toHaveTextContent(faTitle);
    });

    it("renders Farsi search placeholder when language is Farsi", () => {
        render(
            <LanguageProvider initialLanguage="fa">
                <Topbar {...defaultProps} />
            </LanguageProvider>
        );
        const input = screen.getByRole("searchbox") ?? screen.getByPlaceholderText(fa.common.searchPlaceholder);
        expect(input).toBeInTheDocument();
    });
});

// ─── Translation file completeness ───────────────────────────────────────────
describe("Translation completeness", () => {
    it("Farsi translation has all top-level keys that English has", () => {
        const enKeys = Object.keys(en).sort();
        const faKeys = Object.keys(fa).sort();
        expect(faKeys).toEqual(enKeys);
    });

    it("Farsi common section has all keys that English common has", () => {
        const enKeys = Object.keys(en.common).sort();
        const faKeys = Object.keys(fa.common).sort();
        expect(faKeys).toEqual(enKeys);
    });

    it("Farsi sidebar section has all keys that English sidebar has", () => {
        const enKeys = Object.keys(en.sidebar).sort();
        const faKeys = Object.keys(fa.sidebar).sort();
        expect(faKeys).toEqual(enKeys);
    });

    it("Farsi addBook.genres has all keys that English addBook.genres has", () => {
        const enKeys = Object.keys(en.addBook.genres).sort();
        const faKeys = Object.keys(fa.addBook.genres).sort();
        expect(faKeys).toEqual(enKeys);
    });
});
