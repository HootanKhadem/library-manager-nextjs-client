/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/admin/users/route";

function makeReq(body: object, token?: string): NextRequest {
    return new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Cookie: `access_token=${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/admin/users", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }));
        expect(res.status).toBe(401);
    });

    it("forwards the request body to backend /admin/users with a Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "New User" }) });
        await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/admin/users");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 201 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 1, name: "New User" }) });
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        expect(res.status).toBe(201);
    });

    it("propagates a 403 from the backend when the caller isn't an admin", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: () => Promise.resolve({ message: "Forbidden" }) });
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        expect(res.status).toBe(403);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ name: "New User", email: "n@u.com", password: "pw", role: "USER" }, "tok"));
        expect(res.status).toBe(503);
    });
});
