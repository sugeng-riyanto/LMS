import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function getGoogleDriveDirectUrl(url: string): string {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  return url
}

function getGoogleDriveEmbedUrl(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
  return null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: ws } = await (supabase.from("shared_worksheets") as any)
      .select("*")
      .eq("id", id)
      .single()

    if (!ws) return new NextResponse("Worksheet not found", { status: 404 })

    const grade = ws.grade
    const pages = ws.pdf_pages || 1
    const pdfUrl = ws.pdf_url || ""
    const directPdfUrl = getGoogleDriveDirectUrl(pdfUrl)
    const embedPdfUrl = getGoogleDriveEmbedUrl(pdfUrl)
    const mediaLinks: Array<{ type: string; url: string; title: string }> = ws.media_links || []
    const objectivesText: string | null = ws.objectives || null
    const referencePdfUrl: string | null = ws.reference_pdf_url || null
    const theoryVideoUrl: string | null = ws.theory_video_url || null
    const theoryVideoTitle: string | null = ws.theory_video_title || null
    const origin = _request.headers.get("x-forwarded-host")
      ? `https://${_request.headers.get("x-forwarded-host")}`
      : `https://lms-chi-orpin.vercel.app`

    const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    let studentOptions = ""
    try {
      const { data: students } = await (supabase.from("profiles") as any)
        .select("full_name")
        .eq("role", "student")
        .eq("grade_assigned", grade)
        .order("full_name")
      if (students && students.length > 0) {
        studentOptions = students.map((s: any) => `<option value="${esc(s.full_name)}">${esc(s.full_name)}</option>`).join("")
      }
    } catch {}

    function getEmbedUrl(url: string, type: string): string | null {
      if (type === "youtube") {
        const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
        return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null
      }
      const gDrive = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      if (gDrive) {
        const fid = gDrive[1]
        if (type === "slides") return `https://docs.google.com/presentation/d/${fid}/embed`
        return `https://drive.google.com/file/d/${fid}/preview`
      }
      return null
    }

    function renderMedia(src: { type: string; url: string; title: string }) {
      const emb = getEmbedUrl(src.url, src.type)
      const vid = src.type === "youtube" ? (src.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/) || [])[1] : null
      if (src.type === "youtube" && vid) {
        return `<div class="mt-3 rounded-lg overflow-hidden border bg-black relative" style="aspect-ratio:16/9">
          <iframe src="${esc(emb || "")}" class="absolute inset-0 w-full h-full" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen style="border:0"></iframe>
          <p class="absolute bottom-0 left-0 right-0 text-xs text-gray-400 px-2 pb-1 bg-black/50">${esc(src.title)}</p>
        </div>`
      }
      if (src.type === "pdf" || src.type === "slides") {
        const isSlide = src.type === "slides"
        const isGoogleDriveEmbed = /drive\.google\.com/.test(emb || "")
        const isFolderUrl = /drive\.google\.com\/drive\/folders/.test(src.url)
        let embedHtml: string
        if (isFolderUrl || !emb) {
          embedHtml = `<div class="flex flex-col items-center justify-center py-8 bg-gray-100 text-gray-500 rounded-sm">
            <span class="text-3xl mb-2">${isSlide ? "📽️" : "📄"}</span>
            <p class="text-sm font-medium">Cannot preview — <a href="${esc(src.url)}" target="_blank" class="text-blue-600 underline">Open in Google Drive ↗</a></p>
          </div>`
        } else if (isGoogleDriveEmbed) {
          embedHtml = `<iframe src="${esc(emb)}" class="w-full h-full" allowfullscreen style="border:0"></iframe>`
        } else {
          embedHtml = `<div class="doc-preview cursor-pointer w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200" data-embed="${esc(emb)}">
            <span class="text-3xl mb-2">${isSlide ? "📽️" : "📄"}</span>
            <p class="text-sm font-medium">Click to preview</p>
            <p class="text-xs mt-1 text-center px-4">${esc(src.title)}</p>
          </div>`
        }
        return `<div class="mt-3 rounded-lg overflow-hidden border">
          <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
            <p class="text-sm font-medium truncate">${esc(src.title)}</p>
            <a href="${esc(src.url)}" target="_blank" class="text-xs text-blue-600 underline shrink-0 ml-2">Open ↗</a>
          </div>
          <div style="aspect-ratio:16/9;max-height:500px">
            ${embedHtml}
          </div>
        </div>`
      }
      if (src.type === "audio") return `<div class="mt-3"><audio controls class="w-full"><source src="${esc(src.url)}"></audio><p class="text-xs text-gray-400 mt-1">${esc(src.title)}</p></div>`
      return `<div class="mt-2"><a href="${esc(src.url)}" target="_blank" class="text-blue-600 underline text-sm">${esc(src.title)}</a></div>`
    }

    const dateCode = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)
    const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

    const extraMedia: Array<{ type: string; url: string; title: string }> = []
    if (theoryVideoUrl) extraMedia.push({ type: "youtube", url: theoryVideoUrl, title: theoryVideoTitle || "Theory Video" })
    if (referencePdfUrl) extraMedia.push({ type: "pdf", url: referencePdfUrl, title: "Reference PDF (Theory Material)" })
    const allMedia = [...extraMedia, ...mediaLinks]
    const mediaHtml = allMedia.map(s => renderMedia(s)).join("")

    // Generate page HTML — use pageImages if available, else PDF.js/embed fallback
    // PDF.js path — render PDF to canvas, annotation overlay
    const pdfPagesHtml = Array.from({ length: pages }, (_, i) => `
<div class="pdf-page-wrapper mb-8 rounded-xl border bg-white overflow-hidden flex" data-page="${i + 1}">
  <div class="vertical-tools no-print flex flex-col items-center gap-1 px-1.5 py-2 border-r bg-gray-50/50 shrink-0" style="width:52px">
    <select class="tool-size text-[10px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Pen Size">
      <option value="2" selected>•</option><option value="5">●</option><option value="10">⬤</option><option value="20">◉</option>
    </select>
    <select class="tool-fontsize text-[10px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Font Size" style="display:none">
      <option value="16" selected>16</option><option value="18">18</option><option value="24">24</option><option value="36">36</option>
    </select>
    <button class="tool-cursor w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" data-mode="cursor" title="Select / Move">
      <span class="text-base">🖱️</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Select</span>
    </button>
    <button class="tool-pen w-full px-1 py-1 text-sm rounded border bg-blue-100 border-blue-500 flex flex-col items-center" data-target="${i + 1}" data-mode="pen" title="Pen">
      <span class="text-base">✏️</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Pen</span>
    </button>
    <button class="tool-line w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" data-mode="line" title="Line">
      <span class="text-base">╱</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Line</span>
    </button>
    <button class="tool-dash w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" data-mode="dash" title="Dash">
      <span class="text-base">┄</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Dash</span>
    </button>
    <button class="tool-eraser w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" data-mode="eraser" title="Eraser">
      <span class="text-base">🧽</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Eraser</span>
    </button>
    <button class="tool-text w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" data-mode="text" title="Text">
      <span class="text-base">🅰️</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Text</span>
    </button>
    <button class="tool-clear w-full px-1 py-1 text-sm rounded border bg-red-100 hover:bg-red-200 text-red-700 flex flex-col items-center" data-target="${i + 1}" title="Clear">
      <span class="text-base">🗑️</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Clear</span>
    </button>
    <select class="tool-color text-[10px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Color">
      <option value="#1a1a2e" selected>●</option><option value="#dc2626">●</option><option value="#2563eb">●</option><option value="#16a34a">●</option>
    </select>
    <select class="tool-font text-[9px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Font Family" style="display:none">
      <option value="Times New Roman, serif" selected>TR</option><option value="Arial, sans-serif">Ar</option><option value="Courier New, monospace">CN</option><option value="Georgia, serif">Ge</option><option value="Verdana, sans-serif">Vr</option>
    </select>
    <button class="tool-ruler-btn w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" title="Ruler">
      <span class="text-base">📏</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Ruler</span>
    </button>
    <button class="tool-protractor-btn w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" title="Protractor">
      <span class="text-base">⊙</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Protractor</span>
    </button>
    <button class="tool-compass-btn w-full px-1 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex flex-col items-center" data-target="${i + 1}" title="Compass">
      <span class="text-base">🧭</span>
      <span class="text-[8px] text-gray-600 mt-0.5">Compass</span>
    </button>
    <span class="mode-label text-[9px] text-gray-500 mt-1 font-medium" id="mode-label-${i + 1}">Pen</span>
  </div>
  <div class="flex-1 min-w-0">
    <div class="flex items-center justify-between px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
      <span>Page ${i + 1} of ${pages}</span>
      <span class="text-[10px] text-gray-400">Draw directly on the worksheet below</span>
    </div>
    <div class="relative" style="min-height:400px">
      <canvas class="pdf-canvas" data-page="${i + 1}" style="display:none"></canvas>
      <canvas class="annotation-canvas absolute inset-0" data-page="${i + 1}"></canvas>
      <div class="pdf-loading flex items-center justify-center py-16 text-gray-400 text-sm" data-page="${i + 1}">
        <span class="animate-pulse">Loading page ${i + 1}...</span>
      </div>
    </div>
    <div class="px-4 py-2 border-t bg-gray-50/50 no-print">
      <textarea rows="2" class="answer-text w-full rounded-lg border border-gray-300 p-3 text-sm resize-y" data-page="${i + 1}" placeholder="Type your answer for page ${i + 1} here (optional)"></textarea>
    </div>
  </div>
</div>`).join("")

    const TEXT_EDITOR_JS = [
      'var activeTextEditor = null',
      'function createTextEditor(canvas, x, y, color, size, fontFamily, page) {',
      '  if (activeTextEditor) { finalizeTextEditor(); return }',
      '  var rect = canvas.getBoundingClientRect()',
      '  var leftPos = rect.left + window.scrollX + x * rect.width / canvas.width',
      '  var topPos = rect.top + window.scrollY + y * rect.height / canvas.height',
      '  var container = document.createElement("div")',
      '  container.className = "text-editor-container"',
      '  container.style.cssText = "position:absolute;left:" + leftPos + "px;top:" + topPos + "px;z-index:9999;background:white;border:2px solid #3b82f6;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:8px;pointer-events:auto"',
      '  var textarea = document.createElement("textarea")',
      '  textarea.style.cssText = "width:200px;min-height:60px;font-family:\'" + fontFamily + "\';font-size:" + size + "px;color:" + color + ";border:1px solid #cbd5e1;border-radius:2px;padding:4px;resize:both;outline:none;pointer-events:auto"',
      '  textarea.placeholder = "Type here..."',
      '  var btnRow = document.createElement("div")',
      '  btnRow.style.cssText = "margin-top:6px;display:flex;gap:4px"',
      '  var doneBtn = document.createElement("button")',
      '  doneBtn.textContent = "Done"',
      '  doneBtn.style.cssText = "flex:1;padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:2px;cursor:pointer;font-size:13px;font-weight:500;pointer-events:auto"',
      '  doneBtn.addEventListener("click", function(e) { e.preventDefault(); e.stopPropagation(); finalizeTextEditor() })',
      '  var cancelBtn = document.createElement("button")',
      '  cancelBtn.textContent = "Cancel"',
      '  cancelBtn.style.cssText = "flex:1;padding:6px 12px;background:#e2e8f0;color:#475569;border:none;border-radius:2px;cursor:pointer;font-size:13px;font-weight:500;pointer-events:auto"',
      '  cancelBtn.addEventListener("click", function(e) { e.preventDefault(); e.stopPropagation(); cancelTextEditor() })',
      '  btnRow.appendChild(doneBtn)',
      '  btnRow.appendChild(cancelBtn)',
      '  container.appendChild(textarea)',
      '  container.appendChild(btnRow)',
      '  document.body.appendChild(container)',
      '  activeTextEditor = { container: container, textarea: textarea, page: page, canvasX: x, canvasY: y, color: color, size: size, fontFamily: fontFamily }',
      '  setTimeout(function() { textarea.focus() }, 100)',
      '  textarea.addEventListener("keydown", function(e) {',
      '    if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); finalizeTextEditor() }',
      '    if (e.key === "Escape") { e.preventDefault(); cancelTextEditor() }',
      '  })',
      '}',
      '',
      'function finalizeTextEditor() {',
      '  if (!activeTextEditor) return',
      '  var text = activeTextEditor.textarea.value.trim()',
      '  var data = activeTextEditor',
      '  activeTextEditor.container.remove()',
      '  activeTextEditor = null',
      '  if (!text) return',
      '  var c = document.querySelector(".annotation-canvas[data-page=" + data.page + "]")',
      '  if (!c) return',
      '  var ctx = c.getContext("2d")',
      '  if (!ctx) return',
      '  ctx.save()',
      '  ctx.globalCompositeOperation = "source-over"',
      '  ctx.font = data.size + "px " + data.fontFamily',
      '  ctx.fillStyle = data.color',
      '  ctx.textAlign = "left"',
      '  ctx.textBaseline = "top"',
      '  var lines = text.split("\\n")',
      '  var lineH = data.size * 1.5',
      '  for (var i = 0; i < lines.length; i++) {',
      '    ctx.fillText(lines[i], data.canvasX, data.canvasY + i * lineH)',
      '  }',
      '  ctx.restore()',
      '}',
      '',
      'function cancelTextEditor() {',
      '  if (!activeTextEditor) return',
      '  activeTextEditor.container.remove()',
      '  activeTextEditor = null',
      '}',
    ].join('\n')

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="/api/favicon" type="image/svg+xml" />
<title>Worksheet: ${esc(ws.title)} - Grade ${grade}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
body{font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;background:#f3f4f6;-webkit-user-select:text;user-select:text}
@media print{body{background:#fff;padding:0}.no-print{display:none!important}.pdf-page-wrapper{page-break-after:always;break-inside:avoid;margin:0!important;border-radius:0!important;overflow:visible!important}}
canvas{max-width:100%;height:auto}
.annotation-canvas{position:absolute;top:0;left:0;width:100%!important;height:100%!important;cursor:crosshair;touch-action:none;pointer-events:auto;display:block;z-index:5}
.pdf-page-wrapper{position:relative}
.pdf-canvas{width:100%!important;height:auto!important;display:block}
.answer-text{-webkit-user-select:text;user-select:text}
.vertical-tools button.active-tool{background:#dbeafe;border-color:#3b82f6}
.vertical-tools .mode-label{font-size:7px;line-height:1;color:#9ca3af;writing-mode:vertical-rl;text-orientation:mixed;margin-top:2px}
.floating-tool{position:absolute;z-index:10;pointer-events:none;touch-action:none;-webkit-user-select:none;user-select:none}
.floating-tool canvas{display:block;pointer-events:none}
.floating-tool .handle{position:absolute;z-index:25;width:20px;height:20px;border-radius:50%;border:2px solid #2563eb;background:white;opacity:0.95;pointer-events:auto;box-shadow:0 2px 6px rgba(0,0,0,0.3)}
.floating-tool .handle:hover{opacity:1;transform:scale(1.4)}
.floating-tool .h-close{left:-10px;top:-10px;cursor:pointer;background:#ef4444;border-color:#ef4444;color:white;font-size:11px;display:flex;align-items:center;justify-content:center;line-height:20px}
.floating-tool .h-close::after{content:'✕'}
.floating-tool .h-drag{left:50%;bottom:-10px;margin-left:-10px;cursor:grab;background:#dbeafe;border-color:#3b82f6;color:#2563eb;font-size:11px;display:flex;align-items:center;justify-content:center;line-height:20px}
.floating-tool .h-drag::after{content:'⣿'}
.floating-tool .h-rotate{right:-10px;top:-10px;cursor:crosshair;background:#fef3c7;border-color:#f59e0b;color:#d97706;font-size:14px;display:flex;align-items:center;justify-content:center;line-height:20px}
.floating-tool .h-rotate::after{content:'↻'}
.floating-tool .h-resize{right:-10px;bottom:-10px;cursor:se-resize;background:#dbeafe;border-color:#3b82f6;color:#2563eb;font-size:13px;display:flex;align-items:center;justify-content:center;line-height:20px}
.floating-tool .h-resize::after{content:'⤡'}
.floating-ruler{background:rgba(255,255,255,0.5);border:1px solid #94a3b8;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.1)}
.floating-protractor{background:rgba(255,255,255,0.3);border:1px solid #94a3b8;box-shadow:0 1px 4px rgba(0,0,0,0.1)}
</style>
</head>
<body>
<div class="max-w-5xl mx-auto p-4 md:p-6 space-y-4">

<div class="bg-white rounded-2xl shadow-sm border p-6">
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold">${esc(ws.title)}</h1>
      <p class="text-gray-500 mt-1">Grade ${grade}${ws.week_number ? ` · Week ${ws.week_number}` : ""}${ws.topic ? ` · ${esc(ws.topic)}` : ""} · ${dateStr}</p>
    </div>
    <div class="shrink-0 text-center">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${origin}/worksheet/public/${id}`)}" alt="QR" class="w-20 h-20 mx-auto rounded border" />
      <p class="text-[10px] text-gray-400 mt-1">Scan to open worksheet</p>
    </div>
  </div>
</div>

${objectivesText ? `<div class="bg-white rounded-2xl shadow-sm border p-6">
  <h2 class="font-semibold text-gray-700 mb-2">Learning Objectives</h2>
  <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
    ${objectivesText.split('\n').filter(Boolean).map(o => `<li>${esc(o)}</li>`).join('')}
  </ul>
</div>` : ""}

${mediaHtml ? `<div class="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
  <h2 class="font-semibold text-gray-700">Reference Materials</h2>
  ${mediaHtml}
</div>` : ""}

<div id="pdf-container" class="bg-white rounded-2xl shadow-sm border p-6">
  ${pdfPagesHtml}
</div>

<div class="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
  <h3 class="font-semibold text-gray-700">Student Information</h3>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
      <select id="student-name" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
        <option value="">Select student...</option>
        ${studentOptions}
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-600 mb-1">Date (ddmmyyyy hhmmss)</label>
      <input type="text" value="${dateCode}" readonly class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-100 text-gray-500" />
    </div>
  </div>
</div>

<div class="flex flex-wrap gap-3 no-print">
  <button onclick="handlePrint()" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm">🖨️ Print / Save as PDF</button>
  <button onclick="clearAll()" class="px-4 py-3 border rounded-xl font-medium hover:bg-gray-100">Clear All Drawings</button>
</div>

<div class="text-center text-sm text-gray-400 py-4">
  <p>Generated by Physics Command Center - SHB Modernhill</p>
</div>
</div>

<script src="/pdfjs/pdf.js"></script>
<script>
var PDF_URL = ${JSON.stringify(directPdfUrl)}
var PDF_EMBED = ${JSON.stringify(embedPdfUrl)}
var PDF_PAGES = ${pages}
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.js'

var CS = {}
var TOTAL_PAGES = 0
var UNDO_STACKS = {}
var REDO_STACKS = {}
var MAX_UNDO = 30

function saveUndoState(page) {
  var c = document.querySelector('.annotation-canvas[data-page="' + page + '"]')
  if (!c) return
  UNDO_STACKS[page] = UNDO_STACKS[page] || []
  REDO_STACKS[page] = []
  var data = c.getContext('2d').getImageData(0, 0, c.width, c.height)
  UNDO_STACKS[page].push(data)
  if (UNDO_STACKS[page].length > MAX_UNDO) UNDO_STACKS[page].shift()
}
function undoPage(page) {
  var stack = UNDO_STACKS[page]
  if (!stack || stack.length === 0) return
  var c = document.querySelector('.annotation-canvas[data-page="' + page + '"]')
  if (!c) return
  REDO_STACKS[page] = REDO_STACKS[page] || []
  REDO_STACKS[page].push(c.getContext('2d').getImageData(0, 0, c.width, c.height))
  var data = stack.pop()
  c.getContext('2d').putImageData(data, 0, 0)
}
function redoPage(page) {
  var stack = REDO_STACKS[page]
  if (!stack || stack.length === 0) return
  var c = document.querySelector('.annotation-canvas[data-page="' + page + '"]')
  if (!c) return
  UNDO_STACKS[page] = UNDO_STACKS[page] || []
  UNDO_STACKS[page].push(c.getContext('2d').getImageData(0, 0, c.width, c.height))
  var data = stack.pop()
  c.getContext('2d').putImageData(data, 0, 0)
}

function setFloatingToolMode(page, mode) {
  document.querySelectorAll('.floating-tool[data-page="' + page + '"]').forEach(function(el) {
    if (mode === 'cursor') {
      el.style.pointerEvents = 'auto'
      el.dataset.mode = 'move'
      var strip = el.querySelector('[title="Drag to move"]')
      if (strip) strip.style.display = ''
      var modeBtn = el.querySelector('[title^="Toggle"]')
      if (modeBtn) { modeBtn.textContent = 'M'; modeBtn.title = 'Move mode: drag/resize/rotate' }
    } else {
      el.style.pointerEvents = 'none'
      el.dataset.mode = 'draw'
      var strip2 = el.querySelector('[title="Drag to move"]')
      if (strip2) strip2.style.display = 'none'
      var modeBtn2 = el.querySelector('[title^="Toggle"]')
      if (modeBtn2) { modeBtn2.textContent = 'D'; modeBtn2.title = 'Draw mode: draw through ruler' }
    }
  })
}

function setActivePage(page) { window._activePage = page }

function initAnnotation(page) {
  var c = document.querySelector('.annotation-canvas[data-page="' + page + '"]')
  var pdfCanvas = document.querySelector('.pdf-canvas[data-page="' + page + '"]')
  if (!c) return
  var w = pdfCanvas ? pdfCanvas.width : 800
  var h = pdfCanvas ? pdfCanvas.height : 600
  c.width = w
  c.height = h
  var ctx = c.getContext('2d')
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  CS[page] = { ctx: ctx, mode: 'pen', size: 2, color: '#1a1a2e', drawing: false, last: null, lineStart: null, dashed: false, savedState: null, radiusLabel: null, fontFamily: 'Times New Roman, serif', fontSize: 16 }

  function p(e) {
    var r = c.getBoundingClientRect()
    var s = c.width / r.width
    var si = c.height / r.height
    var t = e.touches ? e.touches[0] : e
    return { x: (t.clientX - r.left) * s, y: (t.clientY - r.top) * si }
  }

  function st(e) { e.preventDefault(); var s = CS[page]; if (!s) return; var o = p(e);
    if (s.mode === 'cursor') { return }
    saveUndoState(page)
    s.drawing = true; s.last = o; s.lineStart = o; s.ctx.globalCompositeOperation = 'source-over';
    if (s.mode === 'pen' || s.mode === 'line' || s.mode === 'dash') {
      s.ctx.strokeStyle = s.color; s.ctx.lineWidth = s.size; s.ctx.setLineDash(s.mode === 'dash' ? [s.size * 3, s.size * 3] : []); s.ctx.beginPath(); s.ctx.moveTo(o.x, o.y); c.style.cursor = 'crosshair'
      if (s.mode === 'line' || s.mode === 'dash') { s.savedState = ctx.getImageData(0, 0, c.width, c.height) }
    } else if (s.mode === 'eraser') {
      s.ctx.strokeStyle = '#000000'; s.ctx.lineWidth = s.size * 3; s.ctx.globalCompositeOperation = 'destination-out'; s.ctx.setLineDash([]); s.ctx.beginPath(); s.ctx.moveTo(o.x, o.y); c.style.cursor = 'cell'
    } else if (s.mode === 'compass') {
      s.ctx.strokeStyle = s.color; s.ctx.lineWidth = s.size; s.ctx.setLineDash([]); c.style.cursor = 'crosshair'
      s.savedState = ctx.getImageData(0, 0, c.width, c.height)
    } else if (s.mode === 'text') {
      createTextEditor(c, o.x, o.y, s.color, s.fontSize || 16, s.fontFamily || 'Times New Roman, serif', page)
    }
  }
  function mv(e) { if (!CS[page] || !CS[page].drawing) return; e.preventDefault(); var s = CS[page]; var o = p(e); if (!s.last) return;
    if (s.mode === 'pen') { s.ctx.lineTo(o.x, o.y); s.ctx.stroke() }
    else if (s.mode === 'eraser') { s.ctx.beginPath(); s.ctx.moveTo(s.last.x, s.last.y); s.ctx.lineTo(o.x, o.y); s.ctx.stroke() }
    else if (s.mode === 'line' || s.mode === 'dash') {
      if (s.savedState) { ctx.putImageData(s.savedState, 0, 0); s.ctx.strokeStyle = s.color; s.ctx.lineWidth = s.size; s.ctx.setLineDash(s.mode === 'dash' ? [s.size * 3, s.size * 3] : []); s.ctx.beginPath(); s.ctx.moveTo(s.lineStart.x, s.lineStart.y); s.ctx.lineTo(o.x, o.y); s.ctx.stroke(); s.ctx.setLineDash([]) }
    } else if (s.mode === 'compass') {
      if (s.savedState) { ctx.putImageData(s.savedState, 0, 0); s.ctx.strokeStyle = s.color; s.ctx.lineWidth = s.size; s.ctx.beginPath(); s.ctx.arc(s.lineStart.x, s.lineStart.y, Math.sqrt(Math.pow(o.x - s.lineStart.x, 2) + Math.pow(o.y - s.lineStart.y, 2)), 0, 2 * Math.PI); s.ctx.stroke() }
    }
    s.last = o
  }
  function sp() { var s = CS[page]; if (!s) return; s.drawing = false; s.savedState = null;
    if ((s.mode === 'line' || s.mode === 'dash') && s.lineStart && s.last) { s.ctx.setLineDash(s.mode === 'dash' ? [s.size * 3, s.size * 3] : []); s.ctx.beginPath(); s.ctx.moveTo(s.lineStart.x, s.lineStart.y); s.ctx.lineTo(s.last.x, s.last.y); s.ctx.stroke(); s.ctx.setLineDash([]) }
    if (s.mode === 'compass' && s.lineStart && s.last) { var dx = s.last.x - s.lineStart.x, dy = s.last.y - s.lineStart.y, r = Math.sqrt(dx*dx + dy*dy); s.ctx.setLineDash([]); s.ctx.beginPath(); s.ctx.arc(s.lineStart.x, s.lineStart.y, r, 0, 2 * Math.PI); s.ctx.stroke(); var radiusCm = (r / 40).toFixed(1); s.ctx.fillStyle = s.color; s.ctx.font = '11px sans-serif'; s.ctx.textAlign = 'left'; s.ctx.fillText('r = ' + radiusCm + ' cm', s.lineStart.x + 5, s.lineStart.y - 5) }
    s.last = null; s.lineStart = null
  }

  c.addEventListener('mousedown', st); c.addEventListener('mousemove', mv); c.addEventListener('mouseup', sp); c.addEventListener('mouseleave', sp)
  c.addEventListener('touchstart', st, { passive: false }); c.addEventListener('touchmove', mv, { passive: false }); c.addEventListener('touchend', sp)
}

${TEXT_EDITOR_JS}

// --- Floating Tools: Ruler & Protractor ---
function drawRulerCanvas(cv, w) {
  var ctx = cv.getContext('2d'), h = 75
  cv.width = w * 2; cv.height = h * 2
  ctx.scale(2, 2)
  ctx.clearRect(0, 0, w, h)
  
  // Background - transparent white with border
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5; ctx.strokeRect(0, 0, w, h)
  
  // 40px per cm (actual measurement)
  var pxPerCm = 40
  
  // Draw mm, 5mm, and cm marks
  for (var mm = 0; mm <= w / pxPerCm * 10; mm++) {
    var x = mm * pxPerCm / 10
    if (x > w) break
    
    var isCm = mm % 10 === 0
    var isHalfCm = mm % 5 === 0
    
    // Tick lengths - more prominent
    var tickLen = isCm ? 25 : isHalfCm ? 18 : 10
    
    // Tick style
    ctx.strokeStyle = isCm ? '#0f172a' : '#64748b'
    ctx.lineWidth = isCm ? 1.5 : 0.8
    
    // Top ticks only (removed bottom to avoid overlap)
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, tickLen); ctx.stroke()
    
    // CM labels - top only, larger and clearer
    if (isCm && mm > 0) {
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'
      ctx.fillText((mm / 10).toString(), x, 35)
    }
  }
  
  // Unit label
  ctx.fillStyle = '#475569'; ctx.font = 'bold italic 10px Arial'; ctx.textAlign = 'left'
  ctx.fillText('cm', 8, h - 10)
}

function drawProtractorCanvas(cv, d) {
  var r = d / 2, ctx = cv.getContext('2d')
  cv.width = d * 2; cv.height = (r + 30) * 2
  ctx.scale(2, 2); ctx.clearRect(0, 0, d, r + 30)
  
  // Center point at (r, r)
  var cx = r, cy = r
  
  // Semicircle background
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.closePath(); ctx.fill()
  
  // Outer arc border
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.stroke()
  
  // Baseline
  ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke()
  
  // Inner arc (for inner scale)
  var innerR = r * 0.7
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.arc(cx, cy, innerR, Math.PI, 0); ctx.stroke()
  
  // Degree marks - every 1 degree
  for (var deg = 0; deg <= 180; deg++) {
    var rad = (180 - deg) * Math.PI / 180  // Start from left (180°) to right (0°)
    var cos = Math.cos(rad), sin = -Math.sin(rad)
    
    var isTen = deg % 10 === 0
    var isFive = deg % 5 === 0
    
    // Outer tick lengths
    var outerLen = isTen ? 12 : isFive ? 8 : 4
    
    // Inner tick lengths
    var innerLen = isTen ? 10 : isFive ? 6 : 3
    
    // Tick style
    ctx.strokeStyle = isTen ? '#1e293b' : isFive ? '#475569' : '#94a3b8'
    ctx.lineWidth = isTen ? 1.2 : 0.5
    
    // Outer tick (from edge inward)
    ctx.beginPath(); 
    ctx.moveTo(cx + cos * r, cy + sin * r); 
    ctx.lineTo(cx + cos * (r - outerLen), cy + sin * (r - outerLen)); 
    ctx.stroke()
    
    // Inner tick (from inner arc outward)
    ctx.beginPath(); 
    ctx.moveTo(cx + cos * innerR, cy + sin * innerR); 
    ctx.lineTo(cx + cos * (innerR + innerLen), cy + sin * (innerR + innerLen)); 
    ctx.stroke()
    
    // Labels every 10 degrees - outer scale
    if (isTen) {
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(deg.toString() + '°', cx + cos * (r - 18), cy + sin * (r - 18))
    }
    
    // Labels every 10 degrees - inner scale (reversed)
    if (isTen && deg > 0 && deg < 180) {
      ctx.fillStyle = '#64748b'; ctx.font = '9px Arial'
      ctx.fillText((180 - deg).toString() + '°', cx + cos * (innerR + 16), cy + sin * (innerR + 16))
    }
  }
  
  // Center crosshair
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.stroke()
  
  // Center dot
  ctx.fillStyle = '#ef4444'
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill()
}

function createFloatingTool(type, pageWrapper) {
  var wrapper = pageWrapper || document.querySelector('.pdf-page-wrapper')
  if (!wrapper) return
  var rel = wrapper.querySelector('.relative'); if (!rel) return
  var el = document.createElement('div')
  el.className = 'floating-tool'
  el.dataset.page = wrapper.dataset.page || '1'
  // Initialize transform state
  el.dataset.dx = '0'
  el.dataset.dy = '0'
  el.dataset.angle = '0'
  // --- RULER ---
  if (type === 'ruler') {
    el.className += ' floating-ruler'; var w = 800  // 20cm default (1cm = 40px)
    var cv = document.createElement('canvas'); el.appendChild(cv)
    setTimeout(function() { drawRulerCanvas(cv, w) }, 50)
    el.style.width = w + 'px'; el.style.height = '75px'
    el.style.transformOrigin = 'center center'
  // --- PROTRACTOR ---
  } else if (type === 'protractor') {
    el.className += ' floating-protractor'; var d = 500
    el.style.width = d + 'px'; el.style.height = (d / 2 + 4) + 'px'
    el.style.borderRadius = (d/2) + 'px ' + (d/2) + 'px 0 0'
    el.style.background = 'rgba(248,250,252,0.5)'
    el.style.border = '1px solid #94a3b8'
    el.style.borderBottom = 'none'
    var cv = document.createElement('canvas'); el.appendChild(cv)
    setTimeout(function() { drawProtractorCanvas(cv, d) }, 50)
    el.style.transformOrigin = 'center bottom'
  } else return
  // Position: center in .relative div
  var relRect = rel.getBoundingClientRect()
  var elWidth = parseFloat(el.style.width)
  var elHeight = parseFloat(el.style.height)
  el.style.left = Math.max(5, (relRect.width - elWidth) / 2) + 'px'
  el.style.top = Math.max(5, (relRect.height - elHeight) / 2) + 'px'
  el.style.transform = 'translate(0px,0px) rotate(0deg)'
  rel.appendChild(el)
  // Drag: full-area transparent strip (covers entire element)
  var dragStrip = document.createElement('div')
  dragStrip.style.cssText = 'position:absolute;z-index:26;pointer-events:auto;top:0;left:0;right:0;bottom:0;cursor:grab;background:rgba(59,130,246,0.05);border-radius:3px'
  dragStrip.title = 'Drag to move'
  el.appendChild(dragStrip)
  // Close button (near M/D button, left side)
  var hClose = document.createElement('div')
  hClose.style.cssText = 'position:absolute;z-index:28;pointer-events:auto;width:20px;height:20px;border-radius:50%;background:#ef4444;border:2px solid #dc2626;color:white;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);left:50%;margin-left:-35px;top:-10px'
  hClose.textContent = '\u2715'
  el.appendChild(hClose)
  hClose.addEventListener('click', function(e) { e.stopPropagation(); el.remove() })
  // Rotate button (near M/D button, right side)
  var hRotate = document.createElement('div')
  hRotate.style.cssText = 'position:absolute;z-index:28;pointer-events:auto;width:20px;height:20px;border-radius:50%;background:#fef3c7;border:2px solid #f59e0b;color:#d97706;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:crosshair;box-shadow:0 2px 4px rgba(0,0,0,0.3);left:50%;margin-left:15px;top:-10px'
  hRotate.textContent = '\u21BB'
  el.appendChild(hRotate)
  // Resize button (near M/D button, far right) - only for ruler
  if (type === 'ruler') {
    var hResize = document.createElement('div')
    hResize.style.cssText = 'position:absolute;z-index:28;pointer-events:auto;width:18px;height:18px;border-radius:3px;background:#dbeafe;border:2px solid #3b82f6;color:#2563eb;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:se-resize;box-shadow:0 2px 4px rgba(0,0,0,0.3);left:50%;margin-left:40px;top:-9px'
    hResize.textContent = '\u2921'
    el.appendChild(hResize)
  }
  // Mode toggle button (top-center): switches between Draw (D) and Move (M)
  var modeBtn = document.createElement('div')
  modeBtn.style.cssText = 'position:absolute;z-index:30;pointer-events:auto;width:20px;height:20px;border-radius:50%;background:#e2e8f0;border:2px solid #64748b;color:#334155;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);left:50%;margin-left:-10px;top:-10px;font-weight:bold'
  modeBtn.textContent = 'M'
  modeBtn.title = 'Toggle Draw/Move mode'
  el.appendChild(modeBtn)
  // Start in Draw mode by default (pointer-events:none → can draw through ruler)
  el.dataset.mode = 'draw'
  el.style.pointerEvents = 'none'
  dragStrip.style.display = 'none'
  modeBtn.textContent = 'D'
  function toggleMode() {
    var isDraw = el.dataset.mode === 'draw'
    el.dataset.mode = isDraw ? 'move' : 'draw'
    if (isDraw) {
      el.style.pointerEvents = 'auto'
      dragStrip.style.display = ''
      modeBtn.textContent = 'M'
      modeBtn.title = 'Move mode: drag/resize/rotate'
    } else {
      el.style.pointerEvents = 'none'
      dragStrip.style.display = 'none'
      modeBtn.textContent = 'D'
      modeBtn.title = 'Draw mode: draw through ruler'
    }
  }
  modeBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleMode() })
  // --- Drag events: updates translate(dx,dy) in transform ---
  var isDragging = false, startX = 0, startY = 0, startDx = 0, startDy = 0
  function dragStart(e) { 
    e.stopPropagation(); e.preventDefault()
    isDragging = true
    var t = e.touches ? e.touches[0] : e
    startX = t.clientX
    startY = t.clientY
    startDx = parseFloat(el.dataset.dx) || 0
    startDy = parseFloat(el.dataset.dy) || 0
    dragStrip.style.cursor = 'grabbing'
  }
  function dragMove(e) { 
    if (!isDragging) return
    var t = e.touches ? e.touches[0] : e
    var dx = startDx + (t.clientX - startX)
    var dy = startDy + (t.clientY - startY)
    el.dataset.dx = String(dx)
    el.dataset.dy = String(dy)
    var angle = parseFloat(el.dataset.angle) || 0
    el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + angle + 'deg)'
  }
  function dragEnd() { 
    isDragging = false
    dragStrip.style.cursor = 'grab'
  }
  dragStrip.addEventListener('mousedown', dragStart)
  document.addEventListener('mousemove', dragMove)
  document.addEventListener('mouseup', dragEnd)
  dragStrip.addEventListener('touchstart', dragStart, { passive: false })
  document.addEventListener('touchmove', dragMove, { passive: false })
  document.addEventListener('touchend', dragEnd)
  // --- Rotate events: updates rotate(angle) in transform ---
  var rotating = false
  function rotStart(e) { e.stopPropagation(); e.preventDefault(); rotating = true }
  function rotMove(e) { 
    if (!rotating) return
    var t = e.touches ? e.touches[0] : e
    var rect = el.getBoundingClientRect()
    var cx = rect.left + rect.width / 2
    var cy = rect.top + rect.height / 2
    var angle = Math.atan2(t.clientY - cy, t.clientX - cx) * 180 / Math.PI + 90
    el.dataset.angle = String(angle)
    var dx = parseFloat(el.dataset.dx) || 0
    var dy = parseFloat(el.dataset.dy) || 0
    el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + angle + 'deg)'
  }
  function rotEnd() { rotating = false }
  hRotate.addEventListener('mousedown', rotStart)
  document.addEventListener('mousemove', rotMove)
  document.addEventListener('mouseup', rotEnd)
  hRotate.addEventListener('touchstart', rotStart, { passive: false })
  document.addEventListener('touchmove', rotMove, { passive: false })
  document.addEventListener('touchend', rotEnd)
  // --- Resize events (ruler only) ---
  if (type === 'ruler') {
    var resizing = false, startW = 0, startX = 0
    function resStart(e) { e.stopPropagation(); e.preventDefault(); resizing = true; var t = e.touches ? e.touches[0] : e; startW = el.offsetWidth; startX = t.clientX }
    function resMove(e) { 
      if (!resizing) return
      var t = e.touches ? e.touches[0] : e
      var dw = Math.max(800, Math.min(2000, t.clientX - startX + startW))  // 20-50cm
      el.style.width = dw + 'px'
      var cv = el.querySelector('canvas')
      if (cv) drawRulerCanvas(cv, dw)
    }
    function resEnd() { resizing = false }
    hResize.addEventListener('mousedown', resStart)
    document.addEventListener('mousemove', resMove)
    document.addEventListener('mouseup', resEnd)
    hResize.addEventListener('touchstart', resStart, { passive: false })
    document.addEventListener('touchmove', resMove, { passive: false })
    document.addEventListener('touchend', resEnd)
  }
  // Ensure handles stay above drag strip
  hClose.style.zIndex = '28'
  hRotate.style.zIndex = '28'
  return el
}

function clearPage(page) {
  var c = document.querySelector('.annotation-canvas[data-page="' + page + '"]')
  if (!c) return
  var ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  CS[page] = CS[page] || { ctx: ctx, mode: 'pen', size: 5, color: '#1a1a2e', drawing: false, last: null }
}

window.clearAll = function() { for (var i = 1; i <= (TOTAL_PAGES || PDF_PAGES); i++) clearPage(i) }

async function loadPDF() {
  try {
    var pdf = await pdfjsLib.getDocument({ url: PDF_URL }).promise
    var total = pdf.numPages
    TOTAL_PAGES = total
    var container = document.getElementById('pdf-container')

    // Dynamically add page wrappers if PDF has more pages than HTML
    function addPageWrapper(pageNum) {
      if (!container) return null
      var tmpl = container.querySelector('.pdf-page-wrapper')
      if (!tmpl) return null
      var clone = tmpl.cloneNode(true)
      clone.dataset.page = pageNum
      clone.querySelector('.pdf-canvas').dataset.page = pageNum
      clone.querySelector('.annotation-canvas').dataset.page = pageNum
      clone.querySelector('.pdf-loading').dataset.page = pageNum
      clone.querySelector('.pdf-loading').innerHTML = '<span class="animate-pulse">Loading page ' + pageNum + '...</span>'
      clone.querySelector('.answer-text').dataset.page = pageNum
      clone.querySelector('.answer-text').placeholder = 'Type your answer for page ' + pageNum + ' here (optional)'
      // Update header
      var header = clone.querySelector('.flex.items-center.justify-between')
      if (header) header.innerHTML = '<span>Page ' + pageNum + ' of ' + total + '</span><span class="text-[10px] text-gray-400">Draw directly on the worksheet below</span>'
      // Update tools
      clone.querySelectorAll('[data-target]').forEach(function(el) { el.dataset.target = pageNum })
      clone.querySelectorAll('[id^="mode-label-"]').forEach(function(el) { el.id = 'mode-label-' + pageNum })
      container.appendChild(clone)
      return clone
    }

    for (var i = 1; i <= total; i++) {
      try {
        var wrapper = document.querySelector('.pdf-page-wrapper[data-page="' + i + '"]')
        if (!wrapper) wrapper = addPageWrapper(i)
        if (!wrapper) continue
        var loading = wrapper.querySelector('.pdf-loading')
        var canvas = wrapper.querySelector('.pdf-canvas')
        if (!canvas) continue
        var page = await pdf.getPage(i)
        var viewport = page.getViewport({ scale: 1.5 })
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.display = 'block'
        var ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport: viewport }).promise
        if (loading) { loading.style.display = 'none' }
        initAnnotation(i)
      } catch (pageErr) {
        console.error('Page ' + i + ' failed:', pageErr)
        var loading = document.querySelector('.pdf-loading[data-page="' + i + '"]')
        if (loading) {
          loading.innerHTML = '<span class="text-red-500">Page ' + i + ' failed to render</span>'
          loading.classList.remove('animate-pulse')
        }
      }
    }
    // Hide remaining loading and init CS for pages beyond actual page count
    for (var i = total + 1; i <= PDF_PAGES; i++) {
      var loading = document.querySelector('.pdf-loading[data-page="' + i + '"]')
      if (loading) {
        loading.innerHTML = '<span class="text-gray-400">No content</span>'
        loading.classList.remove('animate-pulse')
      }
    }
    // Ensure ALL page wrappers have CS initialized (for tool buttons to work)
    document.querySelectorAll('.pdf-page-wrapper').forEach(function(w) {
      var pg = parseInt(w.dataset.page)
      if (pg && !CS[pg]) {
        var ac = w.querySelector('.annotation-canvas')
        if (ac) {
          var ctx = ac.getContext('2d')
          if (ctx) {
            ac.width = ac.offsetWidth || 800
            ac.height = ac.offsetHeight || 600
            CS[pg] = { ctx: ctx, mode: 'pen', size: 2, color: '#1a1a2e', drawing: false, last: null, lineStart: null, dashed: false, savedState: null, radiusLabel: null, fontFamily: 'Times New Roman, serif', fontSize: 16 }
          }
        }
      }
    })
  } catch (e) {
    console.error('PDF.js failed:', e)
    if (PDF_EMBED) {
      document.querySelectorAll('.pdf-page-wrapper').forEach(function(el) {
        var page = el.dataset.page
        el.innerHTML = '<div style="aspect-ratio:1/1.4;max-height:90vh"><iframe src="' + PDF_EMBED + '" class="w-full h-full" style="border:0" allowfullscreen></iframe></div><div class="px-4 py-3 space-y-2 border-t bg-gray-50/50"><textarea rows="2" class="answer-text w-full rounded-lg border border-gray-300 p-3 text-sm resize-y" data-page="' + page + '" placeholder="Type your answer for page ' + page + ' here (optional)" onpaste="return false"></textarea></div>'
      })
    } else {
      document.querySelectorAll('.pdf-loading').forEach(function(el) {
        el.innerHTML = '<span class="text-red-500">Failed to load PDF. <a href="' + PDF_URL + '" target="_blank" class="underline">Open directly ↗</a></span>'
        el.classList.remove('animate-pulse')
      })
      document.querySelectorAll('.pdf-page-wrapper .relative').forEach(function(el) {
        el.style.minHeight = 'auto'
      })
    }
  }
}

window.handlePrint = function() {
  var name = document.getElementById('student-name')?.value?.trim()
  if (!name) { alert('Please select your Full Name before printing.'); return }
  window.print()
}

document.addEventListener('DOMContentLoaded', function() {
  var pdfTimeout = setTimeout(function() {
    document.querySelectorAll('.pdf-loading').forEach(function(el) {
      el.innerHTML = '<span class="text-red-500">Taking too long. <a href="' + PDF_URL + '" target="_blank" class="underline">Open PDF directly ↗</a></span>'
      el.classList.remove('animate-pulse')
    })
  }, 30000)
  loadPDF().then(function() { clearTimeout(pdfTimeout) }).catch(function() { clearTimeout(pdfTimeout) })

  document.querySelectorAll('.tool-pen').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'pen'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5); CS[target].ctx.globalCompositeOperation = 'source-over'; CS[target].ctx.setLineDash([]) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = 'Pen'
      document.querySelectorAll('.vertical-tools button[data-target="' + target + '"]').forEach(function(x) { x.classList.remove('active-tool') }); this.classList.add('active-tool')
      var fontSel = document.querySelector('.tool-font[data-target="' + target + '"]'); if (fontSel) fontSel.style.display = 'none'
      var fontSizeSel = document.querySelector('.tool-fontsize[data-target="' + target + '"]'); if (fontSizeSel) fontSizeSel.style.display = 'none'
      setFloatingToolMode(target, 'draw')
      var ac = document.querySelector('.annotation-canvas[data-page="' + target + '"]'); if (ac) ac.style.cursor = 'crosshair'
    })
  })
  document.querySelectorAll('.tool-line').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'line'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5); CS[target].ctx.globalCompositeOperation = 'source-over'; CS[target].ctx.setLineDash([]) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = 'Line'
      document.querySelectorAll('.vertical-tools button[data-target="' + target + '"]').forEach(function(x) { x.classList.remove('active-tool') }); this.classList.add('active-tool')
      var fontSel = document.querySelector('.tool-font[data-target="' + target + '"]'); if (fontSel) fontSel.style.display = 'none'
      var fontSizeSel = document.querySelector('.tool-fontsize[data-target="' + target + '"]'); if (fontSizeSel) fontSizeSel.style.display = 'none'
      setFloatingToolMode(target, 'draw')
      var ac = document.querySelector('.annotation-canvas[data-page="' + target + '"]'); if (ac) ac.style.cursor = 'crosshair'
    })
  })
  document.querySelectorAll('.tool-dash').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'dash'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5); CS[target].ctx.globalCompositeOperation = 'source-over' }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = 'Dash'
      document.querySelectorAll('.vertical-tools button[data-target="' + target + '"]').forEach(function(x) { x.classList.remove('active-tool') }); this.classList.add('active-tool')
      var fontSel = document.querySelector('.tool-font[data-target="' + target + '"]'); if (fontSel) fontSel.style.display = 'none'
      var fontSizeSel = document.querySelector('.tool-fontsize[data-target="' + target + '"]'); if (fontSizeSel) fontSizeSel.style.display = 'none'
      setFloatingToolMode(target, 'draw')
      var ac = document.querySelector('.annotation-canvas[data-page="' + target + '"]'); if (ac) ac.style.cursor = 'crosshair'
    })
  })
  document.querySelectorAll('.tool-eraser').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'eraser'; CS[target].ctx.strokeStyle = '#000000'; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5) * 3; CS[target].ctx.globalCompositeOperation = 'destination-out'; CS[target].ctx.setLineDash([]) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = 'Eraser'
      document.querySelectorAll('.vertical-tools button[data-target="' + target + '"]').forEach(function(x) { x.classList.remove('active-tool') }); this.classList.add('active-tool')
      var fontSel = document.querySelector('.tool-font[data-target="' + target + '"]'); if (fontSel) fontSel.style.display = 'none'
      var fontSizeSel = document.querySelector('.tool-fontsize[data-target="' + target + '"]'); if (fontSizeSel) fontSizeSel.style.display = 'none'
      setFloatingToolMode(target, 'draw')
      var ac = document.querySelector('.annotation-canvas[data-page="' + target + '"]'); if (ac) ac.style.cursor = 'cell'
    })
  })
  document.querySelectorAll('.tool-compass-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'compass'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5); CS[target].ctx.globalCompositeOperation = 'source-over'; CS[target].ctx.setLineDash([]) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = 'Compass'
      document.querySelectorAll('.vertical-tools button[data-target="' + target + '"]').forEach(function(x) { x.classList.remove('active-tool') }); this.classList.add('active-tool')
      var fontSel = document.querySelector('.tool-font[data-target="' + target + '"]'); if (fontSel) fontSel.style.display = 'none'
      var fontSizeSel = document.querySelector('.tool-fontsize[data-target="' + target + '"]'); if (fontSizeSel) fontSizeSel.style.display = 'none'
      setFloatingToolMode(target, 'draw')
      var ac = document.querySelector('.annotation-canvas[data-page="' + target + '"]'); if (ac) ac.style.cursor = 'crosshair'
    })
  })
  document.querySelectorAll('.tool-text').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'text'; CS[target].ctx.strokeStyle = CS[target].color }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = 'Text'
      document.querySelectorAll('.vertical-tools button[data-target="' + target + '"]').forEach(function(x) { x.classList.remove('active-tool') }); this.classList.add('active-tool')
      var fontSel = document.querySelector('.tool-font[data-target="' + target + '"]'); if (fontSel) fontSel.style.display = ''
      var fontSizeSel = document.querySelector('.tool-fontsize[data-target="' + target + '"]'); if (fontSizeSel) fontSizeSel.style.display = ''
      setFloatingToolMode(target, 'draw')
      var ac = document.querySelector('.annotation-canvas[data-page="' + target + '"]'); if (ac) ac.style.cursor = 'text'
    })
  })
  document.querySelectorAll('.tool-cursor').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'cursor' }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = 'Select'
      document.querySelectorAll('.vertical-tools button[data-target="' + target + '"]').forEach(function(x) { x.classList.remove('active-tool') }); this.classList.add('active-tool')
      var fontSel = document.querySelector('.tool-font[data-target="' + target + '"]'); if (fontSel) fontSel.style.display = 'none'
      var fontSizeSel = document.querySelector('.tool-fontsize[data-target="' + target + '"]'); if (fontSizeSel) fontSizeSel.style.display = 'none'
      setFloatingToolMode(target, 'cursor')
      var ac = document.querySelector('.annotation-canvas[data-page="' + target + '"]'); if (ac) ac.style.cursor = 'default'
    })
  })
  document.querySelectorAll('.tool-ruler-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      try {
        var target = parseInt(this.dataset.target) || 1
        console.log('Ruler btn clicked for page', target)
        var wrapper = document.querySelector('.pdf-page-wrapper[data-page="' + target + '"]')
        if (!wrapper) { console.error('Wrapper not found for page', target); return }
        createFloatingTool('ruler', wrapper)
        console.log('Ruler created')
      } catch(e) { console.error('Ruler error:', e) }
    })
  })
  document.querySelectorAll('.tool-protractor-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      try {
        var target = parseInt(this.dataset.target) || 1
        console.log('Protractor btn clicked for page', target)
        var wrapper = document.querySelector('.pdf-page-wrapper[data-page="' + target + '"]')
        if (!wrapper) { console.error('Wrapper not found for page', target); return }
        createFloatingTool('protractor', wrapper)
        console.log('Protractor created')
      } catch(e) { console.error('Protractor error:', e) }
    })
  })
  document.querySelectorAll('.tool-clear').forEach(function(b) {
    b.addEventListener('click', function() { clearPage(parseInt(this.dataset.target)) })
  })
  document.querySelectorAll('.tool-size').forEach(function(s) {
    s.addEventListener('change', function() { var t = parseInt(this.dataset.target); if (CS[t]) CS[t].size = parseInt(this.value) })
  })
  document.querySelectorAll('.tool-fontsize').forEach(function(s) {
    s.addEventListener('change', function() { var t = parseInt(this.dataset.target); if (CS[t]) CS[t].fontSize = parseInt(this.value) })
  })
  document.querySelectorAll('.tool-color').forEach(function(s) {
    s.addEventListener('change', function() { var t = parseInt(this.dataset.target); if (CS[t]) { CS[t].color = this.value; CS[t].ctx.strokeStyle = this.value } })
  })
  document.querySelectorAll('.tool-font').forEach(function(s) {
    s.addEventListener('change', function() { var t = parseInt(this.dataset.target); if (CS[t]) CS[t].fontFamily = this.value })
  })
  document.querySelectorAll('.doc-preview').forEach(function(el) {
    el.addEventListener('click', function() { var e = this.dataset.embed; if (e) { this.innerHTML = '<iframe src="' + e + '" class="w-full h-full" allowfullscreen style="border:0"></iframe>'; this.className = 'w-full h-full' } })
   })
  // Track active page for undo/redo
  document.querySelectorAll('.annotation-canvas').forEach(function(c) {
    var pg = parseInt(c.dataset.page)
    c.addEventListener('mousedown', function() { setActivePage(pg) })
    c.addEventListener('touchstart', function() { setActivePage(pg) })
  })
  // Ctrl+Z / Ctrl+Y keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    var activePage = window._activePage || 1
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undoPage(activePage) }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redoPage(activePage) }
  })
})
</script>
</body></html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    return new NextResponse("Error loading worksheet", { status: 500 })
  }
}
