/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/book/route";

function makeReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/book", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makeReq({ name: "Dune" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        await POST(makeReq({ name: "Dune" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book");
        expect(opts.headers.Authorization).toBe("Bearer tok");
        expect(JSON.parse(opts.body)).toEqual({ name: "Dune" });
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "Dune" }) });
        const res = await POST(makeReq({ name: "Dune" }, "tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ id: 1, name: "Dune" });
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "Dune" }, "tok"));
        expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });

    it("propagates a non-2xx status from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Invalid book" }) });
        const res = await POST(makeReq({ name: "" }, "tok"));
        expect(res.status).toBe(400);
    });
});
