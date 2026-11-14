import fs from "fs";
import path from "path";
import {cookies} from "next/headers";
import RootLayout from "@/src/app/layout";

jest.mock("next/headers", () => ({cookies: jest.fn()}));
jest.mock("next/font/google", () => ({
    Plus_Jakarta_Sans: () => ({variable: "jakarta"}),
    Vazirmatn: () => ({variable: "vazir"}),
}));
jest.mock("@/src/app/globals.css", () => ({}), {virtual: true});
jest.mock("@/src/components/PwaRegistration", () => ({PwaRegistration: () => null}));

function setCookie(value?: string) {
    (cookies as jest.Mock).mockResolvedValue({get: (n: string) => (n === "toumaar-lang" && value ? {value} : undefined)});
}

describe("RootLayout", () => {
    afterEach(() => jest.resetAllMocks());

    it("renders html lang/dir and the Farsi font from the language cookie", async () => {
        setCookie("fa");
        const html = await RootLayout({children: null});
        expect(html.props.lang).toBe("fa");
        expect(html.props.dir).toBe("rtl");
        expect(html.props.children.props.className).toContain("font-vazirmatn");
    });

    it("defaults to English / ltr", async () => {
        setCookie(undefined);
        const html = await RootLayout({children: null});
        expect(html.props.lang).toBe("en");
        expect(html.props.dir).toBe("ltr");
    });
});

// Jest loads every module as plain JS, so it cannot see Next's server/client boundary. That is how
// importing LANGUAGE_META from the "use client" context module crashed production with a 500 while
// all tests passed. Guard the specific rule: server code must take the data from a non-client module.
describe("server/client boundary", () => {
    const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

    it("the root layout does not import language metadata from the client context module", () => {
        expect(read("src/app/layout.tsx")).not.toMatch(/LANGUAGE_META[^;]*from\s+["']@\/src\/lib\/i18n\/context["']/);
    });

    it("the metadata module and the server language helpers are not client modules", () => {
        for (const file of ["src/lib/i18n/meta.ts", "src/lib/i18n/server.ts", "src/lib/i18n/cookie.ts"]) {
            expect(read(file)).not.toMatch(/^\s*["']use client["']/);
        }
    });
});
