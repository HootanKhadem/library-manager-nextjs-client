import {cookies} from "next/headers";
import {getServerLanguage} from "@/src/lib/i18n/server";

jest.mock("next/headers", () => ({cookies: jest.fn()}));

function setCookies(values: Record<string, string>) {
    (cookies as jest.Mock).mockResolvedValue({get: (name: string) => (name in values ? {value: values[name]} : undefined)});
}

describe("getServerLanguage", () => {
    const realFetch = global.fetch;
    beforeEach(() => {
        process.env.API_BASE_URL = "http://backend";
        global.fetch = jest.fn() as jest.Mock;
    });
    afterEach(() => {
        global.fetch = realFetch;
        jest.resetAllMocks();
    });

    it("uses the language cookie without calling the backend", async () => {
        setCookies({"toumaar-lang": "fa", access_token: "x"});
        expect(await getServerLanguage()).toBe("fa");
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("ignores an invalid cookie value", async () => {
        setCookies({"toumaar-lang": "de"});
        expect(await getServerLanguage()).toBe("en");
    });

    it("falls back to the saved preference when signed in but there is no cookie", async () => {
        setCookies({access_token: "a", refresh_token: "r"});
        (global.fetch as jest.Mock).mockResolvedValue({ok: true, json: () => Promise.resolve({language: "fa"})});
        expect(await getServerLanguage()).toBe("fa");
        expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("http://backend/api/preferences");
    });

    it("returns English when signed out", async () => {
        setCookies({});
        expect(await getServerLanguage()).toBe("en");
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns English when the backend is unreachable", async () => {
        setCookies({refresh_token: "r"});
        (global.fetch as jest.Mock).mockRejectedValue(new Error("down"));
        expect(await getServerLanguage()).toBe("en");
    });
});
