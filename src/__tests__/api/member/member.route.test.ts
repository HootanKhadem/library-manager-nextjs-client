/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/member/route";

function makeGetReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

function makePostReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("GET /api/member", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq());
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeGetReq("refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("proxies the 200 response from the backend", async () => {
        const members = [{ id: 1, name: "Lucas Martinez" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(members) });
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(members);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("access_token=tok"));
        expect(res.status).toBe(503);
    });
});

describe("POST /api/member", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makePostReq({ name: "Lucas Martinez" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        await POST(makePostReq({ name: "Lucas Martinez" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Lucas Martinez" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        const res = await POST(makePostReq({ name: "Lucas Martinez" }, "access_token=tok"));
        expect(res.status).toBe(201);
    });
});
