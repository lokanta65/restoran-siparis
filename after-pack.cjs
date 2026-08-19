const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  const projectRoot = context.packager.projectDir;

  const source = path.join(
    projectRoot,
    ".next",
    "standalone",
    "node_modules"
  );

  const destination = path.join(
    context.appOutDir,
    "resources",
    "standalone",
    "node_modules"
  );

  console.log("========================================");
  console.log("NEXT.JS NODE_MODULES KOPYALANIYOR");
  console.log("Kaynak:", source);
  console.log("Hedef:", destination);
  console.log("Kaynak mevcut:", fs.existsSync(source));
  console.log("========================================");

  if (!fs.existsSync(source)) {
    throw new Error("Standalone node_modules bulunamadı: " + source);
  }

  fs.mkdirSync(destination, { recursive: true });

  fs.cpSync(source, destination, {
    recursive: true,
    force: true
  });

  const nextPath = path.join(destination, "next");

  console.log("Next hedefte mevcut:", fs.existsSync(nextPath));

  if (!fs.existsSync(nextPath)) {
    throw new Error("Next paketi kopyalanamadı: " + nextPath);
  }

  console.log("========================================");
  console.log("NEXT.JS NODE_MODULES BAŞARIYLA KOPYALANDI");
  console.log("========================================");
};