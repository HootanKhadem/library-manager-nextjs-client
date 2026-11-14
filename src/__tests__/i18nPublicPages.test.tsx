import {render, screen, fireEvent} from "@testing-library/react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/src/contexts/AuthContext";
import {LanguageProvider} from "@/src/lib/i18n/context";
import LoginPage from "@/src/app/login/page";
import SignupPage from "@/src/app/signup/page";
import {MarketingHeader} from "@/src/app/(marketing)/_components/MarketingHeader";
import {MarketingFooter} from "@/src/app/(marketing)/_components/MarketingFooter";
import {AboutContent} from "@/src/app/(marketing)/_components/AboutContent";
import {TermsContent} from "@/src/app/(marketing)/_components/TermsContent";
import en from "@/src/lib/i18n/translations/en";
import fa from "@/src/lib/i18n/translations/fa";

jest.mock("next/navigation", () => ({useRouter: jest.fn()}));
jest.mock("@/src/contexts/AuthContext", () => ({useAuth: jest.fn()}));

function setup() {
    (useAuth as jest.Mock).mockReturnValue({isAuthenticated: false, hydrated: true, login: jest.fn(), signup: jest.fn()});
    (useRouter as jest.Mock).mockReturnValue({replace: jest.fn(), push: jest.fn()});
    global.fetch = jest.fn(() => Promise.reject(new Error("offline"))) as jest.Mock;
}

const inLanguage = (ui: React.ReactElement, language: "en" | "fa") =>
    render(<LanguageProvider initialLanguage={language}>{ui}</LanguageProvider>);

describe("public pages follow the selected language", () => {
    beforeEach(setup);

    it("login page renders in Farsi", () => {
        inLanguage(<LoginPage/>, "fa");
        expect(screen.getByRole("heading", {name: fa.auth.welcomeBack})).toBeInTheDocument();
        expect(screen.getByLabelText(fa.auth.emailLabel)).toBeInTheDocument();
        expect(screen.queryByText(en.auth.welcomeBack)).not.toBeInTheDocument();
    });

    it("signup page renders in Farsi, including password requirements", () => {
        inLanguage(<SignupPage/>, "fa");
        expect(screen.getByRole("heading", {name: fa.auth.createTitle})).toBeInTheDocument();
        expect(screen.getByText(fa.auth.reqLength)).toBeInTheDocument();
    });

    it("login page shows a localized validation error", () => {
        inLanguage(<LoginPage/>, "fa");
        fireEvent.click(screen.getByRole("button", {name: fa.auth.signIn}));
        expect(screen.getByRole("alert")).toHaveTextContent(fa.auth.errEnterCredentials);
    });

    it("the language toggle on the login page switches language and remembers it in a cookie", () => {
        inLanguage(<LoginPage/>, "en");
        fireEvent.click(screen.getByRole("button", {name: "فارسی"}));
        expect(screen.getByRole("heading", {name: fa.auth.welcomeBack})).toBeInTheDocument();
        expect(document.cookie).toContain("toumaar-lang=fa");
        expect(document.documentElement.getAttribute("dir")).toBe("rtl");
        fireEvent.click(screen.getByRole("button", {name: "English"}));
        expect(screen.getByRole("heading", {name: en.auth.welcomeBack})).toBeInTheDocument();
        expect(document.cookie).toContain("toumaar-lang=en");
    });

    it("marketing header, footer, about and terms render in Farsi", () => {
        inLanguage(<><MarketingHeader/><AboutContent/><TermsContent/><MarketingFooter/></>, "fa");
        expect(screen.getAllByText(fa.marketing.navAbout).length).toBeGreaterThan(0);
        expect(screen.getByRole("heading", {name: fa.marketing.aboutTitle})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: fa.marketing.termsTitle})).toBeInTheDocument();
        expect(screen.getByText(fa.marketing.footerTagline)).toBeInTheDocument();
    });
});

describe("translation completeness", () => {
    const keys = (o: object, prefix = ""): string[] =>
        Object.entries(o).flatMap(([k, v]) =>
            typeof v === "object" && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
        );

    it("Farsi has exactly the same keys as English, none empty", () => {
        expect(keys(fa).sort()).toEqual(keys(en).sort());
        const empty = keys(fa).filter((k) => k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], fa) === "");
        expect(empty).toEqual([]);
    });
});
