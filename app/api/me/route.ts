import { NextResponse } from "next/server";
import crypto from "crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "degistirilecek-guclu-bir-gizli-anahtar";

function verifySession(token: string) {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );

    if (!payload.username || !payload.role || !payload.exp) {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const match = cookieHeader.match(
      /(?:^|;\s*)restoran_session=([^;]+)/
    );

    if (!match) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const session = verifySession(
      decodeURIComponent(match[1])
    );

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      username: session.username,
      role: session.role,
    });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}