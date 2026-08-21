"use client";

import { useEffect, useRef, useState } from "react";
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

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [uploadingId, setUploadingId] =
    useState<number | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("Tümü");

  /*
   * Yeni ürün için seçilen fotoğrafları
   * henüz Supabase'e yüklemeden burada tutuyoruz.
   */
  const pendingFiles = useRef<{
    [key: number]: File | undefined;
  }>({});

  /*
   * Fotoğraf önizlemeleri
   */
  const previewUrls = useRef<{
    [key: number]: string | undefined;
  }>({});

  /*
   * Dosya inputları
   */
  const fileInputRefs = useRef<{
    [key: number]: HTMLInputElement | null;
  }>({});

  useEffect(() => {
    fetchMenu();
  }, []);

  /* =========================================================
     MENÜYÜ GETİR
     ========================================================= */

  const fetchMenu = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Menü alınamadı:",
        error
      );

      alert(
        `Menü alınamadı.\n\nKod: ${error.code}\nMesaj: ${error.message}`
      );

      setLoading(false);
      return;
    }

    setItems(
      (data || []).map((item: any) => ({
        id: Number(item.id),
        name: item.name || "",
        description: item.description || "",
        price: Number(item.price || 0),
        category:
          item.category ||
          categories[0],
        image: item.image || "",
        is_active:
          item.is_active !== false,
        created_at:
          item.created_at,
      }))
    );

    setLoading(false);
  };

  /* =========================================================
     ALAN GÜNCELLE
     ========================================================= */

  const updateItem = (
    id: number,
    field: keyof MenuItem,
    value:
      | string
      | number
      | boolean
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

  /* =========================================================
     YENİ ÜRÜN EKLE
     ========================================================= */

  const addNewItem = () => {
    /*
     * Veritabanındaki gerçek ID'lerle
     * çakışmaması için negatif geçici ID.
     */
    const temporaryId =
      -Date.now();

    const newItem: MenuItem = {
      id: temporaryId,
      name: "",
      description: "",
      price: 0,
      category: categories[0],
      image: "",
      is_active: true,
    };

    setItems((currentItems) => [
      newItem,
      ...currentItems,
    ]);

    /*
     * Yeni ürün eklendiğinde otomatik
     * olarak arama filtresini kaldır.
     */
    setSearch("");
    setSelectedCategory("Tümü");

    /*
     * Biraz aşağı kaydır.
     */
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
  };

  /* =========================================================
     FOTOĞRAF SEÇ
     ========================================================= */

  const handleFileChange = (
    item: MenuItem,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Sadece resim.
     */
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Lütfen bir fotoğraf dosyası seçin."
      );

      event.target.value = "";
      return;
    }

    /*
     * 10 MB sınırı.
     */
    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        "Fotoğraf en fazla 10 MB olabilir."
      );

      event.target.value = "";
      return;
    }

    /*
     * Eski preview varsa temizle.
     */
    if (
      previewUrls.current[item.id]
    ) {
      URL.revokeObjectURL(
        previewUrls.current[item.id]!
      );
    }

    /*
     * Dosyayı geçici olarak sakla.
     */
    pendingFiles.current[item.id] =
      file;

    /*
     * Önizleme oluştur.
     */
    const previewUrl =
      URL.createObjectURL(file);

    previewUrls.current[item.id] =
      previewUrl;

    /*
     * Ekranda önizleme olarak göster.
     */
    setItems((currentItems) =>
      currentItems.map(
        (currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                image: previewUrl,
              }
            : currentItem
      )
    );

    /*
     * Aynı dosyanın tekrar
     * seçilebilmesini sağlar.
     */
    event.target.value = "";
  };

  /* =========================================================
     STORAGE FOTOĞRAF YÜKLE
     ========================================================= */

  const uploadImage = async (
    itemId: number,
    file: File
  ) => {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const fileName =
      `${itemId}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${extension}`;

    const { error } =
      await supabase.storage
        .from("menu-images")
        .upload(
          fileName,
          file,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

    if (error) {
      throw error;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("menu-images")
      .getPublicUrl(
        fileName
      );

    return (
      publicUrlData.publicUrl
    );
  };

  /* =========================================================
     ÜRÜN KAYDET
     ========================================================= */

  const saveItem = async (
    item: MenuItem
  ) => {
    /*
     * Yeni ürün mü?
     */
    const isNew =
      item.id < 0;

    /*
     * Zorunlu alan kontrolü.
     */
    if (
      !item.name.trim()
    ) {
      alert(
        "Lütfen ürün adını girin."
      );
      return;
    }

    if (
      !item.category
    ) {
      alert(
        "Lütfen kategori seçin."
      );
      return;
    }

    if (
      Number(item.price) < 0
    ) {
      alert(
        "Fiyat 0'dan küçük olamaz."
      );
      return;
    }

    setSavingId(item.id);

    try {
      /*
       * =====================================================
       * YENİ ÜRÜN
       * =====================================================
       */

      if (isNew) {
        /*
         * Önce ürünü veritabanına ekliyoruz.
         */
        const {
          data: insertedData,
          error: insertError,
        } = await supabase
          .from("menu_items")
          .insert({
            name:
              item.name.trim(),

            description:
              item.description?.trim() ||
              "",

            price:
              Number(item.price) || 0,

            category:
              item.category,

            image: "",

            is_active:
              Boolean(
                item.is_active
              ),
          })
          .select("*")
          .single();

        if (insertError) {
          console.error(
            "Yeni ürün eklenemedi:",
            insertError
          );

          alert(
            `Yeni ürün eklenemedi.\n\nKod: ${insertError.code}\nMesaj: ${insertError.message}`
          );

          return;
        }

        let finalItem =
          insertedData as MenuItem;

        /*
         * Yeni ürüne fotoğraf seçildiyse
         * şimdi Storage'a yükle.
         */
        const pendingFile =
          pendingFiles.current[
            item.id
          ];

        if (pendingFile) {
          setUploadingId(
            item.id
          );

          try {
            const publicUrl =
              await uploadImage(
                finalItem.id,
                pendingFile
              );

            /*
             * Fotoğraf URL'sini
             * veritabanına kaydet.
             */
            const {
              data: updatedData,
              error:
                imageUpdateError,
            } =
              await supabase
                .from(
                  "menu_items"
                )
                .update({
                  image:
                    publicUrl,
                })
                .eq(
                  "id",
                  finalItem.id
                )
                .select("*")
                .single();

            if (
              imageUpdateError
            ) {
              console.error(
                "Fotoğraf URL'si kaydedilemedi:",
                imageUpdateError
              );

              alert(
                `Ürün eklendi fakat fotoğraf kaydedilemedi.\n\n${imageUpdateError.message}`
              );
            } else {
              finalItem =
                updatedData as MenuItem;
            }
          } catch (error: any) {
            console.error(
              "Fotoğraf yükleme hatası:",
              error
            );

            alert(
              `Ürün eklendi fakat fotoğraf yüklenemedi.\n\n${error?.message || "Bilinmeyen hata"}`
            );
          }

          setUploadingId(
            null
          );
        }

        /*
         * Geçici ürünü gerçek
         * ürünle değiştir.
         */
        setItems(
          (currentItems) =>
            currentItems.map(
              (currentItem) =>
                currentItem.id ===
                item.id
                  ? finalItem
                  : currentItem
            )
        );

        delete pendingFiles
          .current[item.id];

        if (
          previewUrls.current[
            item.id
          ]
        ) {
          URL.revokeObjectURL(
            previewUrls.current[
              item.id
            ]!
          );

          delete previewUrls
            .current[item.id];
        }

        alert(
          `"${finalItem.name}" başarıyla eklendi.`
        );

        return;
      }

      /*
       * =====================================================
       * MEVCUT ÜRÜN
       * =====================================================
       */

      let imageUrl =
        item.image;

      const pendingFile =
        pendingFiles.current[
          item.id
        ];

      /*
       * Yeni fotoğraf seçildiyse
       * önce Storage'a yükle.
       */
      if (pendingFile) {
        setUploadingId(
          item.id
        );

        try {
          imageUrl =
            await uploadImage(
              item.id,
              pendingFile
            );
        } catch (error: any) {
          console.error(
            "Fotoğraf yükleme hatası:",
            error
          );

          alert(
            `Fotoğraf yüklenemedi.\n\n${error?.message || "Bilinmeyen hata"}`
          );

          setUploadingId(
            null
          );
          return;
        }

        setUploadingId(
          null
        );
      }

      /*
       * Supabase'e kaydet.
       */
      const {
        data,
        error,
      } = await supabase
        .from("menu_items")
        .update({
          name:
            item.name.trim(),

          description:
            item.description?.trim() ||
            "",

          price:
            Number(item.price) || 0,

          category:
            item.category,

          image:
            imageUrl,

          is_active:
            Boolean(
              item.is_active
            ),
        })
        .eq(
          "id",
          item.id
        )
        .select("*")
        .single();

      if (error) {
        console.error(
          "Ürün kaydedilemedi:",
          error
        );

        alert(
          `Ürün kaydedilemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
        );

        return;
      }

      const updatedItem =
        data as MenuItem;

      /*
       * Ekranı güncelle.
       */
      setItems(
        (currentItems) =>
          currentItems.map(
            (currentItem) =>
              currentItem.id ===
              updatedItem.id
                ? updatedItem
                : currentItem
          )
      );

      /*
       * Geçici dosya bilgisini temizle.
       */
      delete pendingFiles
        .current[item.id];

      if (
        previewUrls.current[
          item.id
        ]
      ) {
        URL.revokeObjectURL(
          previewUrls.current[
            item.id
          ]!
        );

        delete previewUrls
          .current[item.id];
      }

      alert(
        `"${updatedItem.name}" başarıyla kaydedildi.`
      );
    } finally {
      setSavingId(null);
      setUploadingId(null);
    }
  };

  /* =========================================================
     ÜRÜN SİL
     ========================================================= */

  const deleteItem = async (
    item: MenuItem
  ) => {
    /*
     * Yeni ve henüz kaydedilmemiş
     * ürünse sadece ekrandan kaldır.
     */
    if (item.id < 0) {
      if (
        previewUrls.current[
          item.id
        ]
      ) {
        URL.revokeObjectURL(
          previewUrls.current[
            item.id
          ]!
        );
      }

      delete previewUrls
        .current[item.id];

      delete pendingFiles
        .current[item.id];

      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.id !==
              item.id
          )
      );

      return;
    }

    const confirmed =
      window.confirm(
        `"${item.name}" ürününü silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      item.id
    );

    try {
      /*
       * Önce veritabanındaki ürünü sil.
       */
      const {
        error,
      } = await supabase
        .from("menu_items")
        .delete()
        .eq(
          "id",
          item.id
        );

      if (error) {
        console.error(
          "Ürün silinemedi:",
          error
        );

        alert(
          `Ürün silinemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
        );

        return;
      }

      /*
       * Ekrandan kaldır.
       */
      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.id !==
              item.id
          )
      );

      /*
       * Geçici bilgileri temizle.
       */
      delete pendingFiles
        .current[item.id];

      if (
        previewUrls.current[
          item.id
        ]
      ) {
        URL.revokeObjectURL(
          previewUrls.current[
            item.id
          ]!
        );

        delete previewUrls
          .current[item.id];
      }

      alert(
        `"${item.name}" başarıyla silindi.`
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     ÜRÜN FİLTRELEME
     ========================================================= */

  const filteredItems =
    items.filter((item) => {
      const searchText =
        search.toLocaleLowerCase(
          "tr-TR"
        );

      const matchesSearch =
        item.name
          .toLocaleLowerCase(
            "tr-TR"
          )
          .includes(searchText) ||
        (item.description ||
          "")
          .toLocaleLowerCase(
            "tr-TR"
          )
          .includes(searchText);

      const matchesCategory =
        selectedCategory ===
          "Tümü" ||
        item.category ===
          selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  return (
    <main className="min-h-screen bg-[#061b3d] pb-16 text-white">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="border-b border-white/10 bg-[#04152f] px-4 py-6">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm tracking-[0.25em] text-[#e8c866]">
                EDREMİT SOSYAL TESİS
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                ⚙️ Menü Yönetim Paneli
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Menü ürünlerini buradan
                ekleyebilir, düzenleyebilir
                ve silebilirsiniz.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">

                <a
                  href="/garson"
                  className="inline-flex rounded-xl bg-white px-5 py-3 font-bold text-[#061b3d] shadow transition hover:bg-gray-100 active:scale-95"
                >
                  👨‍🍳 Garson Paneline Dön
                </a>

                <button
                  onClick={addNewItem}
                  className="inline-flex rounded-xl bg-[#e8c866] px-5 py-3 font-bold text-[#061b3d] shadow-lg transition hover:bg-[#f1d477] active:scale-95"
                >
                  ➕ Yeni Ürün Ekle
                </button>

              </div>

            </div>

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

      {/* =====================================================
          KONTROLLER
          ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 pt-6">

        <div className="rounded-3xl bg-white p-5 text-gray-900 shadow-2xl">

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">

            <div>

              <label className="mb-2 block text-sm font-bold">
                🔎 Menüde Ara
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Ürün adı veya açıklama ara..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
              />

            </div>

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

              {[
                "Tümü",
                ...categories,
              ].map(
                (category) => (

                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedCategory ===
                      category
                        ? "border-[#061b3d] bg-[#061b3d] text-white"
                        : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {category}
                  </button>

                )
              )}

            </div>

          </div>

          <div className="mt-4 text-sm text-gray-500">
            {filteredItems.length} ürün gösteriliyor.
          </div>

        </div>

      </section>

      {/* =====================================================
          ÜRÜNLER
          ===================================================== */}

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
              Arama veya kategori
              filtresini değiştirmeyi
              deneyin.
            </p>

            <button
              onClick={addNewItem}
              className="mt-5 rounded-xl bg-[#061b3d] px-6 py-3 font-bold text-white"
            >
              ➕ Yeni Ürün Ekle
            </button>

          </div>

        ) : (

          <div className="grid gap-5 lg:grid-cols-2">

            {filteredItems.map(
              (item) => (

                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl"
                >

                  {/* =================================================
                      FOTOĞRAF
                      ================================================= */}

                  <div className="relative h-56 bg-gray-100">

                    {item.image ? (

                      <img
                        src={item.image}
                        alt={
                          item.name ||
                          "Ürün"
                        }
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

                    {item.id < 0 && (

                      <div className="absolute left-3 top-3 rounded-full bg-[#e8c866] px-4 py-2 text-sm font-bold text-[#061b3d] shadow">
                        YENİ ÜRÜN
                      </div>

                    )}

                  </div>

                  {/* =================================================
                      FORM
                      ================================================= */}

                  <div className="p-5">

                    {/* ID + AKTİF/PASİF */}

                    <div className="mb-5 flex items-center justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold text-gray-400">
                          {item.id < 0
                            ? "DURUM"
                            : "ÜRÜN ID"}
                        </p>

                        <p className="font-bold text-gray-700">
                          {item.id < 0
                            ? "Henüz kaydedilmedi"
                            : `#${item.id}`}
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
                        placeholder="Örn: Adana Kebap"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                      />

                    </div>

                    {/* AÇIKLAMA */}

                    <div className="mb-4">

                      <label className="mb-2 block text-sm font-bold">
                        Açıklama
                      </label>

                      <textarea
                        value={
                          item.description ||
                          ""
                        }
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

                      <div>

                        <label className="mb-2 block text-sm font-bold">
                          Fiyat (TL)
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            item.price
                          }
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "price",
                              Number(
                                e.target
                                  .value
                              )
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                        />

                      </div>

                      <div>

                        <label className="mb-2 block text-sm font-bold">
                          Kategori
                        </label>

                        <select
                          value={
                            item.category
                          }
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "category",
                              e.target
                                .value
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                        >

                          {categories.map(
                            (
                              category
                            ) => (

                              <option
                                key={
                                  category
                                }
                                value={
                                  category
                                }
                              >
                                {
                                  category
                                }
                              </option>

                            )
                          )}

                        </select>

                      </div>

                    </div>

                    {/* =================================================
                        FOTOĞRAF SEÇ
                        ================================================= */}

                    <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">

                      <label className="mb-2 block text-sm font-bold text-gray-900">
                        📷 Menü Fotoğrafı
                      </label>

                      <p className="mb-3 text-xs text-gray-500">
                        Bilgisayarınızdan ürün
                        fotoğrafı seçin.
                        En fazla 10 MB.
                      </p>

                      <input
                        ref={(element) => {
                          fileInputRefs.current[
                            item.id
                          ] =
                            element;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(
                            item,
                            e
                          )
                        }
                        className="hidden"
                      />

                      <button
                        type="button"
                        disabled={
                          uploadingId ===
                          item.id
                        }
                        onClick={() =>
                          fileInputRefs.current[
                            item.id
                          ]?.click()
                        }
                        className="w-full rounded-xl bg-[#061b3d] px-5 py-3 font-bold text-white transition hover:bg-[#0b2d62] disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                      >
                        {uploadingId ===
                        item.id
                          ? "⏳ Fotoğraf Yükleniyor..."
                          : "📷 Bilgisayardan Fotoğraf Seç"}
                      </button>

                      {pendingFiles.current[
                        item.id
                      ] && (

                        <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs font-semibold text-blue-700">
                          📷 Yeni fotoğraf
                          seçildi.
                          <br />
                          Kaydet
                          butonuna
                          basınca
                          yüklenecek.
                        </p>

                      )}

                    </div>

                    {/* =================================================
                        KAYDET
                        ================================================= */}

                    <button
                      onClick={() =>
                        saveItem(
                          item
                        )
                      }
                      disabled={
                        savingId ===
                          item.id ||
                        uploadingId ===
                          item.id ||
                        deletingId ===
                          item.id
                      }
                      className="mt-5 w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
                    >
                      {savingId ===
                      item.id
                        ? "⏳ Kaydediliyor..."
                        : "💾 Kaydet"}
                    </button>

                    {/* =================================================
                        SİL
                        ================================================= */}

                    <button
                      onClick={() =>
                        deleteItem(
                          item
                        )
                      }
                      disabled={
                        savingId ===
                          item.id ||
                        uploadingId ===
                          item.id ||
                        deletingId ===
                          item.id
                      }
                      className="mt-3 w-full rounded-xl border-2 border-red-500 bg-white py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
                    >
                      {deletingId ===
                      item.id
                        ? "⏳ Siliniyor..."
                        : "🗑️ Ürünü Sil"}
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

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