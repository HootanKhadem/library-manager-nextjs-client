/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/src/app/api/book/[id]/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

describe("GET /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq(), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("requests the backend path with the given id and Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        await GET(makeReq("tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        const res = await GET(makeReq("tok"), ctx("42"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: 42, name: "Dune" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Book not found" }) });
        const res = await GET(makeReq("tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});

function makePutReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        method: "DELETE",
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("PUT /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await PUT(makePutReq({ name: "Dune" }), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("forwards the body to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        await PUT(makePutReq({ name: "Dune" }, "tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.method).toBe("PUT");
        expect(JSON.parse(opts.body)).toEqual({ name: "Dune" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Book not found" }) });
        const res = await PUT(makePutReq({ name: "Dune" }, "tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makePutReq({ name: "Dune" }, "tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});

describe("DELETE /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("tok"), ctx("42"));
        expect(res.status).toBe(204);
    });

    it("requests the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        await DELETE(makeDeleteReq("tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.method).toBe("DELETE");
    });

    it("propagates a 409 conflict from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 409, json: () => Promise.resolve({ message: "Book has lending history" }) });
        const res = await DELETE(makeDeleteReq("tok"), ctx("42"));
        expect(res.status).toBe(409);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});
