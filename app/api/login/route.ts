import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "../../../supabase";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "degistirilecek-guclu-bir-gizli-anahtar";

function createSessionToken(username: string, role: string) {
  const payload = JSON.stringify({
    username,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });

  const encodedPayload = Buffer.from(payload).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gerekli." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("login_app_user", {
      p_username: username,
      p_password: password,
    });

    if (error) {
      console.error("Login RPC error:", error);

      return NextResponse.json(
        { error: "Giriş sırasında bir hata oluştu." },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    const user = data[0];

    const token = createSessionToken(user.username, user.role);

    const response = NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
    });

    response.cookies.set("restoran_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}