import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function POST(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(body),
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}

export async function GET(req: NextRequest) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const qs = req.nextUrl.searchParams.toString();

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book${qs ? `?${qs}` : ""}`, {
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
