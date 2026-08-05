import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/api/book/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
