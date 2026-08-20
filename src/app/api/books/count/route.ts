import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/count-user-books`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => 0);
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
