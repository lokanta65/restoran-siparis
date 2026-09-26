"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";
import { useRouter } from "next/navigation";

type OrderItem = {
  id?: number;
  name: string;
  description?: string;
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
  daily_order_number?: number | null;
  created_at: string;
};

const ACTIVE_STATUSES = ["yeni", "hazırlanıyor"];

export default function MutfakPage() {
  const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  fetch("/api/me")
    .then((response) => response.json())
    .then((data) => {
      setIsAdmin(data.role === "admin");
    })
    .catch(() => {
      setIsAdmin(false);
    });
}, []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  /* =========================================================
     SİPARİŞLERİ GETİR
     ========================================================= */

  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,table_number,items,total,status,special_request,daily_order_number,created_at"
      )
      .in("status", ACTIVE_STATUSES)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Mutfak siparişleri alınamadı:",
        error
      );

      alert(
        `Siparişler alınamadı.\n\n${error.message}`
      );

      setLoading(false);
      return;
    }

    setOrders(
      (data || []) as Order[]
    );

    setLoading(false);
  };

  /* =========================================================
     İLK YÜKLEME + REALTIME
     ========================================================= */

  useEffect(() => {
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
          /* -------------------------
             YENİ SİPARİŞ
             ------------------------- */

          if (
            payload.eventType ===
            "INSERT"
          ) {
            const newOrder =
              payload.new as Order;

            if (
              ACTIVE_STATUSES.includes(
                newOrder.status
              )
            ) {
              setOrders(
                (currentOrders) => {
                  if (
                    currentOrders.some(
                      (order) =>
                        order.id ===
                        newOrder.id
                    )
                  ) {
                    return currentOrders;
                  }

                  return [
                    ...currentOrders,
                    newOrder,
                  ].sort(
                    (a, b) =>
                      new Date(
                        a.created_at
                      ).getTime() -
                      new Date(
                        b.created_at
                      ).getTime()
                  );
                }
              );
            }

            return;
          }

          /* -------------------------
             SİPARİŞ GÜNCELLEME
             ------------------------- */

          if (
            payload.eventType ===
            "UPDATE"
          ) {
            const updatedOrder =
              payload.new as Order;

            if (
              ACTIVE_STATUSES.includes(
                updatedOrder.status
              )
            ) {
              setOrders(
                (currentOrders) => {
                  const exists =
                    currentOrders.some(
                      (order) =>
                        order.id ===
                        updatedOrder.id
                    );

                  if (!exists) {
                    return [
                      ...currentOrders,
                      updatedOrder,
                    ].sort(
                      (a, b) =>
                        new Date(
                          a.created_at
                        ).getTime() -
                        new Date(
                          b.created_at
                        ).getTime()
                    );
                  }

                  return currentOrders.map(
                    (order) =>
                      order.id ===
                      updatedOrder.id
                        ? updatedOrder
                        : order
                  );
                }
              );
            } else {
              setOrders(
                (currentOrders) =>
                  currentOrders.filter(
                    (order) =>
                      order.id !==
                      updatedOrder.id
                  )
              );
            }

            return;
          }

          /* -------------------------
             SİPARİŞ SİLİNDİ
             ------------------------- */

          if (
            payload.eventType ===
            "DELETE"
          ) {
            const deletedOrder =
              payload.old as Order;

            setOrders(
              (currentOrders) =>
                currentOrders.filter(
                  (order) =>
                    order.id !==
                    deletedOrder.id
                )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  /* =========================================================
     DURUM DEĞİŞTİR
     ========================================================= */

  const updateStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    setUpdatingId(orderId);

    const { error } =
      await supabase
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq("id", orderId);

    if (error) {
      console.error(
        "Sipariş durumu değiştirilemedi:",
        error
      );

      alert(
        `Sipariş durumu değiştirilemedi.\n\n${error.message}`
      );
    }

    setUpdatingId(null);
  };

  /* =========================================================
     SİPARİŞ GRUPLARI
     ========================================================= */

  const yeniSiparisler =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
            "yeni"
        ),
      [orders]
    );

  const hazirlananSiparisler =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
            "hazırlanıyor"
        ),
      [orders]
    );

  /* =========================================================
     SAAT FORMATLA
     ========================================================= */

  const formatTime = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleTimeString(
      "tr-TR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* =========================================================
     SİPARİŞ KARTI
     ========================================================= */

  const OrderCard = ({
    order,
    type,
  }: {
    order: Order;
    type: "yeni" | "hazırlanıyor";
  }) => {
    const isUpdating =
      updatingId === order.id;

    return (
      <article
        className={`overflow-hidden rounded-3xl bg-white shadow-xl ${
          type === "yeni"
            ? "border-4 border-orange-400"
            : "border-4 border-yellow-400"
        }`}
      >
        {/* BAŞLIK */}

        <div
          className={`p-5 text-white ${
            type === "yeni"
              ? "bg-orange-600"
              : "bg-yellow-500"
          }`}
        >
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-sm font-semibold opacity-90">
                {order.daily_order_number
                  ? `GÜNLÜK SİPARİŞ #${order.daily_order_number}`
                  : `SİPARİŞ #${order.id}`}
              </p>

              <h3 className="mt-1 text-3xl font-black">
                MASA {order.table_number}
              </h3>

              <p className="mt-1 text-sm font-semibold opacity-90">
                🕐 {formatTime(order.created_at)}
              </p>
            </div>

            <span className="rounded-xl bg-white/20 px-3 py-2 text-xs font-black">
              {type === "yeni"
                ? "YENİ"
                : "HAZIRLANIYOR"}
            </span>

          </div>
        </div>

        {/* ÜRÜNLER */}

        <div className="p-5">

          <div className="space-y-3">

            {order.items?.map(
              (
                item,
                index
              ) => (
                <div
                  key={`${item.name}-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">

                        <span className="rounded-lg bg-[#061b3d] px-2.5 py-1 text-sm font-black text-white">
                          {item.quantity ||
                            1}
                          x
                        </span>

                        <span className="text-lg font-bold text-gray-900">
                          {item.name}
                        </span>

                      </div>

                      {item.description && (
                        <p className="mt-2 text-sm text-gray-500">
                          {item.description}
                        </p>
                      )}

                    </div>

                    <span className="shrink-0 font-bold text-gray-700">
                      {Number(
                        item.price
                      ).toFixed(2)}{" "}
                      TL
                    </span>

                  </div>

                </div>
              )
            )}

          </div>

          {/* ÖZEL İSTEK */}

          {order.special_request && (
            <div className="mt-5 rounded-2xl border-2 border-red-300 bg-red-50 p-4">

              <div className="flex items-center gap-2">

                <span className="text-xl">
                  ⚠️
                </span>

                <span className="font-black text-red-700">
                  ÖZEL İSTEK
                </span>

              </div>

              <p className="mt-2 font-semibold text-red-800">
                {order.special_request}
              </p>

            </div>
          )}

          {/* TOPLAM */}

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-100 p-4">

            <span className="font-bold text-gray-600">
              Toplam
            </span>

            <span className="text-xl font-black text-gray-900">
              {Number(
                order.total
              ).toFixed(2)}{" "}
              TL
            </span>

          </div>

          {/* BUTON */}

          {type === "yeni" ? (

            <button
              type="button"
              disabled={isUpdating}
              onClick={() =>
                updateStatus(
                  order.id,
                  "hazırlanıyor"
                )
              }
              className="mt-5 w-full rounded-2xl bg-yellow-500 px-5 py-4 text-lg font-black text-white shadow transition hover:bg-yellow-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating
                ? "⏳ Güncelleniyor..."
                : "👨‍🍳 HAZIRLAMAYA BAŞLA"}
            </button>

          ) : (

            <button
              type="button"
              disabled={isUpdating}
              onClick={() =>
                updateStatus(
                  order.id,
                  "hazır"
                )
              }
              className="mt-5 w-full rounded-2xl bg-green-600 px-5 py-4 text-lg font-black text-white shadow transition hover:bg-green-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating
                ? "⏳ Güncelleniyor..."
                : "✅ SİPARİŞ HAZIR"}
            </button>

          )}

        </div>
      </article>
    );
  };

  /* =========================================================
     YÜKLENİYOR
     ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">

        <div className="rounded-3xl bg-white p-10 text-center shadow-xl">

          <div className="text-6xl">
            👨‍🍳
          </div>

          <h1 className="mt-5 text-2xl font-black text-gray-900">
            Mutfak Paneli
          </h1>

          <p className="mt-2 text-gray-500">
            Siparişler yükleniyor...
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
     ANA SAYFA
     ========================================================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-12">

      {/* HEADER */}

      <header className="bg-[#061b3d] px-4 py-6 text-white shadow-lg">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-sm font-semibold tracking-[0.25em] text-[#e8c866]">
                EDREMİT SOSYAL TESİS
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                👨‍🍳 Mutfak Sipariş Paneli
              </h1>

              <p className="mt-2 text-sm text-gray-300">
                Yeni siparişleri hazırlayın ve
hazır olduğunda siparişi hazır olarak işaretleyin.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

  {isAdmin && (
    <button
      type="button"
      onClick={() => {
        window.location.href = "/yonetim";
      }}
      className="rounded-xl bg-white px-5 py-3 font-bold text-[#061b3d] shadow transition hover:bg-gray-100 active:scale-95"
    >
      ⚙️ Yönetim Paneline Dön
    </button>
  )}

  <button
    type="button"
    onClick={async () => {
      try {
        await fetch("/api/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Çıkış hatası:", error);
      }

      window.location.href = "/giris";
    }}
    className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white shadow transition hover:bg-red-700 active:scale-95"
  >
    🚪 Çıkış Yap
  </button>

</div>

          </div>

        </div>

      </header>

      {/* ÖZET */}

      <section className="mx-auto max-w-7xl px-4 pt-6">

        <div className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-sm font-bold text-gray-500">
              TOPLAM AKTİF
            </p>

            <p className="mt-1 text-3xl font-black text-gray-900">
              {orders.length}
            </p>

          </div>

          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 shadow">

            <p className="text-sm font-bold text-orange-600">
              YENİ SİPARİŞ
            </p>

            <p className="mt-1 text-3xl font-black text-orange-700">
              {yeniSiparisler.length}
            </p>

          </div>

          <div className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-5 shadow">

            <p className="text-sm font-bold text-yellow-700">
              HAZIRLANIYOR
            </p>

            <p className="mt-1 text-3xl font-black text-yellow-700">
              {hazirlananSiparisler.length}
            </p>

          </div>

        </div>

      </section>

      {/* YENİ SİPARİŞLER */}

      <section className="mx-auto max-w-7xl px-4 pt-8">

        <div className="mb-5 flex items-center justify-between gap-4">

          <div>

            <h2 className="text-2xl font-black text-gray-900">
              🆕 Yeni Siparişler
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Mutfağa yeni gelen siparişler.
            </p>

          </div>

          <span className="rounded-full bg-orange-100 px-4 py-2 font-black text-orange-700">
            {yeniSiparisler.length}
          </span>

        </div>

        {yeniSiparisler.length === 0 ? (

          <div className="rounded-3xl bg-white p-10 text-center shadow">

            <div className="text-6xl">
              ☕
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-800">
              Yeni sipariş yok
            </h3>

            <p className="mt-2 text-gray-500">
              Yeni sipariş geldiğinde burada otomatik görünecek.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {yeniSiparisler.map(
              (order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  type="yeni"
                />
              )
            )}

          </div>

        )}

      </section>

      {/* HAZIRLANAN SİPARİŞLER */}

      <section className="mx-auto max-w-7xl px-4 pt-10">

        <div className="mb-5 flex items-center justify-between gap-4">

          <div>

            <h2 className="text-2xl font-black text-gray-900">
              🔥 Hazırlanan Siparişler
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Hazırlaması devam eden siparişler.
            </p>

          </div>

          <span className="rounded-full bg-yellow-100 px-4 py-2 font-black text-yellow-700">
            {hazirlananSiparisler.length}
          </span>

        </div>

        {hazirlananSiparisler.length ===
        0 ? (

          <div className="rounded-3xl bg-white p-10 text-center shadow">

            <div className="text-6xl">
              👨‍🍳
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-800">
              Hazırlanan sipariş yok
            </h3>

            <p className="mt-2 text-gray-500">
              Yeni siparişlerden hazırlamaya
              başladıklarınız burada görünecek.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {hazirlananSiparisler.map(
              (order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  type="hazırlanıyor"
                />
              )
            )}

          </div>

        )}

      </section>

    </main>
  );
}