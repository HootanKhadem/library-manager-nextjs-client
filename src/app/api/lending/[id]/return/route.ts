import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/lending/${id}/return`, {
            method: "PUT",
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
