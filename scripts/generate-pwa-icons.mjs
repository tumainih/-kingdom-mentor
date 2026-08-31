import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

const svg = readFileSync(path.join(process.cwd(), "src/app/icon.svg"));
const publicDir = path.join(process.cwd(), "public");

const sizes = [
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
];

for (const { size, name } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(path.join(publicDir, name));
}

console.log("Generated PWA icons:", sizes.map((s) => s.name).join(", "));
