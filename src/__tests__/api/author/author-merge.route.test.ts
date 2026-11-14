/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as merge } from "@/src/app/api/author/merge/route";
import { POST as preview } from "@/src/app/api/author/merge/preview/route";

const body = { targetId: 1, sourceIds: [2, 3] };

function makeReq(path: string, cookies?: string): NextRequest {
    return new NextRequest(`http://localhost${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookies ? { Cookie: cookies } : {}) },
        body: JSON.stringify(body),
    });
}

describe.each([
    ["/api/author/merge", merge],
    ["/api/author/merge/preview", preview],
])("POST %s", (path, handler) => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 without auth cookies", async () => {
        expect((await handler(makeReq(path))).status).toBe(401);
    });

    it("forwards body and cookie to the backend and relays the response", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 1 }) });
        const res = await handler(makeReq(path, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`http://backend${path}`);
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual(body);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: 1 });
    });

    it("relays backend errors that have plain-text bodies", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.reject(new Error("not json")) });
        expect((await handler(makeReq(path, "access_token=tok"))).status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        expect((await handler(makeReq(path, "access_token=tok"))).status).toBe(503);
    });
});
