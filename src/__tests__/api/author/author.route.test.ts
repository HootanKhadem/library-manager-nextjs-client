/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/author/route";

function makeReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/author", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makeReq({ name: "Borges", image: "" }));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        const res = await POST(makeReq({ name: "Borges", image: "" }, "refresh_token=rtok"));
        expect(res.status).toBe(201);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        await POST(makeReq({ name: "Borges", image: "" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(opts.headers.Authorization).toBeUndefined();
        expect(JSON.parse(opts.body)).toEqual({ name: "Borges", image: "" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        const res = await POST(makeReq({ name: "Borges", image: "" }, "access_token=tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Borges" });
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Borges", image: "" }, "access_token=tok"));
        expect(res.status).toBe(503);
    });
});

function makeGetReq(url: string, cookies?: string): NextRequest {
    return new NextRequest(url, {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeGetReq("http://localhost/api/author"));
        expect(res.status).toBe(401);
    });

    it("forwards page and pageSize query params and the Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/author?page=2&pageSize=20", "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author?page=2&pageSize=20");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const page = { items: [{ id: 1, name: "Jorge Luis Borges" }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(page) });
        const res = await GET(makeGetReq("http://localhost/api/author?page=1&pageSize=20", "access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(page);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("http://localhost/api/author", "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
