/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/book/route";

function makeReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/book", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/book", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makeReq({ name: "Dune" }));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present (no access_token)", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        const res = await POST(makeReq({ name: "Dune" }, "refresh_token=rtok"));
        expect(res.status).toBe(201);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        await POST(makeReq({ name: "Dune" }, "access_token=tok; refresh_token=rtok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book");
        expect(opts.headers.Cookie).toBe("access_token=tok; refresh_token=rtok");
        expect(opts.headers.Authorization).toBeUndefined();
        expect(JSON.parse(opts.body)).toEqual({ name: "Dune" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        const res = await POST(makeReq({ name: "Dune" }, "access_token=tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Dune" });
    });

    it("relays a refreshed access_token cookie from the backend response", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 1, name: "Dune" }),
            headers: { getSetCookie: () => ["access_token=newtok; Path=/; Secure; HttpOnly; SameSite=None"] },
        });
        const res = await POST(makeReq({ name: "Dune" }, "refresh_token=rtok"));
        expect(res.cookies.get("access_token")?.value).toBe("newtok");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Dune" }, "access_token=tok"));
        expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });

    it("propagates a non-2xx status from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Invalid book" }) });
        const res = await POST(makeReq({ name: "" }, "access_token=tok"));
        expect(res.status).toBe(400);
    });
});

function makeGetReq(url: string, cookies?: string): NextRequest {
    return new NextRequest(url, {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/book", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq("http://localhost/api/book"));
        expect(res.status).toBe(401);
    });

    it("forwards page and pageSize query params and the Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/book?page=2&pageSize=20", "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book?page=2&pageSize=20");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("requests the backend with no query string when none is given", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/book", "access_token=tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book");
    });

    it("proxies the 200 response from the backend", async () => {
        const page = { items: [{ id: 1, name: "Dune" }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(page) });
        const res = await GET(makeGetReq("http://localhost/api/book?page=1&pageSize=20", "access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(page);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("http://localhost/api/book", "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
