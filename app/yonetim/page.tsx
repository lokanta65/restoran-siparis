"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  is_active: boolean;
  created_at?: string;
};

const categories = [
  "Kahvaltı",
  "Omlet ve Yumurta Çeşitleri",
  "Ara Sıcaklar",
  "Fast Food",
  "Çorbalar",
  "Ana Yemekler",
  "Pide Çeşitleri",
];

export default function YonetimPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Menü alınamadı:", error);

      alert(
        `Menü alınamadı.\n\nKod: ${error.code}\nMesaj: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setItems((data || []) as MenuItem[]);
    setLoading(false);
  };

  const updateItem = (
    id: number,
    field: keyof MenuItem,
    value: string | number | boolean
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const saveItem = async (item: MenuItem) => {
    setSavingId(item.id);

    console.log("Kaydedilecek ürün:", item);

    const { data, error } = await supabase
      .from("menu_items")
      .update({
        name: item.name,
        description: item.description,
        price: Number(item.price),
        category: item.category,
        image: item.image,
        is_active: Boolean(item.is_active),
      })
      .eq("id", item.id)
      .select("*");

    setSavingId(null);

    if (error) {
      console.error("Ürün kaydedilemedi:", error);

      alert(
        `Ürün kaydedilemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
      );

      return;
    }

    console.log("Supabase güncelleme sonucu:", data);

    if (!data || data.length === 0) {
      alert(
        "Değişiklik kaydedilemedi.\n\n" +
          "Supabase 0 satır güncelledi.\n\n" +
          "Büyük ihtimalle RLS/UPDATE yetkisi veya ürün ID'si ile ilgili bir sorun var."
      );

      return;
    }

    const updatedItem = data[0] as MenuItem;

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === updatedItem.id
          ? updatedItem
          : currentItem
      )
    );

    alert(`"${updatedItem.name}" başarıyla kaydedildi.`);
  };

  const filteredItems = items.filter((item) => {
    const searchText = search.toLocaleLowerCase("tr-TR");

    const matchesSearch =
      item.name
        .toLocaleLowerCase("tr-TR")
        .includes(searchText) ||
      (item.description || "")
        .toLocaleLowerCase("tr-TR")
        .includes(searchText);

    const matchesCategory =
      selectedCategory === "Tümü" ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#061b3d] pb-16 text-white">

      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#04152f] px-4 py-6">
        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* BAŞLIK */}

            <div>
              <p className="text-sm tracking-[0.25em] text-[#e8c866]">
                EDREMİT SOSYAL TESİS
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                ⚙️ Menü Yönetim Paneli
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Menü ürünlerini buradan düzenleyebilirsiniz.
              </p>

              {/* GARSON PANELİ */}

              <div className="mt-4">
                <a
                  href="/garson"
                  className="inline-flex rounded-xl bg-white px-5 py-3 font-bold text-[#061b3d] shadow transition hover:bg-gray-100 active:scale-95"
                >
                  👨‍🍳 Garson Paneline Dön
                </a>
              </div>
            </div>

            {/* ÜRÜN SAYISI */}

            <div className="rounded-2xl bg-white/10 px-6 py-5 text-center">
              <div className="text-3xl font-bold text-[#e8c866]">
                {items.length}
              </div>

              <div className="mt-1 text-xs text-gray-300">
                Toplam Ürün
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* KONTROLLER */}

      <section className="mx-auto max-w-7xl px-4 pt-6">

        <div className="rounded-3xl bg-white p-5 text-gray-900 shadow-2xl">

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">

            {/* ARAMA */}

            <div>
              <label className="mb-2 block text-sm font-bold">
                🔎 Menüde Ara
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün adı veya açıklama ara..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* YENİLE */}

            <div className="flex items-end">

              <button
                onClick={fetchMenu}
                className="w-full rounded-xl bg-[#061b3d] px-6 py-3 font-bold text-white transition hover:bg-[#0b2d62] active:scale-95 md:w-auto"
              >
                🔄 Yenile
              </button>

            </div>

          </div>

          {/* KATEGORİLER */}

          <div className="mt-5">

            <label className="mb-2 block text-sm font-bold">
              📂 Kategori
            </label>

            <div className="flex gap-2 overflow-x-auto pb-2">

              {["Tümü", ...categories].map((category) => (

                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === category
                      ? "border-[#061b3d] bg-[#061b3d] text-white"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {category}
                </button>

              ))}

            </div>

          </div>

          <div className="mt-4 text-sm text-gray-500">
            {filteredItems.length} ürün gösteriliyor.
          </div>

        </div>

      </section>

      {/* ÜRÜNLER */}

      <section className="mx-auto max-w-7xl px-4 py-6">

        {loading ? (

          <div className="rounded-3xl bg-white p-10 text-center text-gray-700 shadow-2xl">

            <div className="text-4xl">
              ⏳
            </div>

            <p className="mt-3 font-semibold">
              Menü yükleniyor...
            </p>

          </div>

        ) : filteredItems.length === 0 ? (

          <div className="rounded-3xl bg-white p-10 text-center text-gray-700 shadow-2xl">

            <div className="text-5xl">
              🍽️
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Ürün bulunamadı
            </h2>

            <p className="mt-2 text-gray-500">
              Arama veya kategori filtresini değiştirmeyi deneyin.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 lg:grid-cols-2">

            {filteredItems.map((item) => (

              <div
                key={item.id}
                className="overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl"
              >

                {/* FOTOĞRAF */}

                <div className="relative h-56 bg-gray-100">

                  {item.image ? (

                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <div className="flex h-full items-center justify-center text-6xl">
                      🍽️
                    </div>

                  )}

                  <div
                    className={`absolute right-3 top-3 rounded-full px-4 py-2 text-sm font-bold shadow ${
                      item.is_active
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {item.is_active
                      ? "AKTİF"
                      : "PASİF"}
                  </div>

                </div>

                {/* FORM */}

                <div className="p-5">

                  {/* ID + AKTİF/PASİF */}

                  <div className="mb-5 flex items-center justify-between gap-3">

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        ÜRÜN ID
                      </p>

                      <p className="font-bold text-gray-700">
                        #{item.id}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        updateItem(
                          item.id,
                          "is_active",
                          !item.is_active
                        )
                      }
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        item.is_active
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {item.is_active
                        ? "Ürünü Pasif Yap"
                        : "Ürünü Aktif Yap"}
                    </button>

                  </div>

                  {/* ÜRÜN ADI */}

                  <div className="mb-4">

                    <label className="mb-2 block text-sm font-bold">
                      Ürün Adı
                    </label>

                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                  {/* AÇIKLAMA */}

                  <div className="mb-4">

                    <label className="mb-2 block text-sm font-bold">
                      Açıklama
                    </label>

                    <textarea
                      value={item.description || ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "description",
                          e.target.value
                        )
                      }
                      rows={3}
                      placeholder="Ürün açıklaması..."
                      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                  {/* FİYAT + KATEGORİ */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    {/* FİYAT */}

                    <div>

                      <label className="mb-2 block text-sm font-bold">
                        Fiyat (TL)
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "price",
                            Number(e.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                      />

                    </div>

                    {/* KATEGORİ */}

                    <div>

                      <label className="mb-2 block text-sm font-bold">
                        Kategori
                      </label>

                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "category",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                      >

                        {categories.map((category) => (

                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>

                        ))}

                      </select>

                    </div>

                  </div>

                  {/* FOTOĞRAF URL */}

                  <div className="mt-4">

                    <label className="mb-2 block text-sm font-bold">
                      Fotoğraf URL
                    </label>

                    <input
                      type="text"
                      value={item.image || ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "image",
                          e.target.value
                        )
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Fotoğrafı değiştirmek için yeni görselin internet adresini buraya yapıştırabilirsiniz.
                    </p>

                  </div>

                  {/* KAYDET */}

                  <button
                    onClick={() => saveItem(item)}
                    disabled={savingId === item.id}
                    className="mt-5 w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
                  >
                    {savingId === item.id
                      ? "⏳ Kaydediliyor..."
                      : "💾 Değişiklikleri Kaydet"}
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* FOOTER */}

      <footer className="mt-8 border-t border-white/10 px-4 py-8 text-center">

        <p className="font-semibold text-[#e8c866]">
          EDREMİT SOSYAL TESİS MÜDÜRLÜĞÜ
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Menü Yönetim Paneli
        </p>

      </footer>

    </main>
  );
}