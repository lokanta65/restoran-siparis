const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

let nextProcess = null;
let mainWindow = null;

const PORT = 3000;
const HOST = "0.0.0.0";
const LOCAL_URL = `http://127.0.0.1:${PORT}`;

/*
 * ---------------------------------------------------------
 * NEXT.JS SUNUCUSUNUN HAZIR OLUP OLMADIĞINI KONTROL ET
 * ---------------------------------------------------------
 */

function waitForServer(url, callback, attempts = 120) {
  const request = http.get(url, (response) => {
    response.resume();

    console.log(
      `Next.js cevap verdi. HTTP ${response.statusCode}`
    );

    callback();
  });

  request.on("error", () => {
    if (attempts <= 0) {
      console.error(
        "Next.js sunucusu başlatılamadı."
      );

      return;
    }

    setTimeout(() => {
      waitForServer(
        url,
        callback,
        attempts - 1
      );
    }, 500);
  });

  request.setTimeout(1500, () => {
    request.destroy();
  });
}

/*
 * ---------------------------------------------------------
 * ELECTRON ANA PENCERE
 * ---------------------------------------------------------
 */

function createWindow() {
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,

    minWidth: 1000,
    minHeight: 700,

    title: "Restoran Sipariş",

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  /*
   * Uygulama açıldığında GARSON PANELİ açılır.
   *
   * Yönetim paneline Garson Panelindeki
   * "Yönetim Paneli" butonundan geçilir.
   */

  const garsonUrl =
    `${LOCAL_URL}/garson`;

  console.log(
    "Garson Paneli açılıyor:",
    garsonUrl
  );

  mainWindow.loadURL(garsonUrl);

  /*
   * Sayfa yükleme hatasını konsola yaz.
   */

  mainWindow.webContents.on(
    "did-fail-load",
    (
      event,
      errorCode,
      errorDescription,
      validatedURL
    ) => {
      console.error(
        "Electron sayfa yükleme hatası:",
        {
          errorCode,
          errorDescription,
          validatedURL,
        }
      );
    }
  );

  /*
   * Sayfa başarıyla yüklendiğinde bilgi ver.
   */

  mainWindow.webContents.on(
    "did-finish-load",
    () => {
      console.log(
        "Garson Paneli Electron içinde açıldı."
      );
    }
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/*
 * ---------------------------------------------------------
 * NEXT.JS SERVER.JS DOSYASININ YOLUNU BUL
 * ---------------------------------------------------------
 */

function getServerPath() {
  const isPackaged = app.isPackaged;

  if (isPackaged) {
    return path.join(
      process.resourcesPath,
      "standalone",
      "server.js"
    );
  }

  return path.join(
    __dirname,
    ".next",
    "standalone",
    "server.js"
  );
}

/*
 * ---------------------------------------------------------
 * NEXT.JS SUNUCUSUNU BAŞLAT
 * ---------------------------------------------------------
 */

function startNextServer() {
  const isPackaged = app.isPackaged;

  const serverPath = getServerPath();

  console.log("--------------------------------");
  console.log("Restoran Sipariş başlatılıyor...");
  console.log("--------------------------------");

  console.log(
    "Electron packaged:",
    isPackaged
  );

  console.log(
    "Next.js server:",
    serverPath
  );

  /*
   * SERVER.JS DOSYASI VAR MI?
   */

  const fs = require("fs");

  if (!fs.existsSync(serverPath)) {
    console.error(
      "HATA: Next.js server.js bulunamadı!"
    );

    console.error(
      "Aranan dosya:",
      serverPath
    );

    return;
  }

  console.log(
    "Next.js server.js bulundu."
  );

  /*
   * -------------------------------------------------------
   * NEXT.JS BAŞLAT
   * -------------------------------------------------------
   *
   * ELECTRON_RUN_AS_NODE=1 sayesinde
   * Electron kendi executable'ını Node.js gibi
   * server.js çalıştırmak için kullanabilir.
   */

  nextProcess = spawn(
    process.execPath,
    [serverPath],
    {
      cwd: path.dirname(serverPath),

      env: {
        ...process.env,

        ELECTRON_RUN_AS_NODE: "1",

        /*
         * Next.js portu
         */

        PORT: String(PORT),

        /*
         * ÇOK ÖNEMLİ:
         *
         * Telefon/tablet aynı Wi-Fi üzerinden
         * bilgisayara bağlanabilsin.
         */

        HOSTNAME: HOST,

        /*
         * Next.js / Supabase ortam değişkenleri.
         *
         * Build sırasında NEXT_PUBLIC değerleri
         * zaten client tarafına gömülür.
         * Server tarafında da mevcut olması için
         * burada tekrar aktarıyoruz.
         */

        NEXT_PUBLIC_SUPABASE_URL:
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",

        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          process.env
            .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",

        NEXT_TELEMETRY_DISABLED: "1",
      },

      windowsHide: true,
    }
  );

  /*
   * -------------------------------------------------------
   * NEXT.JS ÇIKTILARI
   * -------------------------------------------------------
   */

  nextProcess.stdout?.on(
    "data",
    (data) => {
      console.log(
        `[Next.js] ${data.toString()}`
      );
    }
  );

  nextProcess.stderr?.on(
    "data",
    (data) => {
      console.error(
        `[Next.js ERROR] ${data.toString()}`
      );
    }
  );

  /*
   * -------------------------------------------------------
   * NEXT.JS BAŞLATMA HATASI
   * -------------------------------------------------------
   */

  nextProcess.on(
    "error",
    (error) => {
      console.error(
        "Next.js başlatma hatası:",
        error
      );
    }
  );

  /*
   * -------------------------------------------------------
   * NEXT.JS KAPANIRSA
   * -------------------------------------------------------
   */

  nextProcess.on(
    "exit",
    (code, signal) => {
      console.log(
        `Next.js kapandı. code=${code}, signal=${signal}`
      );

      nextProcess = null;
    }
  );

  /*
   * -------------------------------------------------------
   * NEXT.JS HAZIR OLANA KADAR BEKLE
   * -------------------------------------------------------
   */

  console.log(
    "Next.js sunucusunun hazır olması bekleniyor..."
  );

  waitForServer(
    LOCAL_URL,
    () => {
      console.log(
        "Next.js sunucusu hazır."
      );

      console.log(
        `Garson Paneli: ${LOCAL_URL}/garson`
      );

      console.log(
        `Yönetim Paneli: ${LOCAL_URL}/yonetim`
      );

      console.log(
        `Ağ adresi: http://192.168.1.106:${PORT}`
      );

      createWindow();
    }
  );
}

/*
 * ---------------------------------------------------------
 * ELECTRON HAZIR
 * ---------------------------------------------------------
 */

app.whenReady().then(() => {
  console.log(
    "Electron hazır."
  );

  startNextServer();

  /*
   * macOS için.
   */

  app.on(
    "activate",
    () => {
      if (
        BrowserWindow.getAllWindows()
          .length === 0
      ) {
        createWindow();
      }
    }
  );
});

/*
 * ---------------------------------------------------------
 * TÜM PENCERELER KAPATILDI
 * ---------------------------------------------------------
 */

app.on(
  "window-all-closed",
  () => {
    if (nextProcess) {
      console.log(
        "Next.js kapatılıyor..."
      );

      nextProcess.kill();
      nextProcess = null;
    }

    if (
      process.platform !== "darwin"
    ) {
      app.quit();
    }
  }
);

/*
 * ---------------------------------------------------------
 * ELECTRON KAPANMADAN ÖNCE
 * ---------------------------------------------------------
 */

app.on(
  "before-quit",
  () => {
    if (nextProcess) {
      console.log(
        "Next.js sonlandırılıyor..."
      );

      nextProcess.kill();
      nextProcess = null;
    }
  }
);