import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let res: Response;
    try {
        res = await fetch(`${process.env.API_BASE_URL}/count-user-books`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server. Please try again." }, { status: 503 });
    }

    const data = await res.json().catch(() => 0);
    return NextResponse.json(data, { status: res.status });
}
