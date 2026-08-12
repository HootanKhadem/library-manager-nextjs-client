/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/src/app/api/author/route";

function makeReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/author", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makeReq({ name: "Borges", image: "" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        await POST(makeReq({ name: "Borges", image: "" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Borges", image: "" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Borges" }) });
        const res = await POST(makeReq({ name: "Borges", image: "" }, "tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Borges" });
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Borges", image: "" }, "tok"));
        expect(res.status).toBe(503);
    });
});

function makeGetReq(url: string, token?: string): NextRequest {
    return new NextRequest(url, {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/author", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeGetReq("http://localhost/api/author"));
        expect(res.status).toBe(401);
    });

    it("forwards page and pageSize query params to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 1 }) });
        await GET(makeGetReq("http://localhost/api/author?page=2&pageSize=20", "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author?page=2&pageSize=20");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const page = { items: [{ id: 1, name: "Jorge Luis Borges" }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(page) });
        const res = await GET(makeGetReq("http://localhost/api/author?page=1&pageSize=20", "tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(page);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeGetReq("http://localhost/api/author", "tok"));
        expect(res.status).toBe(503);
    });
});
