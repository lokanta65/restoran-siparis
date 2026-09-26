"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MutfakGirisPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      if (data.role === "mutfak") {
        router.push("/mutfak");
        return;
      }

      if (data.role === "admin") {
        router.push("/yonetim");
        return;
      }

      setError("Bu hesap mutfak paneline erişemez.");
    } catch (error) {
      console.error(error);
      setError("Giriş sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <div className="text-5xl">👨‍🍳</div>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Mutfak Girişi
          </h1>

          <p className="mt-2 text-gray-500">
            Mutfak personeli girişi
          </p>
        </div>

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Kullanıcı adı
        </label>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          placeholder="Kullanıcı adınızı girin"
          autoComplete="username"
          required
        />

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Şifre
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          placeholder="Şifrenizi girin"
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white shadow transition hover:bg-orange-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Giriş yapılıyor..." : "Mutfak Giriş Yap"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/giris")}
          className="mt-3 w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
        >
          ← Personel Girişine Dön
        </button>
      </form>
    </main>
  );
}