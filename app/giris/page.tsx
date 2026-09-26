"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GirisPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  /* =========================================================
     SAAT
  ========================================================= */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     GİRİŞ
  ========================================================= */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Kullanıcı adı veya şifre hatalı.");
        return;
      }

      if (data.role === "admin") {
        router.push("/yonetim");
      } else if (data.role === "garson") {
        router.push("/garson");
      } else if (data.role === "mutfak") {
        router.push("/mutfak");
      } else {
        setError("Kullanıcı rolü geçersiz.");
      }
    } catch (error) {
      console.error(error);
      setError("Giriş sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#071521] select-none">

      {/* =====================================================
          ARKA PLAN - VAN GÖLÜ / AKDAMAR ADASI
      ====================================================== */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage:
            "url('https://commons.wikimedia.org/wiki/Special:Redirect/file/00%203385%20Akdamar%20Island%20-%20Lake%20Van.jpg')",
        }}
      />

      {/* Fotoğrafı koyulaştıran katman */}
      <div className="absolute inset-0 bg-[#061522]/55" />

      {/* Sol tarafta daha koyu alan */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#04111c]/95 via-[#071a2a]/75 to-[#071521]/35" />

      {/* Alt kısım karartma */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#04101a]/80 to-transparent" />

      {/* =====================================================
          ORTA BÜYÜK JANDARMA AMBLEMİ
      ====================================================== */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 opacity-[0.075] lg:block">
        <img
          src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Emblem_of_the_Turkish_Gendarmerie.png"
          alt=""
          className="h-[620px] w-[510px] object-contain grayscale brightness-200"
        />
      </div>

      {/* İnce dekoratif çizgi */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px bg-white/10 lg:block" />

      {/* =====================================================
          ANA İÇERİK
      ====================================================== */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-8 sm:px-8 lg:px-12">

        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_430px] lg:gap-20">

          {/* =================================================
              SOL TARAF
          ================================================== */}
          <section className="flex flex-col justify-center text-white">

            {/* ÜST KURUMSAL ALAN */}
            <div className="mb-8 flex items-center gap-5">

              {/* Gerçek Jandarma Amblemi */}
              <div className="flex h-28 w-24 items-center justify-center rounded-2xl border border-white/20 bg-[#061421]/65 p-3 shadow-2xl backdrop-blur-md">
                <img
                  src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Emblem_of_the_Turkish_Gendarmerie.png"
                  alt="Jandarma Genel Komutanlığı"
                  className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
                />
              </div>

              <div className="border-l border-white/25 pl-5">
                <div className="text-[11px] font-semibold tracking-[0.28em] text-amber-300">
                  T.C.
                </div>

                <div className="mt-1 text-sm font-semibold tracking-[0.12em] text-white">
                  İÇİŞLERİ BAKANLIĞI
                </div>

                <div className="mt-1 text-xs tracking-[0.18em] text-white/65">
                  JANDARMA GENEL KOMUTANLIĞI
                </div>
              </div>
            </div>

            {/* BAŞLIK */}
            <div className="max-w-3xl">

              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-12 bg-amber-300" />

                <span className="text-xs font-semibold tracking-[0.35em] text-amber-300">
                  VAN • EDREMİT
                </span>
              </div>

              <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-wide text-white sm:text-6xl lg:text-7xl">
                JANDARMA
              </h1>

              <h2 className="mt-2 font-serif text-4xl font-light leading-tight tracking-wide text-white/95 sm:text-5xl lg:text-6xl">
                SOSYAL TESİSİ
              </h2>

              <p className="mt-6 max-w-xl border-l-2 border-amber-300/70 pl-5 font-sans text-sm leading-7 text-white/75 sm:text-base">
                Van Gölü kıyısında, eşsiz manzara
                eşliğinde hizmet veren Van Edremit Jandarma Sosyal Tesisi.
              </p>
            </div>

        

         </section>

          {/* =================================================
              SAĞ TARAF - GİRİŞ KARTI
          ================================================== */}
          <section className="w-full">

            <div className="overflow-hidden rounded-[28px] border border-white/30 bg-white/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">

              {/* Kart üst başlık */}
              <div className="border-b border-gray-200 bg-[#f8fafb] px-7 pb-6 pt-7 sm:px-9">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="font-sans text-[10px] font-bold tracking-[0.28em] text-[#315c7d]">
                      PERSONEL ERİŞİM SİSTEMİ
                    </p>

                    <h2 className="mt-2 font-serif text-3xl font-medium text-[#102638]">
                      Hoş Geldiniz
                    </h2>
                  </div>

                  {/* Küçük Jandarma Amblemi */}
                  <div className="flex h-16 w-14 items-center justify-center">
                    <img
                      src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Emblem_of_the_Turkish_Gendarmerie.png"
                      alt="Jandarma"
                      className="h-full w-full object-contain"
                    />
                  </div>

                </div>

                <p className="mt-2 font-sans text-xs leading-5 text-gray-500">
                  Personel kullanıcı bilgileriniz ile sisteme giriş yapınız.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleLogin}
                className="space-y-5 px-7 py-7 font-sans sm:px-9 sm:py-8"
              >

                {/* Kullanıcı adı */}
                <div>

                  <label className="mb-2 block text-xs font-bold text-[#263b4d]">
                    Kullanıcı adı
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#6d8292]">

                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <circle
                          cx="12"
                          cy="8"
                          r="4"
                          strokeWidth="1.6"
                        />

                        <path
                          d="M5 20c.7-3.5 3.4-6 7-6s6.3 2.5 7 6"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>

                    </span>

                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#315c7d] focus:ring-4 focus:ring-[#315c7d]/10"
                      placeholder="Kullanıcı adınız"
                      autoComplete="username"
                      required
                    />

                  </div>
                </div>

                {/* Şifre */}
                <div>

                  <label className="mb-2 block text-xs font-bold text-[#263b4d]">
                    Şifre
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#6d8292]">

                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <rect
                          x="5"
                          y="10"
                          width="14"
                          height="11"
                          rx="2"
                          strokeWidth="1.6"
                        />

                        <path
                          d="M8 10V7a4 4 0 118 0v3"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>

                    </span>

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#315c7d] focus:ring-4 focus:ring-[#315c7d]/10"
                      placeholder="Şifreniz"
                      autoComplete="current-password"
                      required
                    />

                  </div>
                </div>

                {/* Hata */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
                    <div className="flex items-start gap-2">
                      <span>⚠</span>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Giriş */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 w-full overflow-hidden rounded-xl bg-[#183c59] py-4 text-xs font-bold tracking-[0.2em] text-white shadow-lg transition hover:bg-[#102f47] hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <span className="relative z-10">
                    {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
                  </span>

                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                </button>

                {/* Alt güvenlik yazısı */}
                <div className="pt-2 text-center">

                  <p className="text-[10px] leading-5 text-gray-400">
                    Bu sistem yalnızca yetkilendirilmiş personelin
                    kullanımına açıktır.
                  </p>

                </div>

              </form>
            </div>

          </section>

        </div>
      </div>

      {/* =====================================================
          SAĞ ALT SAAT
      ====================================================== */}
      <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-3 rounded-xl border border-white/15 bg-[#061421]/70 px-4 py-2.5 font-sans shadow-xl backdrop-blur-md sm:flex">

        <div className="text-right">

          <div className="font-mono text-sm font-semibold tracking-wider text-white">
            {currentTime || "00:00:00"}
          </div>

          <div className="text-[9px] tracking-[0.15em] text-white/50">
            VAN / EDREMİT
          </div>

        </div>

        <div className="h-8 w-px bg-white/20" />

        <div className="text-[10px] font-semibold tracking-[0.12em] text-amber-300">
          JANDARMA
        </div>

      </div>

      {/* =====================================================
          MOBİL ALT ÇİZGİ
      ====================================================== */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

    </main>
  );
}