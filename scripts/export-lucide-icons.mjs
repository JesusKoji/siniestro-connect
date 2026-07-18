import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as lucide from "lucide";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Iconos importados desde lucide-react en el proyecto. */
const ICONS = [
  "AlertTriangle",
  "ArrowLeft",
  "ArrowRight",
  "BarChart3",
  "Building2",
  "Calendar",
  "CalendarDays",
  "CalendarRange",
  "Check",
  "ChevronDown",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "Circle",
  "ClipboardList",
  "CreditCard",
  "Dot",
  "Edit3",
  "ExternalLink",
  "FilePlus2",
  "FileText",
  "FolderOpen",
  "GripVertical",
  "Hash",
  "Home",
  "IdCard",
  "LayoutGrid",
  "LayoutTemplate",
  "Loader2",
  "Lock",
  "LogOut",
  "Mail",
  "MapPin",
  "Monitor",
  "MoreHorizontal",
  "PanelLeft",
  "Phone",
  "Plus",
  "Receipt",
  "Save",
  "Search",
  "Send",
  "Settings",
  "ShieldCheck",
  "Sparkles",
  "Tag",
  "Trash2",
  "User",
  "UserRound",
  "Users",
  "Wrench",
  "X",
];

function toKebabCase(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d+)/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function attrsToString(attrs) {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${String(value).replace(/"/g, "&quot;")}"`)
    .join(" ");
}

function nodeToSvg(node) {
  const [tag, attrs, children] = node;
  if (!children) {
    return `<${tag} ${attrsToString(attrs ?? {})} />`;
  }
  const inner = children.map((child) => nodeToSvg(child)).join("");
  return `<${tag} ${attrsToString(attrs)}>${inner}</${tag}>`;
}

function iconToSvg(iconNode) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${nodeToSvg(iconNode)}\n`;
}

async function main() {
  const outDir = join(root, "assets", "icons", "lucide");
  await mkdir(outDir, { recursive: true });

  const manifest = [];
  const missing = [];

  for (const icon of ICONS) {
    const iconNode = lucide[icon];
    if (!iconNode) {
      missing.push(icon);
      continue;
    }

    const fileName = `${toKebabCase(icon)}.svg`;
    await writeFile(join(outDir, fileName), iconToSvg(iconNode));
    manifest.push({ reactName: icon, file: fileName });
  }

  await writeFile(
    join(outDir, "manifest.json"),
    `${JSON.stringify({ library: "lucide", version: "0.462.0", icons: manifest }, null, 2)}\n`
  );

  await writeFile(
    join(outDir, "README.md"),
    `# Iconos Lucide usados en siniestro-connect-desktop

Biblioteca: [Lucide](https://lucide.dev) (\`lucide-react\` ^0.462.0)
Licencia: ISC — https://lucide.dev/license

Cada \`.svg\` se puede abrir en Figma, Illustrator, Inkscape, etc.

## Regenerar

\`\`\`bash
npm install --save-dev lucide
node scripts/export-lucide-icons.mjs
\`\`\`

## Descarga individual

También puedes descargarlos desde https://lucide.dev/icons (busca el nombre en kebab-case).

## Iconos (${manifest.length})

${manifest.map(({ reactName, file }) => `- \`${reactName}\` → [\`${file}\`](./${file})`).join("\n")}

${missing.length ? `\n## No encontrados\n\n${missing.map((icon) => `- ${icon}`).join("\n")}\n` : ""}
`
  );

  console.log(`Exportados ${manifest.length} iconos en ${outDir}`);
  if (missing.length) {
    console.warn("No encontrados:", missing.join(", "));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
