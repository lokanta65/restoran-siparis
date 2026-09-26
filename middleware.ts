import { NextRequest, NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "";

async function createSignature(payload: string) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return Buffer.from(signature).toString("base64url");
}

async function verifySession(token: string) {
  try {
    if (!SESSION_SECRET) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, signature] = parts;

    const expectedSignature = await createSignature(encodedPayload);

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isGarson = pathname.startsWith("/garson");
  const isYonetim = pathname.startsWith("/yonetim");
  const isMutfak = pathname.startsWith("/mutfak");

  // Koruma gerektirmeyen sayfalar
  if (!isGarson && !isYonetim && !isMutfak) {
    return NextResponse.next();
  }

  // Oturum kontrolü
  const token = request.cookies.get("restoran_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  const session = await verifySession(token);

  if (!session) {
    const response = NextResponse.redirect(
      new URL("/giris", request.url)
    );

    response.cookies.delete("restoran_session");

    return response;
  }

  // Yönetim paneline sadece admin girebilir
  if (isYonetim && session.role !== "admin") {
    return NextResponse.redirect(new URL("/garson", request.url));
  }

  // Garson paneline admin + garson girebilir
  if (isGarson && !["admin", "garson"].includes(session.role)) {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  // Mutfak paneline admin + mutfak girebilir
  if (isMutfak && !["admin", "mutfak"].includes(session.role)) {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/garson/:path*",
    "/yonetim/:path*",
    "/mutfak/:path*",
  ],
};