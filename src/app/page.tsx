import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

async function getBrand() {
  let name = "SHB Learning Hub"
  let logo = ""
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("brand_name, logo_url")
      .eq("id", 1)
      .single()
    if (data?.brand_name) name = data.brand_name
    if (data?.logo_url) logo = data.logo_url
  } catch {}
  return { name, logo }
}

export default async function LandingPage() {
  const { name, logo } = await getBrand()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt={name} className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                {name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-bold text-gray-900">{name}</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</a>
            <a href="#teachers" className="text-sm font-medium text-gray-600 hover:text-gray-900">Teachers</a>
            <a href="#students" className="text-sm font-medium text-gray-600 hover:text-gray-900">Students</a>
            <Link href="/login" className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md">
              Sign In
            </Link>
          </nav>
          <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:hidden">
            Sign In
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Official Platform — SHB Modernhill
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Multi-Subject Learning <br />
              <span className="text-blue-200">Management, Reimagined</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-blue-100">
              {name} empowers educators to design, deliver, and evaluate instruction across Physics,
              Mathematics, Chemistry, Biology, and Economics — all within a single, integrated ecosystem.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 hover:shadow-xl">
                Get Started
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-medium text-white transition hover:bg-white/10">
                Explore Features
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Subjects", value: "5" },
              { label: "Grade Levels", value: "7–12" },
              { label: "Assessment Categories", value: "6" },
              { label: "Export Formats", value: "4" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-blue-600">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Overview ── */}
      <section id="features" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Core Capabilities</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="mt-4 text-gray-600">From syllabus planning to grade publication — a unified platform spanning every subject.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "📋", title: "Digital Syllabus", desc: "Plan syllabi by week, grade level, and subject. Fully aligned with Cambridge curriculum references." },
              { icon: "📝", title: "Interactive Worksheets", desc: "Upload PDF worksheets; students annotate, draw, and respond directly in the browser." },
              { icon: "🤖", title: "AI-Assisted Generation", desc: "Automatically generate lesson plans, worksheets, and assessment items using artificial intelligence." },
              { icon: "📊", title: "Academic Analytics", desc: "Monitor student progress across assessment categories with graphical visualisations and weighted calculations." },
              { icon: "✅", title: "Grading & Publishing", desc: "Evaluate submissions, provide targeted feedback, and publish scores to students with a single action." },
              { icon: "📱", title: "Mobile Accessibility", desc: "Students can access assignments, submit work, and review scores from any device." },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-blue-100 hover:shadow-md">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Teachers ── */}
      <section id="teachers" className="scroll-mt-20 bg-gray-50/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 text-center">For Educators</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 text-center">Teach, Don&apos;t Administrative</h2>
            <ul className="mt-10 space-y-4 max-w-2xl mx-auto">
              {[
                "Create syllabi and lesson plans using Cambridge-aligned templates — deploy across all your classes simultaneously.",
                "Upload PDF worksheets that students complete and submit digitally, eliminating paper workflows.",
                "Leverage AI for preliminary grading, deliver personalised feedback, and publish results instantly.",
                "Track each student's performance by category: Classwork, Unit Tests, Projects, Homework, and Semester Examinations.",
                "Export comprehensive grade reports to Excel for report cards and administrative distribution.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{i + 1}</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── For Students ── */}
      <section id="students" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 text-center">For Learners</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 text-center">Learning, Simplified</h2>
            <ul className="mt-10 space-y-4 max-w-2xl mx-auto">
              {[
                "Access assignments and materials from all subject teachers through a consolidated dashboard.",
                "Complete interactive worksheets directly in your browser with annotation, drawing, and text tools.",
                "Submit work with a single click; submission status updates automatically.",
                "Review your scores and academic progress across categories through interactive charts.",
                "Maintain a mistake journal for each subject — teachers can review and provide feedback.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">{i + 1}</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Subjects ── */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900">Supported Subjects</h2>
            <p className="mt-2 text-gray-600">Each subject maintains its own syllabus, worksheets, and grading pipeline — teachers manage only the disciplines assigned to them.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {[
              { code: "PHY", name: "Physics", icon: "⚛️" },
              { code: "MAT", name: "Mathematics", icon: "📐" },
              { code: "CHE", name: "Chemistry", icon: "🧪" },
              { code: "BIO", name: "Biology", icon: "🧬" },
              { code: "ECO", name: "Economics", icon: "📊" },
            ].map((s) => (
              <div key={s.code} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-200 hover:shadow">
                <div className="text-3xl">{s.icon}</div>
                <p className="mt-2 font-semibold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.code}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to Transform Your Teaching?</h2>
          <p className="mt-4 text-lg text-blue-100">Join your colleagues — complimentary access for all SHB Modernhill educators.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 hover:shadow-xl">
              Sign In to {name}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              {logo ? (
                <img src={logo} alt={name} className="h-8 w-8 rounded-lg object-contain" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                  {name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-semibold text-gray-900">{name}</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-900">Features</a>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Sign In</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {name} — SHB Modernhill. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
