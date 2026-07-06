const fs = require("fs")
const size = 512
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="64" fill="#1e40af"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-weight="700" font-size="280">P</text>
  <text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-weight="500" font-size="48" opacity="0.9">SHB</text>
</svg>`
fs.writeFileSync("public/icons/icon.svg", svg)
console.log("Created icon.svg (" + svg.length + " bytes)")
