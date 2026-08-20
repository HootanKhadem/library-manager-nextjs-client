import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieHeader, relayRefreshedAccessToken } from "@/src/app/api/_authFetch";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre/${id}`, {
            method: "PUT",
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

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const cookieHeader = buildAuthCookieHeader(req);
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/genre/${id}`, {
            method: "DELETE",
            headers: { Cookie: cookieHeader },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    if (res.status === 204) {
        const response = new NextResponse(null, { status: 204 });
        relayRefreshedAccessToken(req, res, response);
        return response;
    }
    const data = await res.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: res.status });
    relayRefreshedAccessToken(req, res, response);
    return response;
}
