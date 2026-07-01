import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: plan } = await (supabase.from("syllabus_planning") as any)
      .select("*")
      .eq("id", id)
      .single()

    if (!plan) return new NextResponse("Syllabus not found", { status: 404 })

    const grade = plan.grade
    const week = plan.week_number
    const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, "")
    const origin = `https://lms-chi-orpin.vercel.app`

    const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    // Load objectives
    let objectives: Array<{ topic: string; objectives: string[] }> = []
    try {
      const { data: objData } = await (supabase.from("syllabus_objectives") as any).select("topic, objectives").eq("grade", grade)
      if (objData) objectives = objData
    } catch {}

    // Build media sources HTML
    const mediaLinks = (plan.media_links as Array<{ type: string; url: string; title: string; section: string }>) || []

    function getEmbedUrl(url: string, type: string): string | null {
      if (type === "youtube") {
        const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
        return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : null
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
            <img src="${thumb}" class="w-full h-full object-cover" alt="" loading="lazy" />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div class="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center border-2 border-white/80"><span class="text-white text-2xl ml-1">&#9654;</span></div></div>
          </div>
          <p class="text-xs text-gray-400 px-2 pb-1">${esc(src.title)}</p>
        </div>`
      }
      if (src.type === "pdf" || src.type === "slides") {
        const isSlide = src.type === "slides"
        return `<div class="mt-3 rounded-lg overflow-hidden border">
          <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
            <p class="text-sm font-medium truncate">${esc(src.title)}</p>
            <a href="${esc(src.url)}" target="_blank" class="text-xs text-blue-600 underline shrink-0 ml-2">Open ↗</a>
          </div>
          <div style="aspect-ratio:16/9;max-height:500px">
            <div class="doc-preview cursor-pointer w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200" data-embed="${esc(emb || "")}">
              <span class="text-3xl mb-2">${isSlide ? "📽️" : "📄"}</span>
              <p class="text-sm font-medium">Click to preview</p>
              <p class="text-xs mt-1 text-center px-4">${esc(src.title)}</p>
            </div>
          </div>
        </div>`
      }
      if (src.type === "audio") return `<div class="mt-3"><audio controls class="w-full"><source src="${esc(src.url)}"></audio><p class="text-xs text-gray-400 mt-1">${esc(src.title)}</p></div>`
      return `<div class="mt-2"><a href="${esc(src.url)}" target="_blank" class="text-blue-600 underline text-sm">${esc(src.title)}</a></div>`
    }

    const openingSources = mediaLinks.filter(s => s.section === "opening")
    const questionSources = mediaLinks.filter(s => s.section === "questions")

    // Build answer items
    const hooks = (plan.opening_ideas || "").split("\n").filter(Boolean)
    const questions = (plan.activity_questions || []) as Array<{ question: string; bloom?: string; timing?: string }>
    const problems = (plan.problems || []) as Array<{ problem: string; level?: string }>
    const allItems = [
      ...hooks.map((h: string) => ({ text: h, section: "opening" as const })),
      ...questions.map((q: { question: string }) => ({ text: q.question, section: "question" as const })),
      ...problems.map((p: { problem: string }) => ({ text: p.problem, section: "problem" as const })),
    ]

    // Objectives HTML
    const topicName = plan.topic || ""
    const matchedObj = objectives.find((o: any) => topicName.toLowerCase().includes(o.topic.toLowerCase()))
    const objItems = matchedObj?.objectives || []
    const objectivesHtml = objItems.length
      ? `<div class="mb-6"><h2 class="text-lg font-semibold text-gray-800 mb-2">Learning Objectives</h2><div class="border-l-4 border-green-500 pl-4"><p class="font-medium text-gray-800">${esc(topicName)}</p><ul class="space-y-1 mt-2">${objItems.map((o: string) => `<li class="text-xs text-gray-600 flex items-start gap-1.5"><span class="text-green-500 mt-0.5">•</span>${esc(o)}</li>`).join("")}</ul></div></div>`
      : ""

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Syllabus - Grade ${grade} Week ${week}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
body{font-family:'Segoe UI',system-ui,sans-serif;font-size:14px}
@media print{body{background:#fff;padding:0}.no-print{display:none!important}}
canvas{touch-action:none;cursor:crosshair;border-radius:8px;max-width:100%}
.signature-box{border:2px dashed #ccc;border-radius:12px;min-height:120px}
</style>
</head>
<body class="bg-gray-50 text-gray-900 p-4 md:p-8 min-h-screen">
<div class="max-w-5xl mx-auto" id="syllabus-content">
<div class="bg-white rounded-2xl shadow-sm border p-6 md:p-10 space-y-8">

<div class="border-b pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
<div>
<h1 class="text-2xl md:text-3xl font-bold">Syllabus Plan</h1>
<p class="text-gray-500 mt-1">Grade ${grade} · Week ${week} · ${dateStr}</p>
<p class="text-gray-700 mt-2 font-medium text-lg">Topic: ${esc(topicName)}</p>
</div>
<div class="shrink-0 text-center">
<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${origin}/syllabus/public/${id}`)}" alt="QR" class="w-24 h-24 mx-auto rounded border" />
<p class="text-[10px] text-gray-400 mt-1">Scan to view online</p>
</div>
</div>

${objectivesHtml}

<!-- STUDENT INFO -->
<div class="bg-gray-50 rounded-xl p-4 md:p-6 space-y-4 border">
<h3 class="font-semibold text-gray-700">Student Information</h3>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div><label class="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
<input id="student-name" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Enter your name" /></div>
<div><label class="block text-sm font-medium text-gray-600 mb-1">Date</label>
<input type="text" value="${dateCode}" readonly class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-100 text-gray-500" /></div>
</div>
</div>

<!-- ANSWER SECTIONS -->
<div class="space-y-8 mt-6">
${allItems.map((item, idx) => {
  const bg = item.section === "opening" ? "bg-blue-50" : item.section === "question" ? "bg-green-50" : "bg-purple-50"
  const label = item.section === "opening" ? "Opening Ideas" : item.section === "question" ? "Activity Question" : "Problem"
  const srcList = item.section === "opening" ? openingSources : item.section === "question" ? questionSources : []
  return `<div class="rounded-xl border p-5 space-y-4">
<div class="flex items-start gap-3">
<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg} text-xs font-bold text-gray-700">${idx + 1}</div>
<div class="flex-1"><p class="text-xs text-gray-500 mb-1">${label}</p><p class="font-medium text-gray-800">${esc(item.text)}</p></div>
</div>
${srcList.map(s => renderMedia(s)).join("")}
<div class="space-y-3">
<textarea rows="3" class="w-full rounded-lg border border-gray-300 p-3 text-sm resize-y" placeholder="Type your answer here (paste disabled)" onpaste="event.preventDefault();alert('Paste is disabled')" oncopy="event.preventDefault()" oncut="event.preventDefault()"></textarea>
<div class="flex flex-wrap items-center gap-1.5 mt-1 no-print">
<select class="tool-size text-xs border rounded px-1 py-0.5 bg-white" data-target="c${idx}"><option value="2">Thin</option><option value="5" selected>Medium</option><option value="10">Thick</option><option value="20">Bold</option></select>
<button class="tool-pen px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="c${idx}" data-mode="pen">✏️ Pen</button>
<button class="tool-eraser px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="c${idx}" data-mode="eraser">🧹 Eraser</button>
<button class="tool-clear px-2 py-0.5 text-xs rounded border bg-red-100 hover:bg-red-200 text-red-700" data-target="c${idx}">🗑️ Clear</button>
<span class="text-xs text-gray-400 ml-1" id="mode-label-${idx}">✏️ Drawing</span>
</div>
<canvas id="c${idx}" width="700" height="250" class="w-full rounded-lg border"></canvas>
</div>
</div>`
}).join("")}
</div>

<!-- SIGNATURE -->
<div class="rounded-xl border-2 border-dashed border-gray-400 p-6 space-y-3 mt-8">
<h3 class="font-semibold text-gray-700">Signature</h3>
<canvas id="sig" width="700" height="120" class="w-full signature-box"></canvas>
<div class="flex gap-2 no-print">
<button onclick="clearC('sig')" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">Clear</button>
</div>
</div>

<div class="flex flex-wrap gap-3 pt-4 no-print">
<button onclick="window.print()" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm">🖨️ Print / Save as PDF</button>
<button onclick="clearAll()" class="px-4 py-3 border rounded-xl font-medium hover:bg-gray-100">Clear All</button>
</div>

<div class="border-t pt-6 text-center text-sm text-gray-400">
<p>Generated by Physics Command Center - SHB Modernhill</p>
</div>
</div>
</div>

<script>
var CS = {}
function initC(id) {
  var c = document.getElementById(id); if(!c) return
  var ctx = c.getContext("2d")
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height)
  CS[id] = {ctx:ctx,mode:"pen",size:5,color:"#1a1a2e",drawing:false,last:null}
  function p(e){var r=c.getBoundingClientRect(),s=c.width/r.width,si=c.height/r.height,t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*s,y:(t.clientY-r.top)*si}}
  function st(e){e.preventDefault();var s=CS[id];s.drawing=true;var o=p(e);s.last=o;s.ctx.beginPath();s.ctx.moveTo(o.x,o.y)}
  function mv(e){if(!CS[id].drawing)return;e.preventDefault();var s=CS[id];var o=p(e);if(s.last){s.ctx.beginPath();s.ctx.moveTo(s.last.x,s.last.y);s.ctx.lineTo(o.x,o.y);s.ctx.stroke()}s.last=o}
  function sp(){CS[id].drawing=false;CS[id].last=null}
  c.addEventListener("mousedown",st);c.addEventListener("mousemove",mv);c.addEventListener("mouseup",sp);c.addEventListener("mouseleave",sp)
  c.addEventListener("touchstart",st,{passive:false});c.addEventListener("touchmove",mv,{passive:false});c.addEventListener("touchend",sp)
}
function clearC(id){var c=document.getElementById(id);if(!c)return;c.getContext("2d").fillRect(0,0,c.width,c.height)}
function clearAll(){document.querySelectorAll("textarea").forEach(function(t){t.value=""});document.querySelectorAll("canvas").forEach(function(c){clearC(c.id)})}
document.addEventListener("DOMContentLoaded",function(){
  document.querySelectorAll("canvas[id^=c],#sig").forEach(function(c){initC(c.id)})
  document.querySelectorAll(".tool-pen,.tool-eraser").forEach(function(b){
    b.addEventListener("click",function(){
      var t=this.dataset.target,mode=this.dataset.mode
      if(CS[t])CS[t].mode=mode
      var s=CS[t];if(s){s.ctx.lineWidth = parseInt(document.querySelector('.tool-size[data-target="'+t+'"]')?.value||5);if(mode==="eraser"){s.ctx.strokeStyle="#fff";var l=document.getElementById("mode-label-"+t.replace("c",""));if(l)l.textContent="🧹 Eraser"}else{s.ctx.strokeStyle=s.color;var l=document.getElementById("mode-label-"+t.replace("c",""));if(l)l.textContent="✏️ Drawing"}}
      document.querySelectorAll('.tool-pen[data-target="'+t+'"],.tool-eraser[data-target="'+t+'"]').forEach(function(x){x.style.background="#fff";x.style.borderColor="#d1d5db"})
      this.style.background="#dbeafe";this.style.borderColor="#3b82f6"
    })
  })
  document.querySelectorAll(".tool-size").forEach(function(s){s.addEventListener("change",function(){var t=this.dataset.target;if(CS[t])CS[t].ctx.lineWidth=parseInt(this.value)})})
  document.querySelectorAll(".tool-clear").forEach(function(b){b.addEventListener("click",function(){clearC(this.dataset.target)})})
  document.querySelectorAll(".yt-player").forEach(function(el){el.addEventListener("click",function(){var e=this.dataset.embed;if(e)this.innerHTML='<iframe src="'+e+'" class="absolute inset-0 w-full h-full" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen style="border:0"></iframe>'})})
  document.querySelectorAll(".doc-preview").forEach(function(el){el.addEventListener("click",function(){var e=this.dataset.embed;if(e){this.innerHTML='<iframe src="'+e+'" class="w-full h-full" allowfullscreen style="border:0"></iframe>';this.className="w-full h-full"}})})
})
</script>
</body></html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    })
  } catch (error) {
    return new NextResponse("Error loading syllabus", { status: 500 })
  }
}
