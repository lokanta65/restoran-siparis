"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

type OrderItem = {
  name: string;
  price: number;
  quantity?: number;
};

type Order = {
  id: number;
  table_number: number;
  items: OrderItem[];
  total: number;
  status: string;
  special_request?: string | null;
  created_at: string;
};

export default function GarsonPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Siparişler alınamadı:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setOrders(data as Order[]);
      }

      setLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel("garson-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;

            setOrders((currentOrders) => {
              if (
                currentOrders.some(
                  (order) => order.id === newOrder.id
                )
              ) {
                return currentOrders;
              }

              return [newOrder, ...currentOrders];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;

            setOrders((currentOrders) =>
              currentOrders.map((order) =>
                order.id === updatedOrder.id
                  ? updatedOrder
                  : order
              )
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedOrder = payload.old as Order;

            setOrders((currentOrders) =>
              currentOrders.filter(
                (order) => order.id !== deletedOrder.id
              )
            );
          }
        }
      )
      .subscribe((status: string) => {
        console.log("Realtime durumu:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    const { data, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Durum güncellenemedi:", error);
      alert("Sipariş durumu güncellenemedi.");
      return;
    }

    if (data) {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? (data as Order)
            : order
        )
      );
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case "yeni":
        return "Yeni Sipariş";

      case "hazırlanıyor":
        return "Hazırlanıyor";

      case "hazır":
        return "Hazır";

      case "teslim edildi":
        return "Teslim Edildi";

      case "iptal edildi":
        return "İptal Edildi";

      default:
        return status;
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "yeni":
        return "bg-red-100 text-red-700";

      case "hazırlanıyor":
        return "bg-yellow-100 text-yellow-700";

      case "hazır":
        return "bg-blue-100 text-blue-700";

      case "teslim edildi":
        return "bg-green-100 text-green-700";

      case "iptal edildi":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <header className="rounded-2xl bg-red-700 p-5 text-white shadow sm:p-6">
            <h1 className="text-2xl font-bold sm:text-3xl">
              🍽️ Garson Sipariş Paneli
            </h1>

            <p className="mt-2 text-sm sm:text-base">
              Siparişler yükleniyor...
            </p>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl">

        {/* BAŞLIK */}
        <header className="mb-4 rounded-2xl bg-red-700 p-5 text-white shadow sm:mb-6 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                🍽️ Garson Sipariş Paneli
              </h1>

              <p className="mt-2 text-sm sm:text-base">
                Gelen siparişler burada anlık olarak görünür.
              </p>
            </div>

            {/* YÖNETİM PANELİ */}
            <a
              href="/yonetim"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-white px-5 py-3 font-bold text-red-700 shadow transition hover:bg-gray-100 active:scale-95"
            >
              ⚙️ Yönetim Paneli
            </a>

          </div>

          <div className="mt-4 flex flex-wrap gap-2">

            <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
              Toplam: {orders.length}
            </div>

            <div className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold">
              Yeni:{" "}
              {
                orders.filter(
                  (order) => order.status === "yeni"
                ).length
              }
            </div>

            <div className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold">
              Hazırlanıyor:{" "}
              {
                orders.filter(
                  (order) =>
                    order.status === "hazırlanıyor"
                ).length
              }
            </div>

            <div className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold">
              Hazır:{" "}
              {
                orders.filter(
                  (order) => order.status === "hazır"
                ).length
              }
            </div>

          </div>
        </header>

        {/* 20 MASA PANELİ */}
        <section className="mb-5 rounded-2xl bg-white p-4 shadow">

          <h2 className="mb-3 text-lg font-bold text-gray-900">
            🪑 Masalar
          </h2>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-10">

            {Array.from({ length: 20 }, (_, index) => {

              const masaNo = index + 1;

              const masaOrders = orders.filter(
                (order) =>
                  order.table_number === masaNo
              );

              const aktifSiparis = masaOrders.find(
                (order) =>
                  order.status !== "teslim edildi" &&
                  order.status !== "iptal edildi"
              );

              let masaStyle =
                "bg-gray-100 text-gray-700 border-gray-200";

              let durum = "Boş";

              if (aktifSiparis) {
                switch (aktifSiparis.status) {
                  case "yeni":
                    masaStyle =
                      "bg-red-100 text-red-700 border-red-300";
                    durum = "Yeni";
                    break;

                  case "hazırlanıyor":
                    masaStyle =
                      "bg-yellow-100 text-yellow-700 border-yellow-300";
                    durum = "Hazırlanıyor";
                    break;

                  case "hazır":
                    masaStyle =
                      "bg-blue-100 text-blue-700 border-blue-300";
                    durum = "Hazır";
                    break;
                }
              }

              return (
                <button
                  key={masaNo}
                  onClick={() =>
                    setSelectedTable(masaNo)
                  }
                  className={`w-full rounded-xl border-2 p-3 text-center transition active:scale-95 ${masaStyle}`}
                >
                  <div className="text-lg font-bold">
                    Masa {masaNo}
                  </div>

                  <div className="mt-1 text-xs font-semibold">
                    {durum}
                  </div>
                </button>
              );
            })}

          </div>

          {selectedTable !== null && (
            <button
              onClick={() => setSelectedTable(null)}
              className="mt-4 w-full rounded-xl bg-gray-800 px-4 py-3 font-bold text-white"
            >
              ← Tüm Siparişleri Göster
            </button>
          )}

        </section>

        {/* SİPARİŞLER */}
        {orders.length === 0 ? (

          <div className="rounded-2xl bg-white p-8 text-center shadow">

            <div className="text-5xl">
              🍽️
            </div>

            <p className="mt-4 text-lg font-semibold text-gray-700">
              Henüz sipariş yok.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Yeni siparişler burada görünecek.
            </p>

          </div>

        ) : (

          <div className="space-y-5">

            {Object.entries(
              orders
                .filter(
                  (order) =>
                    selectedTable === null ||
                    order.table_number === selectedTable
                )
                .reduce<Record<number, Order[]>>(
                  (groups, order) => {

                    if (!groups[order.table_number]) {
                      groups[order.table_number] = [];
                    }

                    groups[order.table_number].push(order);

                    return groups;
                  },
                  {}
                )
            ).map(([tableNumber, tableOrders]) => (

              <div
                key={tableNumber}
                className="overflow-hidden rounded-2xl bg-white shadow"
              >

                {/* MASA BAŞLIĞI */}
                <div className="border-b bg-gray-50 p-4 sm:p-5">

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <h2 className="text-2xl font-bold text-gray-900">
                        🪑 Masa {tableNumber}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {tableOrders.length} Sipariş
                      </p>

                    </div>

                    <div className="rounded-2xl bg-green-50 px-5 py-3 text-right">

                      <p className="text-sm font-semibold text-green-700">
                        💰 Masa Hesabı
                      </p>

                      <p className="mt-1 text-2xl font-bold text-green-800">
                        {tableOrders
                          .reduce(
                            (sum, order) =>
                              sum +
                              Number(order.total || 0),
                            0
                          )
                          .toLocaleString("tr-TR")}{" "}
                        TL
                      </p>

                    </div>

                  </div>

                </div>

                {/* MASANIN SİPARİŞLERİ */}
                <div className="space-y-4 p-4 sm:p-5">

                  {tableOrders.map((order) => (

                    <div
                      key={order.id}
                      className={`rounded-2xl border p-4 shadow-sm ${
                        order.status === "iptal edildi"
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >

                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="font-bold text-gray-900">
                            Sipariş #{order.id}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {new Date(
                              order.created_at
                            ).toLocaleString("tr-TR")}
                          </p>

                        </div>

                        <div
                          className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${statusStyle(
                            order.status
                          )}`}
                        >
                          {statusText(order.status)}
                        </div>

                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">

                        <h3 className="mb-3 font-bold text-gray-800">
                          Sipariş Detayı
                        </h3>

                        {Array.isArray(order.items) &&
                        order.items.length > 0 ? (

                          <div className="space-y-3">

                            {order.items.map(
                              (
                                item: OrderItem,
                                index: number
                              ) => (

                                <div
                                  key={`${item.name}-${index}`}
                                  className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                                >

                                  <div className="min-w-0">

                                    <p className="font-semibold text-gray-900">
                                      {item.name}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                      {Number(
                                        item.quantity || 1
                                      )}{" "}
                                      adet ×{" "}
                                      {item.price} TL
                                    </p>

                                  </div>

                                  <span className="shrink-0 font-bold text-gray-900">
                                    {Number(item.price) *
                                      Number(
                                        item.quantity || 1
                                      )}{" "}
                                    TL
                                  </span>

                                </div>

                              )
                            )}

                          </div>

                        ) : (

                          <p className="text-gray-500">
                            Ürün bilgisi bulunamadı.
                          </p>

                        )}

                        {/* ÖZEL İSTEK */}
<div className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
  <p className="font-bold text-orange-700">
    📝 Özel İstek
  </p>

  {order.special_request &&
  String(order.special_request).trim() !== "" ? (
    <p className="mt-2 rounded-lg bg-white p-3 text-base font-bold text-orange-900">
      {String(order.special_request)}
    </p>
  ) : (
    <p className="mt-2 text-sm font-medium text-gray-500">
      Özel istek yok.
    </p>
  )}
</div>

                        <div className="mt-4 flex items-center justify-between border-t pt-4">

                          <span className="text-lg font-bold">
                            Sipariş Toplamı
                          </span>

                          <span className="text-xl font-bold text-red-700">
                            {order.total} TL
                          </span>

                        </div>

                      </div>

                      {order.status !== "iptal edildi" && (

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

                          <button
                            onClick={() =>
                              updateStatus(
                                order.id,
                                "hazırlanıyor"
                              )
                            }
                            className="min-h-12 rounded-xl bg-yellow-500 px-4 py-3 font-bold text-white transition hover:bg-yellow-600 active:scale-95"
                          >
                            Hazırlanıyor
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                order.id,
                                "hazır"
                              )
                            }
                            className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 active:scale-95"
                          >
                            Hazır
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                order.id,
                                "teslim edildi"
                              )
                            }
                            className="min-h-12 rounded-xl bg-green-600 px-4 py-3 font-bold text-white transition hover:bg-green-700 active:scale-95"
                          >
                            Teslim Edildi
                          </button>

                        </div>

                      )}

                    </div>

                  ))}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </main>
  );
}