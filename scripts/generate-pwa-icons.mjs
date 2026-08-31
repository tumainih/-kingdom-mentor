import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

const svg = readFileSync(path.join(process.cwd(), "src/app/icon.svg"));
const publicDir = path.join(process.cwd(), "public");

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(path.join(publicDir, `icon-${size}.png`));
}

console.log("Generated public/icon-192.png and public/icon-512.png");
