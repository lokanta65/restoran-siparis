"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../supabase";

/* =========================================================
   TİPLER
   ========================================================= */

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
};
type CartItem = MenuItem & {
  quantity: number;
};

type Order = {
  id: number;
  table_number: number;
  items: any[];
  total: number;
  status: string;
  special_request?: string | null;
  created_at: string;
};

/* =========================================================
   KATEGORİLER
   ========================================================= */

const categoryNames = [
  "Kahvaltı",
  "Omlet ve Yumurta Çeşitleri",
  "Ara Sıcaklar",
  "Fast Food",
  "Çorbalar",
  "Ana Yemekler",
  "Pide Çeşitleri",
];

/* =========================================================
   KATEGORİ GÖRSELLERİ
   ========================================================= */

const categoryImages: Record<string, string> = {
  Kahvaltı:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=85",

  "Omlet ve Yumurta Çeşitleri":
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=85",

  "Ara Sıcaklar":
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",

  "Fast Food":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",

  Çorbalar:
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",

  "Ana Yemekler":
    "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85",

  "Pide Çeşitleri":
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",
};

/* =========================================================
   ANA MENÜ
   ========================================================= */

function MenuPage() {
  const searchParams = useSearchParams();

  const masaNo = Number(searchParams.get("masa")) || 1;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [specialRequest, setSpecialRequest] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  /* =========================================================
     MENÜYÜ SUPABASE'DEN GETİR
     ========================================================= */

  useEffect(() => {
    const fetchMenuItems = async () => {
      setMenuLoading(true);

      const { data, error } = await supabase
        .from("menu_items")
        .select(
  "id,name,description,price,category,image,image_url,is_active,created_at"
)
        .order("id", {
          ascending: true,
        });

      if (error) {
        console.error("Menü ürünleri alınamadı:", error);

        alert(
          `Menü yüklenemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
        );

        setMenuLoading(false);
        return;
      }

      if (data) {
  setMenuItems(
    data
      .filter((item: any) => item.is_active !== false)
      .map((item: any) => ({
        id: Number(item.id),
        name: item.name || "",
        description: item.description || "",
        price: Number(item.price || 0),
        category: item.category || "",
        image: item.image || null,
        image_url: item.image_url || null,
        is_active: item.is_active !== false,
        created_at: item.created_at,
      }))
  );
}

      setMenuLoading(false);
    };

    fetchMenuItems();
  }, []);

    /* =========================================================
     SİPARİŞLERİ GETİR
     ========================================================= */

  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,table_number,items,total,status,special_request,created_at"
        )
        .eq("table_number", masaNo)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Siparişler alınamadı:", error);
        setOrdersLoading(false);
        return;
      }

      if (data) {
        setOrders(data as Order[]);
      }

      setOrdersLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel(`masa-${masaNo}-orders`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_number=eq.${masaNo}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;

            if (
              newOrder.status === "teslim edildi" ||
              newOrder.status === "iptal edildi"
            ) {
              return;
            }

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

            setOrders((currentOrders) => {
              if (
                updatedOrder.status === "teslim edildi" ||
                updatedOrder.status === "iptal edildi"
              ) {
                return currentOrders.filter(
                  (order) => order.id !== updatedOrder.id
                );
              }

              const exists = currentOrders.some(
                (order) => order.id === updatedOrder.id
              );

              if (exists) {
                return currentOrders.map((order) =>
                  order.id === updatedOrder.id
                    ? updatedOrder
                    : order
                );
              }

              return [updatedOrder, ...currentOrders];
            });
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
        console.log(
          "Müşteri sipariş realtime:",
          status
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [masaNo]);

  /* =========================================================
     ÜRÜN GÖRSELİ
     ========================================================= */

  const getProductImage = (item: MenuItem) => {
    if (item.image_url) {
      return item.image_url;
    }

    if (item.image) {
      return item.image;
    }

    return (
      categoryImages[item.category] ||
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85"
    );
  };

  /* =========================================================
     KATEGORİYE GİT
     ========================================================= */

  const openCategory = (category: string) => {
    setSelectedCategory(category);

    setTimeout(() => {
      const element = document.getElementById(
        `category-${category}`
      );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  /* =========================================================
     KATEGORİLERE DÖN
     ========================================================= */

 const goBackToCategories = () => {
  setSelectedCategory(null);
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

  /* =========================================================
     SEPETE EKLE
     ========================================================= */

  const addToCart = (item: MenuItem) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  /* =========================================================
     ADET ARTIR
     ========================================================= */

  const increaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  /* =========================================================
     ADET AZALT
     ========================================================= */

  const decreaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  /* =========================================================
     TOPLAM
     ========================================================= */

  const total = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        Number(item.quantity || 1),
    0
  );

  /* =========================================================
     SİPARİŞ VER
     ========================================================= */

  const sendOrder = async () => {
    if (cart.length === 0) {
      alert("Sepetiniz boş.");
      return;
    }

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      image:
        item.image_url ||
        item.image ||
        null,
      price: item.price,
      quantity: item.quantity,
    }));

   const today = new Date().toISOString().split("T")[0];

const { data: lastOrder } = await supabase
  .from("orders")
  .select("daily_order_number")
  .eq("order_date", today)
  .order("daily_order_number", { ascending: false })
  .limit(1)
  .maybeSingle();

const nextDailyOrderNumber =
  (lastOrder?.daily_order_number || 0) + 1;

const { data, error } = await supabase
  .from("orders")
  .insert({
    table_number: masaNo,
    items: orderItems,
    total: total,
    status: "yeni",
    special_request:
      specialRequest.trim() || null,

    daily_order_number: nextDailyOrderNumber,
    order_date: today,
  })
  
      .select()
      .single();

    if (error) {
      console.error(
        "Sipariş gönderme hatası:",
        error
      );

      alert(
        `Sipariş gönderilemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
      );

      return;
    }

    if (data) {
      setOrders((currentOrders) => [
        data as Order,
        ...currentOrders,
      ]);
    }

    alert(
      "Siparişiniz başarıyla gönderildi!"
    );

    setCart([]);
    setSpecialRequest("");
    setIsCartOpen(false);
  };

  /* =========================================================
     SİPARİŞ DÜZENLE
     ========================================================= */

  const editOrder = async (order: Order) => {
    if (order.status !== "yeni") {
      alert(
        "Bu sipariş artık hazırlanıyor. Bu aşamadan sonra sipariş düzenlenemez."
      );
      return;
    }

    const confirmEdit = window.confirm(
      "Bu siparişi geri alıp düzenlemek istiyor musunuz?"
    );

    if (!confirmEdit) {
      return;
    }

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (error) {
      console.error(
        "Sipariş geri alınamadı:",
        error
      );

      alert(
        `Sipariş geri alınamadı.\n\nKod: ${error.code}\nMesaj: ${error.message}`
      );

      return;
    }

    const restoredItems: CartItem[] =
      Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            id: Number(item.id || 0),
            name: item.name || "",
            description:
              item.description || "",
            price: Number(item.price || 0),
            category:
              item.category || "",
            image:
              item.image || null,
            image_url:
              item.image_url || null,
            quantity: Number(
              item.quantity || 1
            ),
          }))
        : [];

    setCart(restoredItems);

    setSpecialRequest(
      order.special_request || ""
    );

    setOrders((currentOrders) =>
      currentOrders.filter(
        (item) => item.id !== order.id
      )
    );

    setIsCartOpen(true);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  /* =========================================================
     SİPARİŞ İPTAL
     ========================================================= */

  const cancelOrder = async (order: Order) => {
    if (order.status !== "yeni") {
      alert(
        "Bu sipariş artık hazırlanıyor. Bu aşamadan sonra sipariş iptal edilemez."
      );
      return;
    }

    const confirmCancel =
      window.confirm(
        "Bu siparişi iptal etmek istediğinizden emin misiniz?"
      );

    if (!confirmCancel) {
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "iptal edildi",
      })
      .eq("id", order.id);

    if (error) {
      console.error(
        "Sipariş iptal edilemedi:",
        error
      );

      alert(
        `Sipariş iptal edilemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
      );

      return;
    }

    setOrders((currentOrders) =>
      currentOrders.filter(
        (item) => item.id !== order.id
      )
    );

    alert(
      "Siparişiniz iptal edildi."
    );
  };

  /* =========================================================
     SİPARİŞ DURUMU
     ========================================================= */

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
        return "bg-red-100 text-red-700 border-red-200";

      case "hazırlanıyor":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "hazır":
        return "bg-blue-100 text-blue-700 border-blue-200";

      case "teslim edildi":
        return "bg-green-100 text-green-700 border-green-200";

      case "iptal edildi":
        return "bg-gray-100 text-gray-600 border-gray-300";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main className="min-h-screen bg-[#061b3d] pb-10 text-white">

      {/* =====================================================
          ÜST ALAN
          ===================================================== */}

      <header className="px-4 pb-8 pt-8 text-center">

        <div className="mx-auto mb-5 flex w-fit items-center gap-3">
          <span className="text-2xl">🇹🇷</span>

          <span className="text-lg font-medium">
            Türkçe
          </span>
        </div>

        <div className="mx-auto max-w-3xl">

          <div className="mb-5 text-[#e8c866]">

            <div className="text-xs tracking-[0.3em]">
              VAN İL JANDARMA KOMUTANLIĞI
            </div>

            <div className="mt-2 text-xl font-semibold tracking-wide">
              EDREMİT SOSYAL TESİS MÜDÜRLÜĞÜ
            </div>

            <div className="mx-auto mt-4 h-px w-48 bg-[#caa94a]" />

            <div className="mt-3 text-sm tracking-[0.35em]">
              2026 • MENÜ
            </div>

          </div>

          <div className="mx-auto overflow-hidden rounded-[2rem] border-4 border-[#caa94a]/60 shadow-2xl">

            <img
              src="https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=85"
              alt="Restoran"
              className="h-64 w-full object-cover sm:h-80"
            />

          </div>

          <h1 className="mt-8 text-4xl font-semibold text-[#e8c866]">
            Menü
          </h1>

          <div className="mx-auto mt-3 h-px w-48 bg-[#caa94a]" />

          <p className="mt-6 text-xl font-semibold text-[#e8c866]">
            MASANIZ: {masaNo}
          </p>

          <p className="mt-3 text-sm text-gray-300">
            Ürünlerimizi inceleyebilir ve
            masanızdan kolayca sipariş
            verebilirsiniz.
          </p>

        </div>
      </header>

      {/* =====================================================
          SİPARİŞLERİM
          ===================================================== */}

      <section className="mx-auto max-w-3xl px-4 pt-4">

        <div className="rounded-3xl bg-white p-5 text-gray-900 shadow-2xl">

          <div className="flex items-center justify-between gap-3">

            <h2 className="text-2xl font-bold">
              📋 Siparişlerim
            </h2>

            {!ordersLoading && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                {orders.length} sipariş
              </span>
            )}

          </div>

          {ordersLoading ? (

            <p className="mt-4 text-sm text-gray-500">
              Siparişler yükleniyor...
            </p>

          ) : orders.length === 0 ? (

            <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-center">

              <div className="text-4xl">
                🍽️
              </div>

              <p className="mt-2 font-semibold text-gray-700">
                Henüz sipariş vermediniz.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Menüden ürün seçip sipariş
                verebilirsiniz.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {orders.map((order) => (

                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="font-bold">
                        Sipariş #{order.id}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(
                          order.created_at
                        ).toLocaleString(
                          "tr-TR"
                        )}
                      </p>

                    </div>

                    <div
                      className={`w-fit rounded-full border px-4 py-2 text-sm font-bold ${statusStyle(
                        order.status
                      )}`}
                    >
                      {statusText(
                        order.status
                      )}
                    </div>

                  </div>

                  <div className="mt-4 space-y-2">

                    {Array.isArray(order.items) &&
                      order.items.map(
                        (
                          item: any,
                          index: number
                        ) => (

                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2 last:border-0"
                          >

                            <div>

                              <p className="font-semibold">
                                {item.name}
                              </p>

                              <p className="text-sm text-gray-500">
                                {Number(
                                  item.quantity || 1
                                )}{" "}
                                adet
                              </p>

                            </div>

                            <span className="font-bold">
                              {(
                                Number(
                                  item.price
                                ) *
                                Number(
                                  item.quantity ||
                                    1
                                )
                              ).toLocaleString(
                                "tr-TR"
                              )}{" "}
                              TL
                            </span>

                          </div>

                        )
                      )}

                  </div>

                  {order.special_request && (
                    <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
                      <span className="font-bold">
                        📝 Özel İstek:
                      </span>{" "}
                      {order.special_request}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">

                    <span className="font-bold">
                      Toplam
                    </span>

                    <span className="text-lg font-bold text-red-700">
                      {Number(
                        order.total
                      ).toLocaleString(
                        "tr-TR"
                      )}{" "}
                      TL
                    </span>

                  </div>

                  {order.status === "yeni" && (
                    <>

                      <div className="mt-3 rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-700">
                        Siparişiniz alındı.
                        Hazırlanması
                        bekleniyor.
                      </div>

                      <button
                        onClick={() =>
                          editOrder(order)
                        }
                        className="mt-3 w-full rounded-xl border-2 border-red-600 bg-white py-3 font-bold text-red-600 transition hover:bg-red-50 active:scale-95"
                      >
                        ✏️ Siparişi Düzenle
                      </button>

                      <button
                        onClick={() =>
                          cancelOrder(order)
                        }
                        className="mt-2 w-full rounded-xl border-2 border-gray-400 bg-white py-3 font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95"
                      >
                        ✕ Siparişi İptal Et
                      </button>

                    </>
                  )}

                  {order.status === "hazırlanıyor" && (
                    <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-center text-sm font-semibold text-yellow-700">
                      👨‍🍳 Siparişiniz hazırlanıyor.
                    </div>
                  )}

                  {order.status === "hazır" && (
                    <div className="mt-3 rounded-xl bg-blue-50 p-3 text-center text-sm font-semibold text-blue-700">
                      🔔 Siparişiniz hazır!
                    </div>
                  )}

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          MENÜ
          ===================================================== */}

      <section className="mx-auto max-w-3xl px-4 py-8">

        <div className="mb-6 text-center">

          <h2 className="text-3xl font-semibold text-[#e8c866]">
            MENÜ
          </h2>

          <div className="mx-auto mt-3 h-px w-32 bg-[#caa94a]" />

        </div>

        {menuLoading ? (

          <div className="rounded-3xl bg-white p-10 text-center text-gray-900 shadow-xl">

            <div className="text-4xl">
              🍽️
            </div>

            <p className="mt-3 font-semibold">
              Menü yükleniyor...
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Ürünler Supabase'den
              getiriliyor.
            </p>

          </div>

        ) : menuItems.length === 0 ? (

          <div className="rounded-3xl bg-white p-10 text-center text-gray-900 shadow-xl">

            <div className="text-4xl">
              ⚠️
            </div>

            <p className="mt-3 font-bold">
              Menüde ürün bulunamadı.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Supabase menu_items tablosu
              kontrol edilmeli.
            </p>

          </div>

        ) : selectedCategory === null ? (

          /* =================================================
             KATEGORİLER
             ================================================= */

          <div className="space-y-4">

            {categoryNames.map((category) => {

              const categoryItem =
                menuItems.find(
                  (item) =>
                    item.category ===
                    category
                );

              return (
                <button
                  key={category}
                  onClick={() =>
                    openCategory(category)
                  }
                  className="group w-full overflow-hidden rounded-3xl border border-[#caa94a]/40 bg-white text-left shadow-xl transition hover:scale-[1.01] active:scale-[0.98]"
                >

                  <div className="relative h-32 overflow-hidden sm:h-40">

                    <img
                      src={
                        categoryImages[
                          category
                        ] ||
                        getProductImage(
                          categoryItem ||
                            menuItems[0]
                        )
                      }
                      alt={category}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/45" />

                    <div className="absolute inset-0 flex items-center justify-center">

                      <h3 className="px-4 text-center text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">
                        {category}
                      </h3>

                    </div>

                  </div>

                </button>
              );
            })}

          </div>

        ) : (

          /* =================================================
             KATEGORİ ÜRÜNLERİ
             ================================================= */

          <div>

            {/* ÜSTTEKİ KATEGORİLERE DÖN BUTONU */}

            <button
              onClick={
                goBackToCategories
              }
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#e8c866] bg-[#e8c866] py-4 font-bold text-[#061b3d] shadow-lg transition hover:bg-[#f1d477] active:scale-95"
            >
              ← Kategorilere Dön
            </button>

            <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#caa94a]">
                Menüde Gezin
              </p>

              <p className="mt-2 text-sm text-gray-300">
                Yukarı veya aşağı
                kaydırarak diğer
                kategorilere
                geçebilirsiniz.
              </p>

            </div>

            {/* KATEGORİLER */}

            <div className="space-y-12">

              {categoryNames.map((category) => {

                const categoryItems =
                  menuItems.filter(
                    (item) =>
                      item.category ===
                      category
                  );

                if (
                  categoryItems.length ===
                  0
                ) {
                  return null;
                }

                const categoryIndex =
                  categoryNames.indexOf(
                    category
                  );

                return (

                  <div
                    key={category}
                    id={`category-${category}`}
                    className="scroll-mt-6"
                  >

                    {/* KATEGORİ BAŞLIĞI */}

                    <div className="mb-5 overflow-hidden rounded-3xl border border-[#caa94a]/40 bg-white shadow-xl">

                      <div className="relative h-36 overflow-hidden">

                        <img
                          src={
                            categoryImages[
                              category
                            ] ||
                            getProductImage(
                              categoryItems[0]
                            )
                          }
                          alt={category}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-black/50" />

                        <div className="absolute inset-0 flex items-center justify-center">

                          <h2 className="px-4 text-center text-2xl font-bold text-white sm:text-3xl">
                            {category}
                          </h2>

                        </div>

                      </div>

                    </div>

                    {/* ÜRÜNLER */}

                    <div className="grid gap-5 sm:grid-cols-2">

                      {categoryItems.map(
                        (item) => (

                          <div
                            key={item.id}
                            className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-xl"
                          >

                            <div className="relative h-48 overflow-hidden">

                              <img
                                src={getProductImage(
                                  item
                                )}
                                alt={
                                  item.name
                                }
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-300 hover:scale-105"
                              />

                              <div className="absolute left-3 top-3 rounded-full bg-[#061b3d]/90 px-3 py-1 text-xs font-semibold text-[#e8c866]">
                                {
                                  item.category
                                }
                              </div>

                            </div>

                            <div className="p-5 text-gray-900">

                              <h3 className="text-xl font-bold">
                                {
                                  item.name
                                }
                              </h3>

                              <p className="mt-2 min-h-[40px] text-sm text-gray-500">
                                {
                                  item.description
                                }
                              </p>

                              <div className="mt-5 flex items-center justify-between gap-3">

                                <span className="text-xl font-bold text-[#a47b13]">
                                  {Number(
                                    item.price
                                  ).toLocaleString(
                                    "tr-TR"
                                  )}{" "}
                                  TL
                                </span>

                                <button
                                  onClick={() =>
                                    addToCart(
                                      item
                                    )
                                  }
                                  className="rounded-xl bg-[#061b3d] px-4 py-3 font-bold text-white transition hover:bg-[#0b2d62] active:scale-95"
                                >
                                  + Sepete Ekle
                                </button>

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                    {/* =================================================
                       KATEGORİLER ARASI GEÇİŞ
                       ================================================= */}

                    <div className="mt-7 space-y-3">

                     

                      {/* ÖNCEKİ / SONRAKİ */}

                      <div className="flex gap-3">

                        {categoryIndex > 0 && (
                          <button
                            onClick={() => {
                              const previousCategory =
                                categoryNames[
                                  categoryIndex -
                                    1
                                ];

                              openCategory(
                                previousCategory
                              );
                            }}
                            className="flex-1 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                          >
                            ↑ Önceki Kategori
                          </button>
                        )}

                        {categoryIndex <
                          categoryNames.length -
                            1 && (
                          <button
                            onClick={() => {
                              const nextCategory =
                                categoryNames[
                                  categoryIndex +
                                    1
                                ];

                              openCategory(
                                nextCategory
                              );
                            }}
                            className="flex-1 rounded-xl border border-[#e8c866]/50 bg-[#e8c866]/10 py-3 text-sm font-semibold text-[#e8c866] transition hover:bg-[#e8c866]/20 active:scale-95"
                          >
                            ↓ Sonraki Kategori
                          </button>
                        )}

                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

          </div>

        )}

      </section>

      {/* =====================================================
          EKRANIN ALTINDA SABİT KATEGORİLERE DÖN BUTONU
          ===================================================== */}

      {selectedCategory !== null && (
  <button
    onClick={goBackToCategories}
    className="fixed bottom-5 left-4 z-40 rounded-full border-2 border-[#e8c866] bg-[#e8c866] px-5 py-3 font-bold text-[#061b3d] shadow-2xl transition hover:bg-[#f1d477] active:scale-95"
  >
    ← Kategoriler
  </button>
)}

      {/* =====================================================
          SEPET
          ===================================================== */}

      {cart.length > 0 && (
        <>

          {!isCartOpen && (
            <button
              onClick={() =>
                setIsCartOpen(true)
              }
              className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-[#e8c866]/50 bg-[#061b3d] px-5 py-4 text-white shadow-2xl transition hover:scale-105 active:scale-95"
            >

              <span className="text-2xl">
                🛒
              </span>

              <div className="text-left">

                <div className="text-sm font-semibold text-gray-300">
                  Sepetim
                </div>

                <div className="font-bold text-[#e8c866]">
                  {total.toLocaleString(
                    "tr-TR"
                  )}{" "}
                  TL
                </div>

              </div>

              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8c866] text-sm font-bold text-[#061b3d]">
                {cart.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                )}
              </span>

            </button>
          )}

          {isCartOpen && (
            <section className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md">

              <div className="max-h-[80vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-5 text-gray-900 shadow-2xl">

                <div className="mb-5 flex items-center justify-between">

                  <div>

                    <h2 className="text-xl font-bold">
                      🛒 Sepetim
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {cart.reduce(
                        (sum, item) =>
                          sum +
                          item.quantity,
                        0
                      )}{" "}
                      ürün
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setIsCartOpen(
                        false
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 transition hover:bg-gray-200"
                  >
                    ✕
                  </button>

                </div>

                <div className="space-y-4">

                  {cart.map((item) => (

                    <div
                      key={item.id}
                      className="border-b border-gray-200 pb-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="font-semibold">
                            {item.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {Number(
                              item.price
                            ).toLocaleString(
                              "tr-TR"
                            )}{" "}
                            TL ×{" "}
                            {item.quantity}
                          </p>

                        </div>

                        <span className="shrink-0 font-bold text-[#a47b13]">
                          {(
                            Number(
                              item.price
                            ) *
                            Number(
                              item.quantity
                            )
                          ).toLocaleString(
                            "tr-TR"
                          )}{" "}
                          TL
                        </span>

                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">

                        <button
                          onClick={() =>
                            decreaseQuantity(
                              item.id
                            )
                          }
                          className="h-9 w-9 rounded-lg bg-gray-200 text-lg font-bold"
                        >
                          −
                        </button>

                        <span className="w-8 text-center font-bold">
                          {
                            item.quantity
                          }
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(
                              item.id
                            )
                          }
                          className="h-9 w-9 rounded-lg bg-[#061b3d] text-lg font-bold text-white"
                        >
                          +
                        </button>

                      </div>

                    </div>

                  ))}

                </div>

                {/* ÖZEL İSTEK */}

                <div className="mt-5">

                  <label className="mb-2 block font-semibold">
                    📝 Özel İstek
                  </label>

                  <textarea
                    value={
                      specialRequest
                    }
                    onChange={(e) =>
                      setSpecialRequest(
                        e.target.value
                      )
                    }
                    placeholder="Örn: Acısız olsun, soğan olmasın..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* TOPLAM */}

                <div className="mt-5 border-t border-gray-200 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="text-lg font-bold">
                      Toplam
                    </span>

                    <span className="text-2xl font-bold text-[#a47b13]">
                      {total.toLocaleString(
                        "tr-TR"
                      )}{" "}
                      TL
                    </span>

                  </div>

                  <button
                    onClick={
                      sendOrder
                    }
                    className="mt-4 w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 active:scale-95"
                  >
                    Sipariş Ver
                  </button>

                </div>

              </div>

            </section>
          )}

        </>
      )}

      {/* =====================================================
          ALT BİLGİ
          ===================================================== */}

      <footer className="mt-10 border-t border-white/10 px-4 py-8 text-center">

        <p className="text-lg font-semibold text-[#e8c866]">
          EDREMİT SOSYAL TESİS MÜDÜRLÜĞÜ
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Fiyatlarımıza tüm vergiler
          dahildir.
        </p>

        <p className="mt-1 text-xs text-gray-500">
          2026 Menü
        </p>

      </footer>

    </main>
  );
}

/* =========================================================
   ANA SAYFA
   ========================================================= */

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#061b3d]">

          <p className="text-[#e8c866]">
            Menü açılıyor...
          </p>

        </main>
      }
    >
      <MenuPage />
    </Suspense>
  );
}