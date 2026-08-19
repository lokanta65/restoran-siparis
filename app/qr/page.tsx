"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function QRPage() {
  const masaSayisi = 20;

  const siteUrl = "http://192.168.1.106:3000";

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl bg-red-700 p-6 text-center text-white shadow">
          <h1 className="text-3xl font-bold">
            📱 Masa QR Kodları
          </h1>

          <p className="mt-2">
            Her QR kod ilgili masanın menüsünü açar.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: masaSayisi }, (_, index) => {
            const masaNo = index + 1;

            const masaUrl = `${siteUrl}/?masa=${masaNo}`;

            return (
              <div
                key={masaNo}
                className="flex flex-col items-center rounded-2xl bg-white p-6 shadow"
              >
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  Masa {masaNo}
                </h2>

                <div className="rounded-xl border bg-white p-3">
                  <QRCodeCanvas
                    value={masaUrl}
                    size={180}
                    level="H"
                  />
                </div>

                <p className="mt-4 break-all text-center text-xs text-gray-500">
                  {masaUrl}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
