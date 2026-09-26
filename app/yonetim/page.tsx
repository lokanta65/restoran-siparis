"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
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

type Category = {
  id: number;
  name: string;
  image: string;
};

const fallbackCategories = [
  "Kahvaltı",
  "Omlet ve Yumurta Çeşitleri",
  "Ara Sıcaklar",
  "Fast Food",
  "Çorbalar",
  "Ana Yemekler",
  "Pide Çeşitleri",
];

export default function YonetimPage() {
  /* =========================================================
     ÇIKIŞ
     ========================================================= */

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }

    window.location.href = "/giris";
  };

  /* =========================================================
     GENEL STATE
     ========================================================= */

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

  /* =========================================================
     KATEGORİ STATE
     ========================================================= */

  const [categoryList, setCategoryList] =
    useState<Category[]>([]);

  const [categoryLoading, setCategoryLoading] =
    useState(true);

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [newCategoryImage, setNewCategoryImage] =
    useState<File | null>(null);

  const [editingCategoryId, setEditingCategoryId] =
    useState<number | null>(null);

  const [editingCategoryName, setEditingCategoryName] =
    useState("");

  const [editingCategoryImage, setEditingCategoryImage] =
    useState<File | null>(null);

  const [savingCategory, setSavingCategory] =
    useState(false);

  const [deletingCategoryId, setDeletingCategoryId] =
    useState<number | null>(null);

  /* =========================================================
     AYARLAR / ŞİFRE STATE
     ========================================================= */

  const [showSettings, setShowSettings] =
    useState(false);

  const [passwordTarget, setPasswordTarget] =
    useState("garson");

  const [adminPassword, setAdminPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [newPasswordAgain, setNewPasswordAgain] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  /* =========================================================
     ŞİFRE DEĞİŞTİR
     ========================================================= */

  const changePassword = async () => {
    if (
      !adminPassword ||
      !newPassword ||
      !newPasswordAgain
    ) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    if (newPassword.length < 6) {
      alert(
        "Yeni şifre en az 6 karakter olmalıdır."
      );
      return;
    }

    if (newPassword !== newPasswordAgain) {
      alert("Yeni şifreler aynı değil.");
      return;
    }

    setChangingPassword(true);

    try {
      const { data, error } =
        await supabase.rpc(
          "admin_change_app_password",
          {
            p_admin_username: "admin",
            p_admin_password: adminPassword,
            p_target_username: passwordTarget,
            p_new_password: newPassword,
          }
        );

      if (error) {
        console.error(
          "Şifre değiştirme hatası:",
          error
        );

        alert(
          `Şifre değiştirilemedi.\n\n${error.message}`
        );

        return;
      }

      if (!data) {
        alert(
          "Mevcut admin şifresi hatalı veya işlem başarısız."
        );

        return;
      }

      alert(
        passwordTarget === "admin"
          ? "Yönetici şifresi başarıyla değiştirildi."
          : passwordTarget === "mutfak"
            ? "Mutfak şifresi başarıyla değiştirildi."
            : "Garson şifresi başarıyla değiştirildi."
      );

      setAdminPassword("");
      setNewPassword("");
      setNewPasswordAgain("");

      setShowSettings(false);
    } finally {
      setChangingPassword(false);
    }
  };

  /* =========================================================
     YENİ ÜRÜN İÇİN DOSYA
     ========================================================= */

  const pendingFiles = useRef<{
    [key: number]: File | undefined;
  }>({});

  /* =========================================================
     FOTOĞRAF ÖNİZLEMELERİ
     ========================================================= */

  const previewUrls = useRef<{
    [key: number]: string | undefined;
  }>({});

  /* =========================================================
     DOSYA INPUTLARI
     ========================================================= */

  const fileInputRefs = useRef<{
    [key: number]: HTMLInputElement | null;
  }>({});

  /* =========================================================
     MENÜ VE KATEGORİLERİ YÜKLE
     ========================================================= */

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, []);

  /* =========================================================
     KATEGORİLERİ GETİR
     ========================================================= */

  const fetchCategories = async () => {
    setCategoryLoading(true);

    const { data, error } = await supabase
      .from("menu_categories")
      .select("id,name,image")
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Kategoriler alınamadı:",
        error
      );

      alert(
        `Kategoriler alınamadı.\n\nKod: ${error.code}\nMesaj: ${error.message}`
      );

      setCategoryLoading(false);
      return;
    }

    setCategoryList(
      (data || []).map((category: any) => ({
        id: Number(category.id),
        name: category.name || "",
        image: category.image || "",
      }))
    );

    setCategoryLoading(false);
  };

  /* =========================================================
     KULLANILACAK KATEGORİ LİSTESİ
     ========================================================= */

  const availableCategories =
    categoryList.length > 0
      ? categoryList.map(
          (category) => category.name
        )
      : fallbackCategories;

  /* =========================================================
     KATEGORİ FOTOĞRAFI KONTROLÜ
     ========================================================= */

  const validateCategoryImage = (
    file: File
  ) => {
    if (!file.type.startsWith("image/")) {
      alert(
        "Lütfen bir fotoğraf dosyası seçin."
      );
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(
        "Fotoğraf en fazla 10 MB olabilir."
      );
      return false;
    }

    return true;
  };

  /* =========================================================
     YENİ KATEGORİ FOTOĞRAFI SEÇ
     ========================================================= */

  const handleNewCategoryImage = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateCategoryImage(file)) {
      event.target.value = "";
      return;
    }

    setNewCategoryImage(file);
    event.target.value = "";
  };

  /* =========================================================
     KATEGORİ DÜZENLEME FOTOĞRAFI SEÇ
     ========================================================= */

  const handleEditingCategoryImage = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateCategoryImage(file)) {
      event.target.value = "";
      return;
    }

    setEditingCategoryImage(file);
    event.target.value = "";
  };

  /* =========================================================
     KATEGORİ FOTOĞRAFI YÜKLE
     ========================================================= */

  const uploadCategoryImage = async (
    file: File,
    categoryId?: number
  ) => {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const prefix =
      categoryId !== undefined
        ? `category-${categoryId}`
        : "category";

    const fileName =
      `${prefix}-${Date.now()}-${Math.random()
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

    const { data } =
      supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);

    return data.publicUrl;
  };

  /* =========================================================
     YENİ KATEGORİ EKLE
     ========================================================= */

  const addCategory = async () => {
    const name =
      newCategoryName.trim();

    if (!name) {
      alert("Lütfen kategori adı girin.");
      return;
    }

    const duplicate =
      categoryList.some(
        (category) =>
          category.name.toLocaleLowerCase(
            "tr-TR"
          ) ===
          name.toLocaleLowerCase(
            "tr-TR"
          )
      );

    if (duplicate) {
      alert(
        "Bu kategori zaten mevcut."
      );
      return;
    }

    setSavingCategory(true);

    try {
      let imageUrl = "";

      if (newCategoryImage) {
        imageUrl =
          await uploadCategoryImage(
            newCategoryImage
          );
      }

      const { error } =
        await supabase
          .from("menu_categories")
          .insert({
            name,
            image: imageUrl,
          });

      if (error) {
        console.error(
          "Kategori eklenemedi:",
          error
        );

        alert(
          `Kategori eklenemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
        );

        return;
      }

      setNewCategoryName("");
      setNewCategoryImage(null);

      await fetchCategories();

      alert(
        `"${name}" kategorisi başarıyla eklendi.`
      );
    } catch (error: any) {
      console.error(
        "Kategori ekleme hatası:",
        error
      );

      alert(
        `Kategori eklenemedi.\n\n${
          error?.message ||
          "Bilinmeyen hata"
        }`
      );
    } finally {
      setSavingCategory(false);
    }
  };

  /* =========================================================
     KATEGORİ DÜZENLEME BAŞLAT
     ========================================================= */

  const startEditCategory = (
    category: Category
  ) => {
    setEditingCategoryId(
      category.id
    );

    setEditingCategoryName(
      category.name
    );

    setEditingCategoryImage(null);
  };

  /* =========================================================
     KATEGORİ DÜZENLEME İPTAL
     ========================================================= */

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingCategoryImage(null);
  };

  /* =========================================================
     KATEGORİ KAYDET
     ========================================================= */

  const saveCategory = async () => {
    if (editingCategoryId === null) {
      return;
    }

    const name =
      editingCategoryName.trim();

    if (!name) {
      alert(
        "Kategori adı boş olamaz."
      );
      return;
    }

    const currentCategory =
      categoryList.find(
        (category) =>
          category.id ===
          editingCategoryId
      );

    if (!currentCategory) {
      return;
    }

    const oldName =
      currentCategory.name;

    const duplicate =
      categoryList.some(
        (category) =>
          category.id !==
            editingCategoryId &&
          category.name.toLocaleLowerCase(
            "tr-TR"
          ) ===
            name.toLocaleLowerCase(
              "tr-TR"
            )
      );

    if (duplicate) {
      alert(
        "Bu kategori adı zaten kullanılıyor."
      );
      return;
    }

    setSavingCategory(true);

    let productsRenamed = false;

    try {
      let imageUrl =
        currentCategory.image || "";

      /* -----------------------------------------------------
         YENİ GÖRSEL VARSA YÜKLE
         ----------------------------------------------------- */

      if (editingCategoryImage) {
        imageUrl =
          await uploadCategoryImage(
            editingCategoryImage,
            editingCategoryId
          );
      }

      /* -----------------------------------------------------
         KATEGORİ ADI DEĞİŞTİYSE ÜRÜNLERİ DE AKTAR
         ----------------------------------------------------- */

      if (oldName !== name) {
        const { error: productsError } =
          await supabase
            .from("menu_items")
            .update({
              category: name,
            })
            .eq(
              "category",
              oldName
            );

        if (productsError) {
          console.error(
            "Kategoriye bağlı ürünler güncellenemedi:",
            productsError
          );

          alert(
            `Kategori adı değiştirilemedi.\n\nÜrünler yeni kategoriye aktarılamadı.\n\n${productsError.message}`
          );

          return;
        }

        productsRenamed = true;
      }

      /* -----------------------------------------------------
         KATEGORİYİ GÜNCELLE
         ----------------------------------------------------- */

      const { error } =
        await supabase
          .from("menu_categories")
          .update({
            name,
            image: imageUrl,
          })
          .eq(
            "id",
            editingCategoryId
          );

      if (error) {
        console.error(
          "Kategori güncellenemedi:",
          error
        );

        /* ---------------------------------------------------
           KATEGORİ GÜNCELLENEMEDİYSE
           ÜRÜNLERİ ESKİ KATEGORİYE GERİ AL
           --------------------------------------------------- */

        if (productsRenamed) {
          await supabase
            .from("menu_items")
            .update({
              category: oldName,
            })
            .eq(
              "category",
              name
            );
        }

        alert(
          `Kategori güncellenemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
        );

        return;
      }

      /* -----------------------------------------------------
         SEÇİLİ FİLTREYİ YENİ İSME ÇEVİR
         ----------------------------------------------------- */

      if (
        selectedCategory === oldName
      ) {
        setSelectedCategory(name);
      }

      setEditingCategoryId(null);
      setEditingCategoryName("");
      setEditingCategoryImage(null);

      await Promise.all([
        fetchCategories(),
        fetchMenu(),
      ]);

      alert(
        `"${name}" kategorisi başarıyla güncellendi.`
      );
    } catch (error: any) {
      console.error(
        "Kategori güncelleme hatası:",
        error
      );

      alert(
        `Kategori güncellenemedi.\n\n${
          error?.message ||
          "Bilinmeyen hata"
        }`
      );
    } finally {
      setSavingCategory(false);
    }
  };

  /* =========================================================
     KATEGORİ SİL
     ========================================================= */

  const deleteCategory = async (
    category: Category
  ) => {
    const { count, error: countError } =
      await supabase
        .from("menu_items")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "category",
          category.name
        );

    if (countError) {
      alert(
        `Kategori kontrol edilemedi.\n\n${countError.message}`
      );
      return;
    }

    if ((count || 0) > 0) {
      alert(
        `"${category.name}" kategorisi silinemiyor.\n\nBu kategoriye bağlı ${count} ürün bulunuyor.\n\nÖnce bu ürünleri başka bir kategoriye taşımanız gerekiyor.`
      );
      return;
    }

    const confirmed =
      window.confirm(
        `"${category.name}" kategorisini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingCategoryId(
      category.id
    );

    try {
      const { error } =
        await supabase
          .from("menu_categories")
          .delete()
          .eq(
            "id",
            category.id
          );

      if (error) {
        console.error(
          "Kategori silinemedi:",
          error
        );

        alert(
          `Kategori silinemedi.\n\nKod: ${error.code}\nMesaj: ${error.message}`
        );

        return;
      }

      if (
        selectedCategory ===
        category.name
      ) {
        setSelectedCategory(
          "Tümü"
        );
      }

      if (
        editingCategoryId ===
        category.id
      ) {
        cancelEditCategory();
      }

      await fetchCategories();

      alert(
        `"${category.name}" kategorisi silindi.`
      );
    } finally {
      setDeletingCategoryId(null);
    }
  };

  /* =========================================================
     MENÜYÜ GETİR
     ========================================================= */

  const fetchMenu = async () => {
    setLoading(true);

    const { data, error } =
      await supabase
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
      (data || []).map(
        (item: any) => ({
          id: Number(item.id),
          name: item.name || "",
          description:
            item.description || "",
          price: Number(
            item.price || 0
          ),
          category:
            item.category ||
            availableCategories[0] ||
            "",
          image:
            item.image || "",
          is_active:
            item.is_active !== false,
          created_at:
            item.created_at,
        })
      )
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
    setItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
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
    const temporaryId =
      -Date.now();

    const newItem: MenuItem = {
      id: temporaryId,
      name: "",
      description: "",
      price: 0,
      category:
        availableCategories[0] ||
        "",
      image: "",
      is_active: true,
    };

    setItems(
      (currentItems) => [
        newItem,
        ...currentItems,
      ]
    );

    setSearch("");
    setSelectedCategory("Tümü");

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
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

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

    pendingFiles.current[
      item.id
    ] = file;

    const previewUrl =
      URL.createObjectURL(file);

    previewUrls.current[
      item.id
    ] = previewUrl;

    setItems(
      (currentItems) =>
        currentItems.map(
          (currentItem) =>
            currentItem.id ===
            item.id
              ? {
                  ...currentItem,
                  image:
                    previewUrl,
                }
              : currentItem
        )
    );

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
    } =
      supabase.storage
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
    const isNew =
      item.id < 0;

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
      if (isNew) {
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
              Number(item.price) ||
              0,

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
              `Ürün eklendi fakat fotoğraf yüklenemedi.\n\n${
                error?.message ||
                "Bilinmeyen hata"
              }`
            );
          }

          setUploadingId(
            null
          );
        }

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

      let imageUrl =
        item.image;

      const pendingFile =
        pendingFiles.current[
          item.id
        ];

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
            `Fotoğraf yüklenemedi.\n\n${
              error?.message ||
              "Bilinmeyen hata"
            }`
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
            Number(item.price) ||
            0,

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

      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.id !==
              item.id
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
        (
          item.description ||
          ""
        )
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

              <div className="mt-2 flex items-center gap-3">

                <h1 className="text-3xl font-bold">
                  Menü Yönetim Paneli
                </h1>

                <button
                  type="button"
                  onClick={() =>
                    setShowSettings(true)
                  }
                  aria-label="Ayarlar"
                  title="Ayarlar"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl transition hover:bg-white/20 active:scale-95"
                >
                  ⚙️
                </button>

              </div>

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

                <a
                  href="/mutfak"
                  className="inline-flex rounded-xl bg-white px-5 py-3 font-bold text-[#061b3d] shadow transition hover:bg-gray-100 active:scale-95"
                >
                  🍳 Mutfak Paneline Geç
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
          ŞİFRE YÖNETİMİ MODALI
          ===================================================== */}

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() =>
            setShowSettings(false)
          }
        >

          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 text-gray-900 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="mb-6 flex items-start justify-between gap-4">

              <div>

                <h2 className="text-2xl font-bold">
                  🔐 Şifre Yönetimi
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Yönetici, garson veya mutfak
                  hesabının şifresini
                  değiştirebilirsiniz.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSettings(false)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-700 transition hover:bg-gray-200 active:scale-95"
              >
                ×
              </button>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Değiştirilecek hesap
                </label>

                <select
                  value={passwordTarget}
                  onChange={(e) =>
                    setPasswordTarget(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="garson">
                    Garson
                  </option>

                  <option value="mutfak">
                    Mutfak
                  </option>

                  <option value="admin">
                    Yönetici
                  </option>
                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Mevcut admin şifresi
                </label>

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) =>
                    setAdminPassword(
                      e.target.value
                    )
                  }
                  placeholder="Mevcut admin şifresi"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Yeni şifre
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="En az 6 karakter"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Yeni şifre tekrar
                </label>

                <input
                  type="password"
                  value={newPasswordAgain}
                  onChange={(e) =>
                    setNewPasswordAgain(
                      e.target.value
                    )
                  }
                  placeholder="Yeni şifreyi tekrar girin"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  setShowSettings(false)
                }
                className="flex-1 rounded-xl border-2 border-gray-300 bg-white py-3 font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95"
              >
                İptal
              </button>

              <button
                type="button"
                onClick={changePassword}
                disabled={
                  changingPassword
                }
                className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
              >
                {changingPassword
                  ? "Şifre değiştiriliyor..."
                  : "🔐 Şifreyi Değiştir"}
              </button>

            </div>

          </div>

        </div>
      )}

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
                onClick={() => {
                  fetchMenu();
                  fetchCategories();
                }}
                className="w-full rounded-xl bg-[#061b3d] px-6 py-3 font-bold text-white transition hover:bg-[#0b2d62] active:scale-95 md:w-auto"
              >
                🔄 Yenile
              </button>

            </div>

          </div>

          {/* =================================================
              KATEGORİLER
              ================================================= */}

          <div className="mt-5 border-t border-gray-200 pt-5">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <label className="block text-sm font-bold">
                  📂 Kategoriler
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  Kategorileri ekleyebilir,
                  isimlerini ve görsellerini
                  değiştirebilirsiniz.
                </p>

              </div>

              <div className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600">
                {categoryLoading
                  ? "Yükleniyor..."
                  : `${categoryList.length} kategori`}
              </div>

            </div>

            {/* KATEGORİ FİLTRELERİ */}

            <div className="mt-4">

              <label className="mb-2 block text-sm font-bold">
                Menü Filtresi
              </label>

              <div className="flex gap-2 overflow-x-auto pb-2">

                {[
                  "Tümü",
                  ...availableCategories,
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

            {/* YENİ KATEGORİ EKLE */}

            <div className="mt-5 rounded-2xl border-2 border-dashed border-[#061b3d]/20 bg-gray-50 p-4">

              <h3 className="text-base font-bold text-[#061b3d]">
                ➕ Yeni Kategori Ekle
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">

                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) =>
                    setNewCategoryName(
                      e.target.value
                    )
                  }
                  placeholder="Kategori adı"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                />

                <label className="flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleNewCategoryImage
                    }
                    className="hidden"
                  />

                  📷{" "}
                  <span className="ml-2 truncate">
                    {newCategoryImage
                      ? newCategoryImage.name
                      : "Kategori görseli seç"}
                  </span>

                </label>

                <button
                  type="button"
                  onClick={addCategory}
                  disabled={
                    savingCategory
                  }
                  className="rounded-xl bg-[#061b3d] px-5 py-3 font-bold text-white transition hover:bg-[#0b2d62] disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  {savingCategory
                    ? "⏳ Kaydediliyor..."
                    : "➕ Kategori Ekle"}
                </button>

              </div>

              {newCategoryImage && (
                <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs font-semibold text-blue-700">
                  📷 Görsel seçildi:
                  {" "}
                  {newCategoryImage.name}
                </p>
              )}

            </div>

            {/* KATEGORİ YÖNETİM KARTLARI */}

            <div className="mt-5">

              {categoryLoading ? (

                <div className="rounded-2xl bg-gray-50 p-6 text-center text-gray-500">
                  ⏳ Kategoriler yükleniyor...
                </div>

              ) : categoryList.length === 0 ? (

                <div className="rounded-2xl bg-gray-50 p-6 text-center text-gray-500">
                  Henüz kategori bulunmuyor.
                </div>

              ) : (

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                  {categoryList.map(
                    (category) => {

                      const isEditing =
                        editingCategoryId ===
                        category.id;

                      return (
                        <div
                          key={
                            category.id
                          }
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >

                          {/* KATEGORİ GÖRSELİ */}

                          <div className="relative h-40 bg-gray-100">

                            {category.image ? (

                              <img
                                src={
                                  category.image
                                }
                                alt={
                                  category.name
                                }
                                className="h-full w-full object-cover"
                              />

                            ) : (

                              <div className="flex h-full items-center justify-center text-5xl">
                                📂
                              </div>

                            )}

                            <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                              #{category.id}
                            </div>

                          </div>

                          <div className="p-4">

                            {!isEditing ? (

                              <>
                                <h4 className="text-lg font-bold text-[#061b3d]">
                                  {
                                    category.name
                                  }
                                </h4>

                                <p className="mt-1 text-xs text-gray-500">
                                  {category.image
                                    ? "Görsel mevcut"
                                    : "Görsel eklenmemiş"}
                                </p>

                                <div className="mt-4 flex gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditCategory(
                                        category
                                      )
                                    }
                                    className="flex-1 rounded-xl bg-[#061b3d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0b2d62] active:scale-95"
                                  >
                                    ✏️ Düzenle
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteCategory(
                                        category
                                      )
                                    }
                                    disabled={
                                      deletingCategoryId ===
                                      category.id
                                    }
                                    className="rounded-xl border-2 border-red-500 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                                  >
                                    {deletingCategoryId ===
                                    category.id
                                      ? "⏳"
                                      : "🗑️"}
                                  </button>

                                </div>
                              </>

                            ) : (

                              <>
                                <label className="mb-2 block text-sm font-bold">
                                  Kategori Adı
                                </label>

                                <input
                                  type="text"
                                  value={
                                    editingCategoryName
                                  }
                                  onChange={(e) =>
                                    setEditingCategoryName(
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                                />

                                <label className="mt-4 flex cursor-pointer items-center rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">

                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                      handleEditingCategoryImage
                                    }
                                    className="hidden"
                                  />

                                  📷

                                  <span className="ml-2 truncate">
                                    {editingCategoryImage
                                      ? editingCategoryImage.name
                                      : "Görseli değiştir"}
                                  </span>

                                </label>

                                {editingCategoryImage && (
                                  <p className="mt-2 rounded-lg bg-blue-50 p-2 text-xs font-semibold text-blue-700">
                                    Yeni görsel seçildi.
                                    {" "}
                                    Kaydettiğinizde
                                    yüklenecek.
                                  </p>
                                )}

                                <div className="mt-4 flex gap-2">

                                  <button
                                    type="button"
                                    onClick={
                                      saveCategory
                                    }
                                    disabled={
                                      savingCategory
                                    }
                                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                                  >
                                    {savingCategory
                                      ? "⏳ Kaydediliyor..."
                                      : "💾 Kaydet"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      cancelEditCategory
                                    }
                                    disabled={
                                      savingCategory
                                    }
                                    className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                                  >
                                    İptal
                                  </button>

                                </div>
                              </>

                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

            <div className="text-sm text-gray-500">
              {filteredItems.length} ürün gösteriliyor.
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white shadow transition hover:bg-red-700 active:scale-95"
            >
              🚪 Çıkış Yap
            </button>

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

                  {/* FOTOĞRAF */}

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

                  {/* FORM */}

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
                        value={
                          item.name
                        }
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
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#061b3d] focus:ring-2 focus:ring-blue-100"
                        >

                          {!availableCategories.includes(
                            item.category
                          ) &&
                            item.category && (
                              <option
                                value={
                                  item.category
                                }
                              >
                                {
                                  item.category
                                }
                              </option>
                            )}

                          {availableCategories.map(
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

                    {/* FOTOĞRAF */}

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

                    {/* KAYDET */}

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

                    {/* SİL */}

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