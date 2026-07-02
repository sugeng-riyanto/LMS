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
<div class="pdf-page-wrapper mb-8 rounded-xl border bg-white overflow-hidden" data-page="${i + 1}">
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
  <div class="px-4 py-3 space-y-2 border-t bg-gray-50/50">
    <textarea rows="2" class="answer-text w-full rounded-lg border border-gray-300 p-3 text-sm resize-y" data-page="${i + 1}" placeholder="Type your answer for page ${i + 1} here (optional)" onpaste="return false"></textarea>
    <div class="flex flex-wrap items-center gap-1.5 no-print">
      <select class="tool-size text-xs border rounded px-1 py-0.5 bg-white" data-target="${i + 1}">
        <option value="2" selected>Thin</option><option value="5">Medium</option><option value="10">Thick</option><option value="20">Bold</option>
      </select>
      <button class="tool-pen px-2 py-0.5 text-xs rounded border bg-blue-100 border-blue-500" data-target="${i + 1}" data-mode="pen">✏️ Pen</button>
      <button class="tool-line px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="line">📏 Line</button>
      <button class="tool-dash px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="dash">┅ Dash</button>
      <button class="tool-eraser px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="eraser">🧹 Eraser</button>
      <button class="tool-clear px-2 py-0.5 text-xs rounded border bg-red-100 hover:bg-red-200 text-red-700" data-target="${i + 1}">🗑️ Clear</button>
      <select class="tool-color text-xs border rounded px-1 py-0.5 bg-white" data-target="${i + 1}">
        <option value="#1a1a2e" selected>Black</option><option value="#dc2626">Red</option><option value="#2563eb">Blue</option><option value="#16a34a">Green</option>
      </select>
      <button class="tool-ruler-btn px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" title="Ruler (cm)">📏</button>
      <button class="tool-protractor-btn px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" title="Protractor (°)">📐</button>
      <button class="tool-compass-btn px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" title="Compass">🌀</button>
      <span class="text-xs text-gray-400 ml-1" id="mode-label-${i + 1}">✏️ Pen</span>
    </div>
  </div>
</div>`).join("")

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
.annotation-canvas{position:absolute;top:0;left:0;width:100%!important;height:100%!important;cursor:crosshair;touch-action:none;pointer-events:auto;display:block;z-index:20}
.pdf-page-wrapper{position:relative}
.pdf-canvas{width:100%!important;height:auto!important;display:block}
.answer-text{-webkit-user-select:text;user-select:text}
.floating-tool{position:absolute;z-index:10;pointer-events:none;touch-action:none;-webkit-user-select:none;user-select:none}
.floating-tool canvas{display:block}
.floating-tool .handle{position:absolute;z-index:12;width:14px;height:14px;border-radius:50%;border:2px solid #3b82f6;background:white;opacity:0.7;pointer-events:auto}
.floating-tool .handle:hover{opacity:1;transform:scale(1.2)}
.floating-tool .h-rotate{right:-7px;top:-7px;cursor:crosshair}
.floating-tool .h-resize{right:-7px;bottom:-7px;cursor:se-resize}
.floating-tool .h-close{left:-7px;top:-7px;cursor:pointer;background:#ef4444;border-color:#ef4444;color:white;font-size:8px;display:flex;align-items:center;justify-content:center;line-height:14px}
.floating-tool .h-close::after{content:'✕'}
.floating-ruler{background:rgba(255,255,255,0.7);border:1px solid #94a3b8;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.1)}
.floating-protractor{background:rgba(255,255,255,0.7);border:1px solid #94a3b8;box-shadow:0 1px 4px rgba(0,0,0,0.1)}
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

<script type="module">
import { getDocument, GlobalWorkerOptions } from '/pdfjs/pdf.min.mjs'
GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'

const PDF_URL = ${JSON.stringify(directPdfUrl)}
const PDF_EMBED = ${JSON.stringify(embedPdfUrl)}
const PDF_PAGES = ${pages}

var CS = {}
var TOTAL_PAGES = 0

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
  CS[page] = { ctx: ctx, mode: 'pen', size: 2, color: '#1a1a2e', drawing: false, last: null, lineStart: null, dashed: false }

  function p(e) {
    var r = c.getBoundingClientRect()
    var s = c.width / r.width
    var si = c.height / r.height
    var t = e.touches ? e.touches[0] : e
    return { x: (t.clientX - r.left) * s, y: (t.clientY - r.top) * si }
  }

  function st(e) { e.preventDefault(); var s = CS[page]; if (!s) return; var o = p(e); s.drawing = true; s.last = o; s.lineStart = o; s.ctx.globalCompositeOperation = 'source-over';
    if (s.mode === 'pen' || s.mode === 'line' || s.mode === 'dash') {
      s.ctx.strokeStyle = s.color; s.ctx.lineWidth = s.size; s.ctx.setLineDash(s.mode === 'dash' ? [s.size * 3, s.size * 3] : []); s.ctx.beginPath(); s.ctx.moveTo(o.x, o.y)
    } else if (s.mode === 'eraser') {
      s.ctx.strokeStyle = '#000000'; s.ctx.lineWidth = s.size * 3; s.ctx.globalCompositeOperation = 'destination-out'; s.ctx.setLineDash([]); s.ctx.beginPath(); s.ctx.moveTo(o.x, o.y)
    } else if (s.mode === 'compass') {
      s.ctx.strokeStyle = s.color; s.ctx.lineWidth = s.size; s.ctx.setLineDash([])
    }
  }
  function mv(e) { if (!CS[page] || !CS[page].drawing) return; e.preventDefault(); var s = CS[page]; var o = p(e); if (!s.last) return;
    if (s.mode === 'pen' || s.mode === 'eraser') { s.ctx.beginPath(); s.ctx.moveTo(s.last.x, s.last.y); s.ctx.lineTo(o.x, o.y); s.ctx.stroke() }
    s.last = o
  }
  function sp() { var s = CS[page]; if (!s) return; s.drawing = false;
    if ((s.mode === 'line' || s.mode === 'dash') && s.lineStart && s.last) { s.ctx.beginPath(); s.ctx.moveTo(s.lineStart.x, s.lineStart.y); s.ctx.lineTo(s.last.x, s.last.y); s.ctx.stroke(); s.ctx.setLineDash([]) }
    if (s.mode === 'compass' && s.lineStart && s.last) { var dx = s.last.x - s.lineStart.x, dy = s.last.y - s.lineStart.y, r = Math.sqrt(dx*dx + dy*dy); s.ctx.beginPath(); s.ctx.arc(s.lineStart.x, s.lineStart.y, r, 0, 2 * Math.PI); s.ctx.stroke() }
    s.last = null; s.lineStart = null
  }

  c.addEventListener('mousedown', st); c.addEventListener('mousemove', mv); c.addEventListener('mouseup', sp); c.addEventListener('mouseleave', sp)
  c.addEventListener('touchstart', st, { passive: false }); c.addEventListener('touchmove', mv, { passive: false }); c.addEventListener('touchend', sp)
}

// --- Floating Tools: Ruler & Protractor ---
function drawRulerCanvas(cv, w) {
  var ctx = cv.getContext('2d')
  cv.width = w * 2; cv.height = 72
  ctx.scale(2, 2)
  ctx.clearRect(0, 0, w, 36)
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, w, 36)
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.5
  // cm marks: 10px per mm, 100px per cm
  for (var i = 0; i <= w; i += 5) {
    var x = i, h = i % 50 === 0 ? 18 : i % 25 === 0 ? 12 : 6
    ctx.beginPath(); ctx.moveTo(x, 36); ctx.lineTo(x, 36 - h); ctx.stroke()
    if (i % 50 === 0) { ctx.fillStyle = '#334155'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(i / 10, x, 34 - h) }
  }
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.5; ctx.strokeRect(0, 0, w, 36)
}

function drawProtractorCanvas(cv, d) {
  var r = d / 2, ctx = cv.getContext('2d')
  cv.width = d * 2; cv.height = (r + 16) * 2
  ctx.scale(2, 2); ctx.clearRect(0, 0, d, r + 16)
  // background semicircle (transparent)
  ctx.fillStyle = 'rgba(248,250,252,0.4)'; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke()
  // degree marks — 0 on right, 180 on left, 90 on top
  for (var deg = 0; deg <= 180; deg += 2) {
    var rad = deg * Math.PI / 180, len = deg % 10 === 0 ? 10 : deg % 5 === 0 ? 6 : 3
    var x1 = Math.cos(rad) * r, y1 = -Math.sin(rad) * r, x2 = Math.cos(rad) * (r - len), y2 = -Math.sin(rad) * (r - len)
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    if (deg % 10 === 0) {
      ctx.fillStyle = '#334155'; ctx.font = '6px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(deg + '°', Math.cos(rad) * (r - 14), -Math.sin(rad) * (r - 14) + 2)
    }
  }
  ctx.fillStyle = '#334155'; ctx.font = '6px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('0°', r - 10, 8); ctx.fillText('180°', -r + 10, 8); ctx.fillText('90°', 0, -r + 10)
}

function createFloatingTool(type, pageWrapper) {
  var wrapper = pageWrapper || document.querySelector('.pdf-page-wrapper')
  if (!wrapper) return
  var rel = wrapper.querySelector('.relative'); if (!rel) return
  var el = document.createElement('div')
  el.className = 'floating-tool'
  if (type === 'ruler') {
    el.className += ' floating-ruler'; var w = 500
    var cv = document.createElement('canvas'); el.appendChild(cv)
    setTimeout(function() { drawRulerCanvas(cv, w) }, 50)
    el.style.width = w + 'px'; el.style.height = '36px'
  } else if (type === 'protractor') {
    el.className += ' floating-protractor'; var d = 300
    var cv = document.createElement('canvas'); el.appendChild(cv)
    setTimeout(function() { drawProtractorCanvas(cv, d) }, 50)
    el.style.width = d + 'px'; el.style.height = (d / 2 + 16) + 'px'
  } else return
  // Position at center of page wrapper
  var wr = wrapper.getBoundingClientRect()
  el.style.left = (wr.width / 2 - parseFloat(el.style.width) / 2) + 'px'
  el.style.top = '20px'
  // Handles
  var hClose = document.createElement('div'); hClose.className = 'handle h-close'; el.appendChild(hClose)
  var hRotate = document.createElement('div'); hRotate.className = 'handle h-rotate'; el.appendChild(hRotate)
  var hResize = document.createElement('div'); hResize.className = 'handle h-resize'; el.appendChild(hResize)
  // Rotate
  var rotating = false, rotAngle = 0
  function rotStart(e) { e.stopPropagation(); rotating = true; rotAngle = parseFloat(el.dataset.angle) || 0 }
  function rotMove(e) { if (!rotating) return; var t = e.touches ? e.touches[0] : e; var rect = rel.getBoundingClientRect(); var cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2; var angle = Math.atan2(t.clientY - (rect.top + cy), t.clientX - (rect.left + cx)) * 180 / Math.PI; el.style.transform = 'rotate(' + angle + 'deg)'; el.dataset.angle = angle }
  function rotEnd() { rotating = false }
  hRotate.addEventListener('mousedown', rotStart); document.addEventListener('mousemove', rotMove); document.addEventListener('mouseup', rotEnd)
  hRotate.addEventListener('touchstart', rotStart, { passive: true }); document.addEventListener('touchmove', rotMove, { passive: true }); document.addEventListener('touchend', rotEnd)
  // Resize
  var resizing = false, startW = 0, startH = 0, startX = 0, startY = 0
  function resStart(e) { e.stopPropagation(); resizing = true; var t = e.touches ? e.touches[0] : e; startW = el.offsetWidth; startH = el.offsetHeight; startX = t.clientX; startY = t.clientY }
  function resMove(e) { if (!resizing) return; var t = e.touches ? e.touches[0] : e; var dw = t.clientX - startX + startW, dh = Math.max(36, startH * (dw / startW)); el.style.width = Math.max(100, dw) + 'px'; if (type === 'ruler') el.style.height = '36px'; else el.style.height = (Math.max(100, dw) / 2 + 16) + 'px'; var cv = el.querySelector('canvas'); if (cv) { if (type === 'ruler') { drawRulerCanvas(cv, Math.max(100, dw)) } else { drawProtractorCanvas(cv, Math.max(100, dw)) } } }
  function resEnd() { resizing = false }
  hResize.addEventListener('mousedown', resStart); document.addEventListener('mousemove', resMove); document.addEventListener('mouseup', resEnd)
  hResize.addEventListener('touchstart', resStart, { passive: true }); document.addEventListener('touchmove', resMove, { passive: true }); document.addEventListener('touchend', resEnd)
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
    var pdf = await getDocument({ url: PDF_URL }).promise
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
    // Hide remaining loading for pages beyond actual page count
    for (var i = total + 1; i <= PDF_PAGES; i++) {
      var loading = document.querySelector('.pdf-loading[data-page="' + i + '"]')
      if (loading) {
        loading.innerHTML = '<span class="text-gray-400">No content</span>'
        loading.classList.remove('animate-pulse')
      }
    }
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
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = '✏️ Pen'
    })
  })
  document.querySelectorAll('.tool-line').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'line'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5); CS[target].ctx.globalCompositeOperation = 'source-over'; CS[target].ctx.setLineDash([]) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = '📏 Line'
    })
  })
  document.querySelectorAll('.tool-dash').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'dash'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5); CS[target].ctx.globalCompositeOperation = 'source-over' }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = '┅ Dash'
    })
  })
  document.querySelectorAll('.tool-eraser').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'eraser'; CS[target].ctx.strokeStyle = '#000000'; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5) * 3; CS[target].ctx.globalCompositeOperation = 'destination-out'; CS[target].ctx.setLineDash([]) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = '🧹 Eraser'
    })
  })
  document.querySelectorAll('.tool-compass-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'compass'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5); CS[target].ctx.globalCompositeOperation = 'source-over'; CS[target].ctx.setLineDash([]) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = '🌀 Compass'
    })
  })
  document.querySelectorAll('.tool-ruler-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      var wrapper = document.querySelector('.pdf-page-wrapper[data-page="' + target + '"]')
      createFloatingTool('ruler', wrapper)
    })
  })
  document.querySelectorAll('.tool-protractor-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      var wrapper = document.querySelector('.pdf-page-wrapper[data-page="' + target + '"]')
      createFloatingTool('protractor', wrapper)
    })
  })
  document.querySelectorAll('.tool-clear').forEach(function(b) {
    b.addEventListener('click', function() { clearPage(parseInt(this.dataset.target)) })
  })
  document.querySelectorAll('.tool-size').forEach(function(s) {
    s.addEventListener('change', function() { var t = parseInt(this.dataset.target); if (CS[t]) CS[t].size = parseInt(this.value) })
  })
  document.querySelectorAll('.tool-color').forEach(function(s) {
    s.addEventListener('change', function() { var t = parseInt(this.dataset.target); if (CS[t]) { CS[t].color = this.value; CS[t].ctx.strokeStyle = this.value } })
  })
  document.querySelectorAll('.doc-preview').forEach(function(el) {
    el.addEventListener('click', function() { var e = this.dataset.embed; if (e) { this.innerHTML = '<iframe src="' + e + '" class="w-full h-full" allowfullscreen style="border:0"></iframe>'; this.className = 'w-full h-full' } })
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
