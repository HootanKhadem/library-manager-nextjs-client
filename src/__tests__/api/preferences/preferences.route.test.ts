/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, PUT } from "@/src/app/api/preferences/route";

function makeGetReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/preferences", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

function makePutReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/preferences", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("GET /api/preferences", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeGetReq());
        expect(res.status).toBe(401);
    });

    it("proxies the 200 response from the backend", async () => {
        const prefs = { libraryName: "My Library", defaultLoanDurationDays: 30, dateFormat: "DD MMM YYYY", language: "en" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(prefs) });
        const res = await GET(makeGetReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(prefs);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("tok"));
        expect(res.status).toBe(503);
    });
});

describe("PUT /api/preferences", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await PUT(makePutReq({ libraryName: "My Library" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ libraryName: "My Library" }) });
        await PUT(makePutReq({ libraryName: "My Library" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/preferences");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ libraryName: "My Library" });
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ libraryName: "My Library" }) });
        const res = await PUT(makePutReq({ libraryName: "My Library" }, "tok"));
        expect(res.status).toBe(200);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makePutReq({ libraryName: "My Library" }, "tok"));
        expect(res.status).toBe(503);
    });
});
