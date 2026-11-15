import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const bundlesDir = path.join(dist, "assets", "bundles");
const excludedDirs = new Set([".git", "node_modules", "dist", "scripts"]);
const excludedFiles = new Set([".gitignore", "package.json", "package-lock.json", "README.md", "LICENSE"]);
function insideRoot(file) {
  const rel = path.relative(root, file);
  return rel !== "" && rel !== ".." && !rel.startsWith(".." + path.sep);
}
if (!insideRoot(dist)) throw new Error("Unsafe build output path.");
await rm(dist, { recursive: true, force: true });
await mkdir(bundlesDir, { recursive: true });

async function filesUnder(dir, relDir = "") {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirs.has(entry.name)) continue;
    const rel = relDir ? path.join(relDir, entry.name) : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(abs, rel));
    else if (!excludedFiles.has(entry.name)) result.push(rel);
  }
  return result;
}
function attrValue(attrs, name) {
  const re = name === "src"
    ? /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
    : /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
  const m = attrs.match(re);
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
}
function hasAttr(attrs, name) {
  return new RegExp("(?:^|\\s)" + name + "(?:\\s|=|$)", "i").test(attrs);
}
function descriptor(attrs, body) {
  const src = attrValue(attrs, "src");
  const type = (attrValue(attrs, "type") || "text/javascript").toLowerCase();
  if (!src || body.trim() || /^(?:[a-z][a-z\d+.-]*:|\/\/|data:)/i.test(src) ||
      type === "module" || !["text/javascript", "application/javascript"].includes(type) ||
      hasAttr(attrs, "async")) return null;
  const extras = attrs
    .replace(/\s+src(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/i, "")
    .replace(/\s+defer(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/i, "")
    .replace(/\s+type\s*=\s*(?:"(?:text|application)\/javascript"|'(?:text|application)\/javascript'|(?:text|application)\/javascript)/i, "")
    .trim();
  if (extras) return null;
  return { src, type, defer: hasAttr(attrs, "defer") };
}
function resolveScript(src, htmlRel) {
  const clean = decodeURIComponent(src.replace(/[?#].*$/, ""));
  const abs = clean.startsWith("/")
    ? path.resolve(root, "." + clean)
    : path.resolve(root, path.dirname(htmlRel), clean);
  if (!insideRoot(abs)) throw new Error("Script path escapes project: " + src);
  return abs;
}
async function createBundle(group, htmlRel) {
  const parts = [];
  for (const item of group) {
    const file = resolveScript(item.desc.src, htmlRel);
    const code = await readFile(file, "utf8");
    parts.push("\n;\n" + code + "\n");
  }
  const built = await transform(parts.join("\n"), {
    loader: "js", minify: true, legalComments: "none", sourcefile: path.basename(htmlRel)
  });
  const hash = createHash("sha256").update(built.code).digest("hex").slice(0, 16);
  const name = "bundle-" + hash + ".js";
  await writeFile(path.join(bundlesDir, name), built.code);
  const bundleRel = path.posix.join("assets", "bundles", name);
  let src = path.posix.relative(path.posix.dirname(htmlRel.replaceAll("\\", "/")), bundleRel);
  if (!src.startsWith(".")) src = "./" + src;
  return "<script" + (group[0].desc.defer ? " defer" : "") + ' src="' + src + '"></script>';
}
async function bundleScripts(html, htmlRel) {
  const tokenRe = /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  const tokens = [...html.matchAll(tokenRe)].map(m => {
    const comment = m[0].startsWith("<!--");
    const attrs = comment ? "" : (m[1] || "");
    const body = comment ? "" : (m[2] || "");
    return {
      start: m.index, end: m.index + m[0].length,
      comment, desc: comment ? null : descriptor(attrs, body)
    };
  });
  const edits = [];
  let group = [];
  let previousEnd = 0;
  async function flush() {
    if (!group.length) return;
    edits.push({ start: group[0].start, end: group[group.length - 1].end,
      text: await createBundle(group, htmlRel) });
    group = [];
  }
  for (const token of tokens) {
    if (group.length && html.slice(previousEnd, token.start).trim()) await flush();
    if (token.comment) { previousEnd = token.end; continue; }
    if (!token.desc) { await flush(); previousEnd = token.end; continue; }
    const first = group[0];
    if (first && (first.desc.defer !== token.desc.defer || first.desc.type !== token.desc.type)) {
      await flush();
    }
    group.push(token);
    previousEnd = token.end;
  }
  await flush();
  for (const edit of edits.reverse()) {
    html = html.slice(0, edit.start) + edit.text + html.slice(edit.end);
  }
  return html;
}

let htmlCount = 0;
let jsCount = 0;
for (const rel of await filesUnder(root)) {
  const source = path.join(root, rel);
  const dest = path.join(dist, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  if (rel.toLowerCase().endsWith(".html")) {
    const html = await bundleScripts(await readFile(source, "utf8"), rel);
    const minified = await minifyHtml(html, {
      collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: true,
      removeRedundantAttributes: true, removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    });
    await writeFile(dest, minified);
    htmlCount++;
  } else if (/\.(?:js|mjs)$/i.test(rel)) {
    const js = await transform(await readFile(source, "utf8"), {
      loader: "js", minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false, legalComments: "none", sourcefile: rel
    });
    await writeFile(dest, js.code);
    jsCount++;
  } else {
    await copyFile(source, dest);
  }
}
const bundleCount = (await readdir(bundlesDir)).filter(file => file.endsWith(".js")).length;
console.log("Built " + htmlCount + " HTML pages, " + jsCount + " minified JS files, and " + bundleCount + " page bundles in dist/.");
