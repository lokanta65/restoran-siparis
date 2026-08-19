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
  created_at: string;
};

export default function MutfakPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["yeni", "hazırlanıyor"])
        .order("created_at", { ascending: true });

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
      .channel("mutfak-orders")
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

            if (
              newOrder.status === "yeni" ||
              newOrder.status === "hazırlanıyor"
            ) {
              setOrders((currentOrders) => {
                if (
                  currentOrders.some(
                    (order) => order.id === newOrder.id
                  )
                ) {
                  return currentOrders;
                }

                return [...currentOrders, newOrder];
              });
            }
          }

          if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;

            if (
              updatedOrder.status === "yeni" ||
              updatedOrder.status === "hazırlanıyor"
            ) {
              setOrders((currentOrders) =>
                currentOrders.some(
                  (order) => order.id === updatedOrder.id
                )
                  ? currentOrders.map((order) =>
                      order.id === updatedOrder.id
                        ? updatedOrder
                        : order
                    )
                  : [...currentOrders, updatedOrder]
              );
            } else {
              setOrders((currentOrders) =>
                currentOrders.filter(
                  (order) => order.id !== updatedOrder.id
                )
              );
            }
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    console.log("BUTONA BASILDI:", orderId, newStatus);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Sipariş durumu güncellenemedi:", error);
      alert("Sipariş durumu güncellenemedi.");
    }
  };

  const yeniSiparisler = orders.filter(
    (order) => order.status === "yeni"
  );

  const hazirlananSiparisler = orders.filter(
    (order) => order.status === "hazırlanıyor"
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-3xl font-bold">
          👨‍🍳 Mutfak Paneli
        </h1>

        <p className="mt-4 text-gray-600">
          Siparişler yükleniyor...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl bg-orange-600 p-6 text-white shadow">
          <h1 className="text-3xl font-bold">
            👨‍🍳 Mutfak Sipariş Paneli
          </h1>

          <p className="mt-2">
            Yeni siparişler ve hazırlanan siparişler burada görünür.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="mb-5 text-2xl font-bold text-gray-900">
            🆕 Yeni Siparişler
          </h2>

          {yeniSiparisler.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-gray-500">
                Yeni sipariş bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {yeniSiparisler.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border-2 border-orange-300 bg-white p-5 shadow"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">
                        Masa {order.table_number}
                      </h3>

                      <p className="text-sm text-gray-500">
                        Sipariş #{order.id}
                      </p>
                    </div>

                    <span className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-bold text-orange-700">
                      YENİ
                    </span>
                  </div>

                  <div className="mb-5 space-y-3 rounded-xl bg-gray-50 p-4">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between border-b pb-2 last:border-b-0"
                      >
                        <span className="font-semibold">
                          {item.quantity
                            ? `${item.quantity}x `
                            : ""}
                          {item.name}
                        </span>

                        <span className="text-gray-600">
                          {item.price} TL
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      updateStatus(order.id, "hazırlanıyor")
                    }
                    className="w-full rounded-xl bg-yellow-500 px-4 py-3 font-bold text-white transition hover:bg-yellow-600"
                  >
                    👨‍🍳 Hazırlamaya Başla
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-bold text-gray-900">
            🔥 Hazırlanan Siparişler
          </h2>

          {hazirlananSiparisler.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-gray-500">
                Hazırlanan sipariş bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {hazirlananSiparisler.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border-2 border-yellow-300 bg-white p-5 shadow"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">
                        Masa {order.table_number}
                      </h3>

                      <p className="text-sm text-gray-500">
                        Sipariş #{order.id}
                      </p>
                    </div>

                    <span className="rounded-xl bg-yellow-100 px-3 py-2 text-sm font-bold text-yellow-700">
                      HAZIRLANIYOR
                    </span>
                  </div>

                  <div className="mb-5 space-y-3 rounded-xl bg-gray-50 p-4">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between border-b pb-2 last:border-b-0"
                      >
                        <span className="font-semibold">
                          {item.quantity
                            ? `${item.quantity}x `
                            : ""}
                          {item.name}
                        </span>

                        <span className="text-gray-600">
                          {item.price} TL
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      updateStatus(order.id, "hazır")
                    }
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700"
                  >
                    ✅ Sipariş Hazır
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}