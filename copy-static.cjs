const fs = require("fs");
const path = require("path");

const source = path.join(
  __dirname,
  ".next",
  "static"
);

const destination = path.join(
  __dirname,
  ".next",
  "standalone",
  ".next",
  "static"
);

function copyDirectory(sourceDir, destinationDir) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(
      `Kaynak klasör bulunamadı: ${sourceDir}`
    );
  }

  fs.mkdirSync(destinationDir, {
    recursive: true,
  });

  const entries = fs.readdirSync(
    sourceDir,
    { withFileTypes: true }
  );

  for (const entry of entries) {
    const sourcePath = path.join(
      sourceDir,
      entry.name
    );

    const destinationPath = path.join(
      destinationDir,
      entry.name
    );

    if (entry.isDirectory()) {
      copyDirectory(
        sourcePath,
        destinationPath
      );
    } else {
      fs.copyFileSync(
        sourcePath,
        destinationPath
      );
    }
  }
}

console.log("");
console.log("Next.js static dosyaları kopyalanıyor...");
console.log("");

copyDirectory(
  source,
  destination
);

console.log("✓ Static dosyalar başarıyla kopyalandı.");
console.log("");