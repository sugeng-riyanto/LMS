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
        const thumb = `https://img.youtube.com/vi/${vid}/0.jpg`
        return `<div class="mt-3 rounded-lg overflow-hidden border bg-black relative" style="aspect-ratio:16/9">
          <div class="yt-player cursor-pointer relative w-full h-full" data-embed="${esc(emb || "")}">
            <img src="${thumb}" class="w-full h-full object-cover" alt="" loading="lazy" style="pointer-events:none" />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div class="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center border-2 border-white/80"><span class="text-white text-2xl ml-1">&#9654;</span></div></div>
          </div>
          <p class="text-xs text-gray-400 px-2 pb-1">${esc(src.title)}</p>
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
    <textarea rows="2" class="answer-text w-full rounded-lg border border-gray-300 p-3 text-sm resize-y" data-page="${i + 1}" placeholder="Type your answer for page ${i + 1} here (optional)"></textarea>
    <div class="flex flex-wrap items-center gap-1.5 no-print">
      <select class="tool-size text-xs border rounded px-1 py-0.5 bg-white" data-target="${i + 1}">
        <option value="2">Thin</option><option value="5" selected>Medium</option><option value="10">Thick</option><option value="20">Bold</option>
      </select>
      <button class="tool-pen px-2 py-0.5 text-xs rounded border bg-blue-100 border-blue-500" data-target="${i + 1}" data-mode="pen">✏️ Pen</button>
      <button class="tool-eraser px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="${i + 1}" data-mode="eraser">🧹 Eraser</button>
      <button class="tool-clear px-2 py-0.5 text-xs rounded border bg-red-100 hover:bg-red-200 text-red-700" data-target="${i + 1}">🗑️ Clear</button>
      <select class="tool-color text-xs border rounded px-1 py-0.5 bg-white" data-target="${i + 1}">
        <option value="#1a1a2e" selected>Black</option><option value="#dc2626">Red</option><option value="#2563eb">Blue</option><option value="#16a34a">Green</option>
      </select>
      <span class="text-xs text-gray-400 ml-1" id="mode-label-${i + 1}">✏️ Drawing</span>
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
.annotation-canvas{position:absolute;top:0;left:0;width:100%!important;height:100%!important;cursor:crosshair;touch-action:none;pointer-events:auto;display:block}
.pdf-page-wrapper{position:relative}
.pdf-canvas{width:100%!important;height:auto!important;display:block}
.answer-text{-webkit-user-select:text;user-select:text}
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

<div class="bg-white rounded-2xl shadow-sm border p-6">
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

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.js'

const PDF_URL = ${JSON.stringify(directPdfUrl)}
const PDF_EMBED = ${JSON.stringify(embedPdfUrl)}
const PDF_PAGES = ${pages}

var CS = {}

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
  CS[page] = { ctx: ctx, mode: 'pen', size: 5, color: '#1a1a2e', drawing: false, last: null }

  function p(e) {
    var r = c.getBoundingClientRect()
    var s = c.width / r.width
    var si = c.height / r.height
    var t = e.touches ? e.touches[0] : e
    return { x: (t.clientX - r.left) * s, y: (t.clientY - r.top) * si }
  }

  function st(e) { e.preventDefault(); var s = CS[page]; if (!s) return; s.drawing = true; var o = p(e); s.last = o; s.ctx.beginPath(); s.ctx.moveTo(o.x, o.y); s.ctx.strokeStyle = s.color; s.ctx.lineWidth = s.size }
  function mv(e) { if (!CS[page] || !CS[page].drawing) return; e.preventDefault(); var s = CS[page]; var o = p(e); if (s.last) { s.ctx.beginPath(); s.ctx.moveTo(s.last.x, s.last.y); s.ctx.lineTo(o.x, o.y); s.ctx.stroke() } s.last = o }
  function sp() { if (CS[page]) { CS[page].drawing = false; CS[page].last = null } }

  c.addEventListener('mousedown', st); c.addEventListener('mousemove', mv); c.addEventListener('mouseup', sp); c.addEventListener('mouseleave', sp)
  c.addEventListener('touchstart', st, { passive: false }); c.addEventListener('touchmove', mv, { passive: false }); c.addEventListener('touchend', sp)
}

function clearPage(page) {
  var c = document.querySelector('.annotation-canvas[data-page="' + page + '"]')
  if (!c) return
  var ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  CS[page] = CS[page] || { ctx: ctx, mode: 'pen', size: 5, color: '#1a1a2e', drawing: false, last: null }
}

function clearAll() { for (var i = 1; i <= PDF_PAGES; i++) clearPage(i) }

async function loadPDF() {
  try {
    var pdf = await pdfjsLib.getDocument({ url: PDF_URL, useSystemFonts: true }).promise
    for (var i = 1; i <= Math.min(pdf.numPages, PDF_PAGES); i++) {
      var loading = document.querySelector('.pdf-loading[data-page="' + i + '"]')
      var canvas = document.querySelector('.pdf-canvas[data-page="' + i + '"]')
      if (!canvas) continue
      var page = await pdf.getPage(i)
      var viewport = page.getViewport({ scale: 1.5 })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.display = 'block'
      var ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport: viewport }).promise
      if (loading) loading.style.display = 'none'
      initAnnotation(i)
    }
  } catch (e) {
    console.error('PDF.js failed:', e)
    if (PDF_EMBED) {
      document.querySelectorAll('.pdf-page-wrapper').forEach(function(el) {
        var page = el.dataset.page
        el.innerHTML = '<div style="aspect-ratio:1/1.4;max-height:90vh"><iframe src="' + PDF_EMBED + '" class="w-full h-full" style="border:0" allowfullscreen></iframe></div><div class="px-4 py-3 space-y-2 border-t bg-gray-50/50"><textarea rows="2" class="answer-text w-full rounded-lg border border-gray-300 p-3 text-sm resize-y" data-page="' + page + '" placeholder="Type your answer for page ' + page + ' here (optional)"></textarea></div>'
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

function handlePrint() {
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
  }, 15000)
  loadPDF().then(function() { clearTimeout(pdfTimeout) }).catch(function() { clearTimeout(pdfTimeout) })

  document.querySelectorAll('.tool-pen').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'pen'; CS[target].ctx.strokeStyle = CS[target].color; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5) }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = '✏️ Drawing'
      document.querySelectorAll('.tool-pen[data-target="' + target + '"],.tool-eraser[data-target="' + target + '"]').forEach(function(x) { x.style.background = '#fff'; x.style.borderColor = '#d1d5db' })
      this.style.background = '#dbeafe'; this.style.borderColor = '#3b82f6'
    })
  })
  document.querySelectorAll('.tool-eraser').forEach(function(b) {
    b.addEventListener('click', function() {
      var target = parseInt(this.dataset.target)
      if (CS[target]) { CS[target].mode = 'eraser'; CS[target].ctx.strokeStyle = 'rgba(0,0,0,0)'; CS[target].ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="' + target + '"]')?.value || 5) * 3 }
      var label = document.getElementById('mode-label-' + target); if (label) label.textContent = '🧹 Eraser'
      document.querySelectorAll('.tool-pen[data-target="' + target + '"],.tool-eraser[data-target="' + target + '"]').forEach(function(x) { x.style.background = '#fff'; x.style.borderColor = '#d1d5db' })
      this.style.background = '#fef3c7'; this.style.borderColor = '#f59e0b'
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
  document.querySelectorAll('.yt-player').forEach(function(el) {
    el.addEventListener('click', function() {
      var e = this.dataset.embed
      if (e) this.innerHTML = '<iframe src="' + e + '" class="absolute inset-0 w-full h-full" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen style="border:0"></iframe>'
    })
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
