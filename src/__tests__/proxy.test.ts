/** @jest-environment node */
import { NextRequest } from "next/server";
import { proxy } from "@/src/proxy";

function makeReq(pathname: string, cookies?: string): NextRequest {
    return new NextRequest(`http://localhost${pathname}`, {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("proxy", () => {
    it("redirects to /login when both access_token and refresh_token are absent on a protected path", () => {
        const res = proxy(makeReq("/dashboard"));
        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toBe("http://localhost/login");
    });

    it("allows the request through when only access_token is present", () => {
        const res = proxy(makeReq("/dashboard", "access_token=tok"));
        expect(res.headers.get("location")).toBeNull();
    });

    it("allows the request through when only refresh_token is present (access_token expired and purged)", () => {
        const res = proxy(makeReq("/dashboard", "refresh_token=rtok"));
        expect(res.headers.get("location")).toBeNull();
    });

    it("allows the request through when both cookies are present", () => {
        const res = proxy(makeReq("/dashboard", "access_token=tok; refresh_token=rtok"));
        expect(res.headers.get("location")).toBeNull();
    });

    it("does not gate unprotected paths even with no cookies", () => {
        const res = proxy(makeReq("/login"));
        expect(res.headers.get("location")).toBeNull();
    });
});
