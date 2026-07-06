import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import SubjectCarousel from "@/components/landing/subject-carousel"
import LandingThemeToggle from "@/components/landing/theme-toggle"

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
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt={name} className="h-9 w-9 rounded-lg object-contain ring-2 ring-border" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                {name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-bold text-foreground">{name}</span>
          </div>
          <nav className="hidden items-center gap-3 sm:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#teachers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Teachers</a>
            <a href="#students" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Students</a>
            <a href="#demo" className="text-sm font-medium text-primary font-semibold hover:text-primary/80 transition-colors">Demo Access</a>
            <LandingThemeToggle />
            <Link href="/login" className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-300 hover:opacity-90 hover:shadow-md hover:scale-105 active:scale-95">
              Sign In
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:hidden">
            <LandingThemeToggle />
            <Link href="/login" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-300 hover:opacity-90">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-[oklch(0.4_0.12_255)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-sm text-primary-foreground/90 backdrop-blur ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Further Platform — SHB Modernhill
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Multi-Subject Learning <br />
              <span className="text-primary-foreground/70">Management, Reimagined</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80">
              {name} empowers educators to design, deliver, and evaluate instruction across Physics,
              Mathematics, Chemistry, Biology, and Economics — all within a single, integrated ecosystem.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-card px-8 py-3.5 text-base font-semibold text-primary shadow-lg transition-all duration-300 hover:bg-secondary hover:shadow-xl hover:scale-105 active:scale-95">
                Get Started
                <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-xl border border-background/30 px-8 py-3.5 text-base font-medium text-primary-foreground backdrop-blur transition-all duration-300 hover:bg-background/10 hover:scale-105 active:scale-95">
                Explore Features
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Subjects", value: "5" },
              { label: "Grade Levels", value: "7–12" },
              { label: "Assessment Categories", value: "6" },
              { label: "Export Formats", value: "4" },
            ].map((s) => (
              <div key={s.label} className="text-center group cursor-default">
                <p className="text-3xl font-bold text-primary transition-all duration-300 group-hover:scale-110">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Overview ── */}
      <section id="features" className="scroll-mt-20 py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Core Capabilities</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="mt-4 text-muted-foreground">From syllabus planning to grade publication — a unified platform spanning every subject.</p>
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
              <div key={f.title} className="group rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:bg-card">
                <div className="mb-4 text-3xl transition-transform duration-300 group-hover:scale-110">{f.icon}</div>
                <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-300">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Teachers ── */}
      <section id="teachers" className="scroll-mt-20 py-20 bg-gradient-to-b from-secondary/50 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary text-center">For Educators</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground text-center">Teach, Don&apos;t Administrative</h2>
            <ul className="mt-10 space-y-4 max-w-2xl mx-auto">
              {[
                "Create syllabi and lesson plans using Cambridge-aligned templates — deploy across all your classes simultaneously.",
                "Upload PDF worksheets that students complete and submit digitally, eliminating paper workflows.",
                "Leverage AI for preliminary grading, deliver personalised feedback, and publish results instantly.",
                "Track each student's performance by category: Classwork, Unit Tests, Projects, Homework, and Semester Examinations.",
                "Export comprehensive grade reports to Excel for report cards and administrative distribution.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 group cursor-default rounded-xl p-3 transition-all duration-300 hover:bg-secondary hover:pl-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">{i + 1}</span>
                  <span className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── For Students ── */}
      <section id="students" className="scroll-mt-20 py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary text-center">For Learners</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground text-center">Learning, Simplified</h2>
            <ul className="mt-10 space-y-4 max-w-2xl mx-auto">
              {[
                "Access assignments and materials from all subject teachers through a consolidated dashboard.",
                "Complete interactive worksheets directly in your browser with annotation, drawing, and text tools.",
                "Submit work with a single click; submission status updates automatically.",
                "Review your scores and academic progress across categories through interactive charts.",
                "Maintain a mistake journal for each subject — teachers can review and provide feedback.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 group cursor-default rounded-xl p-3 transition-all duration-300 hover:bg-secondary hover:pl-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">{i + 1}</span>
                  <span className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Subjects ── */}
      <section className="border-y border-border bg-gradient-to-b from-secondary/30 to-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">Supported Subjects</h2>
            <p className="mt-2 text-muted-foreground">Each subject maintains its own syllabus, worksheets, and grading pipeline — teachers manage only the disciplines assigned to them.</p>
          </div>
          <SubjectCarousel />
        </div>
      </section>

      {/* ── Demo Access ── */}
      <section id="demo" className="py-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Demo Access</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Try the Platform</h2>
            <p className="mt-2 text-muted-foreground">Use these credentials to explore the platform. All demo data is isolated from production content.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-3">👩‍🏫 Teachers</h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">JHS (Grades 7–9) — Physics & Mathematics</p>
                  <p className="font-mono text-sm font-medium text-foreground">budi@shb.sch.id</p>
                  <p className="font-mono text-sm text-muted-foreground">demo123</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">SHS (Grades 10–12) — Chemistry & Biology</p>
                  <p className="font-mono text-sm font-medium text-foreground">dewi@shb.sch.id</p>
                  <p className="font-mono text-sm text-muted-foreground">demo123</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-3">🧑‍🎓 Students</h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Grade 8A — Physics & Mathematics</p>
                  <p className="font-mono text-sm text-foreground">ahmad8 / bella8 / citra8 / dimas8 / eka8</p>
                  <p className="font-mono text-xs text-muted-foreground">@shb.sch.id · password: demo123</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Grade 11A — Chemistry & Biology</p>
                  <p className="font-mono text-sm text-foreground">fajar11 / gita11 / nadia11 / intan11 / rizky11</p>
                  <p className="font-mono text-xs text-muted-foreground">@shb.sch.id · password: demo123</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:opacity-90 hover:shadow-md hover:scale-105 active:scale-95">
              Sign In with Demo Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-r from-primary/90 via-primary to-[oklch(0.4_0.12_255)] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to Transform Your Teaching?</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">Join your colleagues — complimentary access for all SHB Modernhill educators.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-card px-8 py-3.5 text-base font-semibold text-primary shadow-lg transition-all duration-300 hover:bg-secondary hover:shadow-xl hover:scale-105 active:scale-95">
              Sign In to {name}
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-gradient-to-b from-background to-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              {logo ? (
                <img src={logo} alt={name} className="h-8 w-8 rounded-lg object-contain ring-2 ring-border" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-semibold text-foreground">{name}</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {name} — SHB Modernhill. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
