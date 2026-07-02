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
  <div class="vertical-tools no-print flex flex-col items-center gap-0.5 px-1 py-2 border-r bg-gray-50/50 shrink-0" style="width:38px">
    <select class="tool-size text-[10px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Pen Size">
      <option value="2" selected>•</option><option value="5">●</option><option value="10">⬤</option><option value="20">◉</option>
    </select>
    <select class="tool-fontsize text-[10px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Font Size" style="display:none">
      <option value="14" selected>14</option><option value="18">18</option><option value="24">24</option><option value="36">36</option>
    </select>
    <button class="tool-cursor w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="cursor" title="Select / Move">↖</button>
    <button class="tool-pen w-full px-1 py-1.5 text-sm rounded border bg-blue-100 border-blue-500" data-target="${i + 1}" data-mode="pen" title="Pen">✎</button>
    <button class="tool-line w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="line" title="Line">╱</button>
    <button class="tool-dash w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="dash" title="Dash">┄</button>
    <button class="tool-eraser w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="eraser" title="Eraser">⌫</button>
    <button class="tool-text w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="text" title="Text">T</button>
    <button class="tool-clear w-full px-1 py-1.5 text-sm rounded border bg-red-100 hover:bg-red-200 text-red-700" data-target="${i + 1}" title="Clear">✕</button>
    <select class="tool-color text-[10px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Color">
      <option value="#1a1a2e" selected>●</option><option value="#dc2626">●</option><option value="#2563eb">●</option><option value="#16a34a">●</option>
    </select>
    <select class="tool-font text-[9px] border rounded px-0.5 py-0.5 bg-white w-full text-center" data-target="${i + 1}" title="Font Family" style="display:none">
      <option value="Times New Roman, serif" selected>TR</option><option value="Arial, sans-serif">Ar</option><option value="Courier New, monospace">CN</option><option value="Georgia, serif">Ge</option><option value="Verdana, sans-serif">Vr</option>
    </select>
    <button class="tool-ruler-btn w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" title="Ruler">▬</button>
    <button class="tool-protractor-btn w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" title="Protractor">◔</button>
    <button class="tool-compass-btn w-full px-1 py-1.5 text-sm rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" title="Compass">⊙</button>
    <span class="mode-label text-[8px] text-gray-500 mt-1" id="mode-label-${i + 1}">Pen</span>
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
      'function createTextEditor(canvas, x, y, color, size, fontFamily, page) {',
      '  var existing = document.querySelector(".text-editor-active")',
      '  if (existing) finalizeTextEditor(existing, page)',
      '  var div = document.createElement("div")',
      '  div.className = "text-editor-active"',
      '  div.contentEditable = true',
      '  div.dataset.fontFamily = fontFamily || "Times New Roman, serif"',
      '  div.dataset.fontSize = size || 14',
      '  var rect = canvas.getBoundingClientRect()',
      '  var leftPos = rect.left + window.scrollX + x * rect.width / canvas.width',
      '  var topPos = rect.top + window.scrollY + y * rect.height / canvas.height',
      '  div.style.cssText = "position:absolute;left:" + leftPos + "px;top:" + topPos + "px;min-width:80px;min-height:24px;font-family:" + (fontFamily || "Times New Roman, serif") + ";font-size:" + (size || 14) + "px;line-height:1.5;text-align:left;color:" + color + ";background:rgba(255,255,240,0.85);border:1px dashed #94a3b8;outline:none;padding:4px 6px;z-index:100;white-space:pre-wrap;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1)"',
      '  document.body.appendChild(div)',
      '  div.focus()',
      '  div.addEventListener("blur", function() { setTimeout(function() { finalizeTextEditor(div, page) }, 250) })',
      '  div.addEventListener("keydown", function(e) {',
      '    if (e.key === "Escape") { e.preventDefault(); finalizeTextEditor(div, page) }',
      '    e.stopPropagation()',
      '  })',
      '  div.addEventListener("mousedown", function(e) { e.stopPropagation() })',
      '}',
      '',
      'function finalizeTextEditor(div, page) {',
      '  if (!div || !div.parentNode) return',
      '  var text = (div.innerText || div.textContent || "").replace(/^\\s+|\\s+$/g, "")',
      '  var fontFamily = div.dataset.fontFamily || "Times New Roman, serif"',
      '  var fontSize = parseInt(div.dataset.fontSize) || 14',
      '  div.remove()',
      '  if (!text) return',
      '  var c = document.querySelector(".annotation-canvas[data-page=" + page + "]")',
      '  if (!c) return',
      '  var s = CS[page]; if (!s) return',
      '  var rect = c.getBoundingClientRect()',
      '  var x = (parseFloat(div.style.left) - rect.left) * c.width / rect.width',
      '  var y = (parseFloat(div.style.top) - rect.top) * c.height / rect.height',
      '  saveUndoState(page)',
      '  s.ctx.font = fontSize + "px " + fontFamily',
      '  s.ctx.fillStyle = div.style.color || s.color',
      '  s.ctx.textAlign = "left"',
      '  s.ctx.textBaseline = "top"',
      '  var lines = text.split("\\n"); var lineH = fontSize * 1.5',
      '  for (var i = 0; i < lines.length; i++) { s.ctx.fillText(lines[i], x, y + i * lineH) }',
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
  CS[page] = { ctx: ctx, mode: 'pen', size: 2, color: '#1a1a2e', drawing: false, last: null, lineStart: null, dashed: false, savedState: null, radiusLabel: null, fontFamily: 'Times New Roman, serif', fontSize: 14 }

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
      createTextEditor(c, o.x, o.y, s.color, s.fontSize || 14, s.fontFamily || 'Times New Roman, serif', page)
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
    if (s.mode === 'compass' && s.lineStart && s.last) { var dx = s.last.x - s.lineStart.x, dy = s.last.y - s.lineStart.y, r = Math.sqrt(dx*dx + dy*dy); s.ctx.setLineDash([]); s.ctx.beginPath(); s.ctx.arc(s.lineStart.x, s.lineStart.y, r, 0, 2 * Math.PI); s.ctx.stroke(); var pxPerCm = c.width / (c.offsetWidth / 2.54 * 10); var radiusCm = (r / pxPerCm / 10).toFixed(1); s.ctx.fillStyle = s.color; s.ctx.font = '10px sans-serif'; s.ctx.textAlign = 'left'; s.ctx.fillText('r = ' + radiusCm + ' cm', s.lineStart.x + 5, s.lineStart.y - 5) }
    s.last = null; s.lineStart = null
  }

  c.addEventListener('mousedown', st); c.addEventListener('mousemove', mv); c.addEventListener('mouseup', sp); c.addEventListener('mouseleave', sp)
  c.addEventListener('touchstart', st, { passive: false }); c.addEventListener('touchmove', mv, { passive: false }); c.addEventListener('touchend', sp)
}

${TEXT_EDITOR_JS}

// --- Floating Tools: Ruler & Protractor ---
function drawRulerCanvas(cv, w) {
  var ctx = cv.getContext('2d'), h = 30
  cv.width = w * 2; cv.height = h * 2
  ctx.scale(2, 2)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5; ctx.strokeRect(0, 0, w, h)
  // 40px per cm, total 30cm
  var pxPerCm = w / 30
  for (var mm = 0; mm <= 300; mm++) {
    var x = mm * pxPerCm / 10
    if (x > w) break
    var isCm = mm % 10 === 0, isHalf = mm % 5 === 0
    var len = isCm ? 12 : isHalf ? 8 : 4
    ctx.strokeStyle = isCm ? '#1e293b' : '#94a3b8'
    ctx.lineWidth = isCm ? 0.8 : 0.3
    // top ticks
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke()
    // bottom ticks
    ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x, h - len); ctx.stroke()
    // cm labels
    if (isCm && mm > 0) {
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText((mm / 10) + '', x, len + 7)
      ctx.fillText((mm / 10) + '', x, h - len - 2)
    }
  }
  // unit label
  ctx.fillStyle = '#94a3b8'; ctx.font = '6px sans-serif'; ctx.textAlign = 'left'
  ctx.fillText('cm', w - 20, h - 2)
}

function drawProtractorCanvas(cv, d) {
  var r = d / 2, ctx = cv.getContext('2d')
  cv.width = d * 2; cv.height = (r + 20) * 2
  ctx.scale(2, 2); ctx.clearRect(0, 0, d, r + 20)
  // semicircle fill - thin and clean
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath(); ctx.moveTo(0, r + 20); ctx.lineTo(0, 0); ctx.arc(0, 0, r, 0, Math.PI); ctx.lineTo(-r, r + 20); ctx.closePath(); ctx.fill()
  // outer arc border
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.stroke()
  // baseline
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke()
  // inner arc (55% radius)
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.arc(0, 0, r * 0.55, Math.PI, 0); ctx.stroke()
  // degree marks - every 1 degree
  for (var deg = 0; deg <= 180; deg++) {
    var rad = deg * Math.PI / 180
    var cos = Math.cos(rad), sin = -Math.sin(rad)
    var isTen = deg % 10 === 0, isFive = deg % 5 === 0
    var outerLen = isTen ? 10 : isFive ? 6 : 3
    var innerLen = isTen ? 8 : 4
    ctx.strokeStyle = isTen ? '#1e293b' : isFive ? '#64748b' : '#cbd5e1'
    ctx.lineWidth = isTen ? 0.8 : 0.3
    // outer tick
    ctx.beginPath(); ctx.moveTo(cos * r, sin * r); ctx.lineTo(cos * (r - outerLen), sin * (r - outerLen)); ctx.stroke()
    // inner tick
    var innerR = r * 0.55
    ctx.beginPath(); ctx.moveTo(cos * innerR, sin * innerR); ctx.lineTo(cos * (innerR + innerLen), sin * (innerR + innerLen)); ctx.stroke()
    // labels every 10 degrees
    if (isTen) {
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(deg + '\u00B0', cos * (r - 14), sin * (r - 14))
      ctx.font = '7px sans-serif'; ctx.fillStyle = '#64748b'
      ctx.fillText((180 - deg) + '\u00B0', cos * (innerR + 13), sin * (innerR + 13))
    }
  }
  // cardinal labels
  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('0\u00B0', r - 12, 0)
  ctx.fillText('180\u00B0', -r + 12, 0)
  ctx.fillText('90\u00B0', 0, -r + 14)
  // center crosshair
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, 3); ctx.stroke()
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
    el.className += ' floating-ruler'; var w = 1200
    var cv = document.createElement('canvas'); el.appendChild(cv)
    setTimeout(function() { drawRulerCanvas(cv, w) }, 50)
    el.style.width = w + 'px'; el.style.height = '30px'
    el.style.transformOrigin = 'left bottom'
  // --- PROTRACTOR ---
  } else if (type === 'protractor') {
    el.className += ' floating-protractor'; var d = 360
    el.style.width = d + 'px'; el.style.height = (d / 2 + 4) + 'px'
    el.style.borderRadius = (d/2) + 'px ' + (d/2) + 'px 0 0'
    el.style.background = 'rgba(248,250,252,0.5)'
    el.style.border = '1px solid #94a3b8'
    el.style.borderBottom = 'none'
    var cv = document.createElement('canvas'); el.appendChild(cv)
    setTimeout(function() { drawProtractorCanvas(cv, d) }, 50)
    el.style.transformOrigin = 'left bottom'
  } else return
  // Position: center in .relative div
  var relRect = rel.getBoundingClientRect()
  el.style.left = Math.max(5, (relRect.width - parseFloat(el.style.width)) / 2) + 'px'
  el.style.top = Math.max(5, (relRect.height - parseFloat(el.style.height)) / 2) + 'px'
  el.style.transform = 'translate(0px,0px) rotate(0deg)'
  rel.appendChild(el)
  // Drag: full-height transparent strip
  var dragStrip = document.createElement('div')
  dragStrip.style.cssText = 'position:absolute;z-index:26;pointer-events:auto;top:0;left:0;right:30px;bottom:0;cursor:grab;background:rgba(59,130,246,0.06);border-radius:3px'
  dragStrip.title = 'Drag to move'
  el.appendChild(dragStrip)
  // Close button (left side)
  var hClose = document.createElement('div')
  hClose.style.cssText = 'position:absolute;z-index:26;pointer-events:auto;width:22px;height:22px;border-radius:50%;background:#ef4444;border:2px solid #dc2626;color:white;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);left:-11px;top:-11px'
  hClose.textContent = '\u2715'
  el.appendChild(hClose)
  hClose.addEventListener('click', function(e) { e.stopPropagation(); el.remove() })
  // Rotate button (right-top)
  var hRotate = document.createElement('div')
  hRotate.style.cssText = 'position:absolute;z-index:27;pointer-events:auto;width:22px;height:22px;border-radius:50%;background:#fef3c7;border:2px solid #f59e0b;color:#d97706;font-size:13px;display:flex;align-items:center;justify-content:center;cursor:crosshair;box-shadow:0 2px 4px rgba(0,0,0,0.3);right:-11px;top:-11px'
  hRotate.textContent = '\u21BB'
  el.appendChild(hRotate)
  // Resize button (right-bottom)
  var hResize = document.createElement('div')
  hResize.style.cssText = 'position:absolute;z-index:27;pointer-events:auto;width:18px;height:18px;border-radius:2px;background:#dbeafe;border:2px solid #3b82f6;color:#2563eb;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:se-resize;box-shadow:0 2px 4px rgba(0,0,0,0.3);right:-9px;bottom:-9px'
  hResize.textContent = '\u2921'
  el.appendChild(hResize)
  // Mode toggle button (top-center): switches between Draw (D) and Move (M)
  var modeBtn = document.createElement('div')
  modeBtn.style.cssText = 'position:absolute;z-index:30;pointer-events:auto;width:18px;height:18px;border-radius:50%;background:#e2e8f0;border:2px solid #64748b;color:#334155;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);left:50%;margin-left:-9px;top:-9px;font-weight:bold'
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
  var offX = -1, offY = -1
  function dragStart(e) { var t = e.touches ? e.touches[0] : e; var r = el.getBoundingClientRect(); offX = t.clientX - r.left; offY = t.clientY - r.top; e.stopPropagation() }
  function dragMove(e) { if (offX === -1 && offY === -1) return; var t = e.touches ? e.touches[0] : e; var rr = rel.getBoundingClientRect(); var dx = t.clientX - offX - rr.left; var dy = t.clientY - offY - rr.top; el.dataset.dx = String(dx); el.dataset.dy = String(dy); el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (parseFloat(el.dataset.angle) || 0) + 'deg)' }
  function dragEnd() { offX = -1; offY = -1 }
  dragStrip.addEventListener('mousedown', dragStart); document.addEventListener('mousemove', dragMove); document.addEventListener('mouseup', dragEnd)
  dragStrip.addEventListener('touchstart', dragStart, { passive: true }); document.addEventListener('touchmove', dragMove, { passive: true }); document.addEventListener('touchend', dragEnd)
  // --- Rotate events: updates rotate(angle) in transform ---
  var rotating = false
  function rotStart(e) { e.stopPropagation(); rotating = true }
  function rotMove(e) { if (!rotating) return; var t = e.touches ? e.touches[0] : e; var r = el.getBoundingClientRect(); var cx = r.left + r.width / 2, cy = r.top + r.height / 2; var angle = Math.atan2(t.clientY - cy, t.clientX - cx) * 180 / Math.PI; el.dataset.angle = String(angle); el.style.transform = 'translate(' + (parseFloat(el.dataset.dx) || 0) + 'px,' + (parseFloat(el.dataset.dy) || 0) + 'px) rotate(' + angle + 'deg)' }
  function rotEnd() { rotating = false }
  hRotate.addEventListener('mousedown', rotStart); document.addEventListener('mousemove', rotMove); document.addEventListener('mouseup', rotEnd)
  hRotate.addEventListener('touchstart', rotStart, { passive: true }); document.addEventListener('touchmove', rotMove, { passive: true }); document.addEventListener('touchend', rotEnd)
  // --- Resize events ---
  var resizing = false, startW = 0, startX = 0
  function resStart(e) { e.stopPropagation(); resizing = true; var t = e.touches ? e.touches[0] : e; startW = el.offsetWidth; startX = t.clientX }
  function resMove(e) { if (!resizing) return; var t = e.touches ? e.touches[0] : e; var dw = Math.max(150, t.clientX - startX + startW); el.style.width = dw + 'px'; if (type === 'protractor') { el.style.height = (dw / 2 + 4) + 'px'; el.style.borderRadius = (dw/2) + 'px ' + (dw/2) + 'px 0 0' }; var cv = el.querySelector('canvas'); if (cv) { if (type === 'ruler') drawRulerCanvas(cv, dw); else drawProtractorCanvas(cv, dw) } }
  function resEnd() { resizing = false }
  hResize.addEventListener('mousedown', resStart); document.addEventListener('mousemove', resMove); document.addEventListener('mouseup', resEnd)
  hResize.addEventListener('touchstart', resStart, { passive: true }); document.addEventListener('touchmove', resMove, { passive: true }); document.addEventListener('touchend', resEnd)
  // Ensure handles stay above drag strip
  hClose.style.zIndex = '28'; hRotate.style.zIndex = '28'; hResize.style.zIndex = '28'
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
            CS[pg] = { ctx: ctx, mode: 'pen', size: 2, color: '#1a1a2e', drawing: false, last: null, lineStart: null, dashed: false, savedState: null, radiusLabel: null, fontFamily: 'Times New Roman, serif', fontSize: 14 }
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
