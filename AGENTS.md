<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
Build **Physics Command Center** — full-stack Next.js 16 + Supabase app for AI-assisted physics lesson planning, syllabus management, grading, shared worksheets, student progress tracking, and grade-level publish at SHB Modernhill (Grades 7–12, Cambridge + TKA curricula)

## Constraints & Preferences
- Next.js 16.2.9 (Turbopack), Tailwind v4 (CDN on public pages), shadcn/ui, Supabase (22+ tables)
- 4 roles: `super_admin`, `teacher`, `lab_assistant`, `student`; `requireRole()` helper for API RBAC
- Proxy (`src/proxy.ts`) enforces role-based page + API access at edge level
- Deploy: **Vercel** (`https://lms-chi-orpin.vercel.app`) via `npx vercel --prod` CLI
- Supabase project: `yvnomvcmqsfbkqqjwzhi` · URL: `https://yvnomvcmqsfbkqqjwzhi.supabase.co`
- All AI generation uses fluent English at IELTS 7.5+; TKA content stays in Indonesian (UKBI/EYD)
- Syllabus planning references Flipped Classroom 40-min structure, SHB calendar, weighted grading rules (classwork 0.4, unit_test 0.2, project 0.1, homework 0.1, mid_semester 0.1, final_semester 0.1)
- `getGradeSequence` is the authoritative 22-week topic progression source
- PDF.js locally served from `/pdfjs/pdf.js` and `/pdfjs/pdf.worker.js` (v3.11.174 UMD)
- Worksheet PDFs uploaded directly to Supabase Storage; rendered via PDF.js on public page
- `student_work.status` CHECK constraint: `submitted` | `graded` | `returned` (value `returned` is "published to student")
- **Flow**: Teacher creates syllabus → published → appears in student `/my-work` with pre-filled name → student submits → goes to `/grading`; Teacher creates worksheet with category → published → appears in student `/my-work` → student annotates/submits → goes to `/grading`

## Progress
### Done
- Full syllabus planner — topic checklist, AI Fill, manual entry, save/load/download (DOCX/PDF/MD/QMD)
- AI Providers CRUD — Settings tab for OpenAI, Groq, Gemini, OpenCode AI keys with test connection
- SHB Lesson Plan Generator — official DOCX template (JHS/SHS with school logo), MD preview, PDF landscape, QMD
- All content converted to IELTS 7.5+ English across orchestrator, 5 sub-agents, worksheets, broadcasts
- Package detail page — single-page document layout with `SectionCard` inline edit/save/cancel; print button
- Grading Center — bulk table per grade, inline score + feedback, AI auto-grade, category chip selector, per-item publish/cancel publish, student score recap
- Student Work CRUD — `/my-work` with canvas drawing, signature, print PDF
- Student dashboards — `/my-week` task cards, `/my-progress` weighted charts + filterable assignments table with CSV export
- School settings — VP/Principal per level, logo upload → appears in sidebar/header + favicon
- Calendar CRUD — add/edit/delete, XLSX template + upload, multi-grade checkboxes
- Lab CRUD — full CRUD, XLSX template + upload, collection-level POST
- Analytics — KPI cards, score distribution, performer summary + Score Recap section with per-student category breakdown + CSV export
- Teacher assignments — `teacher_assignments` table (Sugeng Physics G7-12, Aji Chemistry G7-12)
- Syllabus public page — HTTPS embeds, QR code, `createAdminClient()` bypasses RLS; **submit to teacher button + status display + auto-fill logged-in student name**
- Media attachments — auto-detect type from URL; migration 00017 for `slides` + `link`
- Answer keys agent integrated into orchestrator with `validateLLMResult()`
- Comprehensive RBAC audit — 53 API routes checked; 4 RLS migrations (00018-00021)
- New `/api/users/invite` route for super_admin
- Worksheet question banks — all 10 topics with full L1/L2/L3 questions
- Answer key entries — L1/L2/L3 for all 10 topics
- `getGradeSequence` completed — all 6 grades (7–12) with 22-week Cambridge-aligned topic sequences
- `TOPIC_MAP` aligned — broad categories in orchestrator match grade sequences for all 6 grades
- Teacher approve/publish — `isTeacher` added to button conditional on package detail page
- Syllabus public RLS fix — switched to `createAdminClient()` to bypass RLS for anonymous access
- Cache-Control fix — `no-store, max-age=0` headers on public route
- Learning objectives enriched — comprehensive Cambridge-aligned objectives for all 6 grades in `objectives-data.ts`
- School logo in sidebar/header — `useSchoolSettings` hook fetches `logo_url`, renders in Sidebar + Header
- Dynamic favicon — `/api/favicon` serves uploaded school logo; `/favicon.ico` redirects; layout metadata updated
- Favicon on public pages — `<link rel="icon" href="/api/favicon">` added to syllabus + worksheet public HTML
- Compulsory student name — print button validates dropdown selection before allowing print/PDF on both public pages
- **Shared Worksheets feature** — full CRUD for teachers (`/worksheets`), public page (`/worksheet/public/[id]`):
  - Teacher form: grade+week dropdown (1–22), title/topic auto-suggest from `getGradeSequence`, objectives checkbox list (Cambridge), upload PDF directly to Supabase Storage, YouTube theory video, reference PDF, additional embed links, QR code, share link, edit/delete
  - Public page: PDF.js renders PDF → canvas background; annotation overlay (pen/line/dash/eraser/compass/text with size+color); vertical toolbar with 3D emoji icons + labels; floating ruler/protractor with drag/rotate/resize/close handles; textareas per page (paste disabled); student name dropdown from DB; print with validation
  - 5 migrations: 00022 (`shared_worksheets`), 00023 (objectives+references), 00024 (storage bucket), 00025 (page_images), 00026 (published flag)
- **Vertical toolbar** — 52px wide with 3D emoji icons + tool name labels; pen size, font size, font family selectors
- **Ctrl+Z / Ctrl+Y undo/redo** — per-page undo/redo stacks (max 30 steps)
- **Ruler** — 2400px max (50cm), 75px height, dual-sided scale, resizable (600-2400px)
- **Protractor** — 500px diameter, 1° increments, dual scale, center crosshair
- **Text tool** — contentEditable div; Enter saves to canvas via `ctx.fillText()`; Escape cancels; blur saves; undoable
- **Color picker** — native `<input type="color">` (blue default, full palette)
- **Auto-save every 1s** — annotations + answer text saved to `localStorage` keyed by worksheet ID; restored on load
- **Event delegation** — single delegated click/change handler on `#pdf-container` so dynamically added pages have working tools
- **Print reliability** — `beforeprint` converts annotation canvases to static `<img>`; `afterprint` restores canvases
- **Publish worksheets & syllabi to dashboard** — migration 00026 (`published BOOLEAN`) on `shared_worksheets` + `syllabus_documents`
- **Published-items API** — `GET /api/published-items?grade=N` returns published worksheets + syllabi by grade
- **Student dashboard** — shows published worksheets + syllabi with submission status badges, links to `/my-work` and `/pre-class`
- **Grading/publish system** (full workflow):
  - Migration 00027: `published_at` on `student_work` + `student_notifications` table with RLS (applied)
  - Migration 00028: `syllabus_id` + `worksheet_id` on `student_work` (applied)
  - Progress API: filters by `status = 'returned'` (score gated)
  - Submit API: `POST /api/student-work/submit` — accepts student name+grade (resolves without login) + worksheet/syllabus ID + entries array; creates/upserts `student_work`
  - Notifications API: `GET /api/notifications`, `POST /api/notifications`, `PUT /api/notifications/[id]`
  - Publish API: `POST /api/teacher/grading/publish` — validates all have `score_category` set, publishes with score in notification
  - Grading UI: category chip selector, per-item publish/cancel publish buttons, student score recap in card header, always-visible bulk publish bar
  - Worksheet public page: submit button captures all canvases + textareas per page, shows submitted/graded/returned status with scores
  - Syllabus public page: same submit flow per item + signature capture
  - NotificationBell component in header (students) — unread badge + dropdown
  - Dashboard: submission status badges (`submitted`/`graded`/`returned`) per published item
- **Analytics scores** — `/api/analytics/scores?grade=N` endpoint + UI section with per-student category breakdown, weighted totals, CSV export
- **My-progress table** — filterable assignments table (by category, search by title) with CSV export
- **RBAC audit + fixes**:
  - `proxy.ts` enhanced with `API_ROLE_ROUTES` for 30+ API prefixes + `PUBLIC_API_ROUTES` allowlist
  - Added `/worksheets`, `/calendar` (students), `/help` to page routes in proxy
  - Fixed `/lab` route to remove teacher access (matched sidebar)
  - 4 frontend pages missing RBAC: `/syllabus`, `/generate`, `/lesson-plan`, `/grades/[grade]/[week]/edit` — all now have `useRBAC()` + `canManagePackages` early return
  - MobileNav updated with student items: Calendar, My Week, My Work, My Progress, My Journal, Pre-Class
- **My-work page redesigned** as central assignment hub with 3 tabs: Weekly Work, Syllabus Assignments, Worksheet Assignments — fetches published items + submission statuses from `/api/published-items`
- **Syllabus public route** auto-fills logged-in student name (checks auth cookies server-side, pre-selects `<option>` in dropdown); auto-triggers `checkSubmission()` on page load
- **Worksheet public route** same auto-fill + auto-trigger `checkSubmission()` on page load (session 2026-07-03)
- Deployed to Vercel

### In Progress
- *(none)*

### Blocked
- `src/types/database.ts` incomplete — covers only 10 of 22+ tables; regenerating requires `supabase login` with valid access token
- Knowledge base — `knowledge_base` table has text chunks but null embeddings (needs real API key)
- RAG semantic search — requires working embeddings

## Key Decisions
- Migrated from GitHub Pages → **Vercel** because static export cannot serve API routes, middleware, or server actions
- Package detail page redesigned from 6-tab → **single-page document layout**
- `getGradeSequence` chosen as the authoritative topic progression source; `TOPIC_MAP` broad categories aligned to it
- Public syllabus/worksheet routes use `createAdminClient()` (service role) to bypass RLS for anonymous viewing
- School logo stored as base64 data URL in `school_settings.logo_url`; served dynamically via `/api/favicon`
- Student names fetched live from `profiles` table filtered by `grade_assigned` for dropdowns on public pages
- **PDF.js served locally** from Vercel (`/pdfjs/pdf.js` UMD v3.11.174) — settled on regular `<script>` tag after CDN/ESM/import failures
- **Worksheet PDF upload direct** to Supabase Storage (no client-side PDF→image conversion) — PDF.js renders from Supabase URL
- **Ruler/protractor as HTML overlays** with `pointer-events:none` body + `pointer-events:auto` handles; CSS class toggled by cursor tool vs drawing tools
- **Vertical toolbar** on left of each canvas (not horizontal bottom) to save vertical space for PDF content
- **Text tool** uses contentEditable div instead of textarea for simpler event handling
- **Toolbar width increased** from 34px → 52px to accommodate tool name labels below icons
- **Color picker** uses native `<input type="color">` instead of `<select>` with dot symbols for better UX
- **Publish gate** uses existing `student_work.status = 'returned'` as "published to student" — no new status column needed
- **No WA/email/push notifications** — only in-app notification badge + list in student dashboard
- **Category selector** uses clickable chip badges instead of dropdown for better visibility
- **RBAC chain**: proxy.ts (edge-level) → layout.tsx (client redirect) → API `requireRole()` → frontend `useRBAC()` — 3 layers of defense
- **No middleware.ts** — Next.js 16 uses `proxy.ts` instead

## Next Steps
1. Add `score_category` field to worksheet publishing form (currently only set during grading)
2. Update grading page to show source type (syllabus/worksheet) properly in the table
3. Authenticate Supabase CLI and regenerate `src/types/database.ts`
4. Add real API key for a provider (OpenAI/Groq) to enable AI generation + knowledge base embeddings
5. Run `POST /api/seed/knowledge` to chunk + embed MD files
6. Configure custom domain for Vercel

## Critical Context
- Supabase project: `yvnomvcmqsfbkqqjwzhi` · URL: `https://yvnomvcmqsfbkqqjwzhi.supabase.co`
- Production URL: `https://lms-chi-orpin.vercel.app`
- Git remote: `https://github.com/sugeng-riyanto/LMS.git`
- DB connection: `postgresql://postgres:7A%2BJ.%26%3F%23QLf%26Zdf@db.yvnomvcmqsfbkqqjwzhi.supabase.co:5432/postgres`
- Teacher logins: `sugeng@shb.sch.id` / `teacher123` (Physics G7-12), `aji@shb.sch.id` / `teacher123` (Chemistry G7-12)
- Student logins: `student7@shb.sch.id` — `student12@shb.sch.id` / `student123`
- Admin: `admin@shb.sch.id` / `admin123`
- `getCurrentWeek()` starts from 2026-07-13
- `getGradeSequence()` has all 6 grades (7–12) with 22-week sequences aligned to Cambridge curriculum
- `TOPIC_MAP` in orchestrator uses broad categories: Kinematics, Forces, Energy, Waves, Light, Sound, Electricity, Magnetism, Density, Pressure, Thermal
- Build passes with 74 routes, zero TS errors
- Turbopack cache corruption fix: delete `.next` and restart `npm run dev`
- **Two public canvas pages must stay unchanged**: `https://lms-chi-orpin.vercel.app/worksheet/public/{id}` and `https://lms-chi-orpin.vercel.app/syllabus/public/{id}` — these are print-only, disconnected from grading system (use public route submit API)
- Main worksheet route file: `src/app/worksheet/public/[id]/route.ts` (~1316 lines) — contains annotation logic, floating tools, text editor, PDF.js rendering, toolbar HTML, undo/redo, auto-save, beforeprint/afterprint, submit button
- Teacher form: `src/app/(dashboard)/worksheets/page.tsx` (~499 lines) — upload, CRUD, objectives, media links, publish button
- Auto-save key: `ws_anno_{WORKSHEET_ID}` in localStorage; restores canvases + answer textareas on load
- `student_work.status` CHECK constraint: `submitted`, `graded`, `returned` — value `returned` is "published to student"
- `shared_worksheets.published` and `syllabus_documents.published` added by migration 00026 (applied)
- `student_work` now has `published_at`, `syllabus_id`, `worksheet_id` columns (migrations 00027-00028)
- `student_notifications` table created (migration 00027)
- Category required before publish: publish API validates `score_category` is set, returns error with count of missing
- Submit resolution: public pages resolve student by `student_name` + `grade` lookup (no login required)
- `proxy.ts` is the Next.js 16 middleware replacement — placed at `src/proxy.ts`, not `src/middleware.ts`
- Syllabus + worksheet public pages both auto-fill logged-in student name via `createServerClient` auth cookie check + auto-trigger `checkSubmission()` on DOMContentLoaded

## Relevant Files
- `src/lib/utils/week-calculator.ts` — `getGradeSequence()` with 22-week topic sequence for all 6 grades
- `src/lib/syllabus/objectives-data.ts` — enriched Cambridge-aligned learning objectives for all 6 grades
- `src/hooks/use-school-settings.ts` — hook to fetch school settings including `logo_url`
- `src/components/layout/Sidebar.tsx` — school logo + nav items per role
- `src/components/layout/Header.tsx` — school logo in mobile header + NotificationBell for students
- `src/components/layout/MobileNav.tsx` — mobile bottom nav with student items now added
- `src/components/notifications/NotificationBell.tsx` — unread badge + dropdown notification list with mark-read
- `src/proxy.ts` — Next.js 16 edge middleware: role-based page + API route protection with `ROLE_ROUTES` + `API_ROLE_ROUTES`
- `src/app/(dashboard)/worksheets/page.tsx` — teacher CRUD for shared worksheets with upload, objectives, YouTube, reference PDF, QR + share link + publish button; PDF page count auto-detect
- `src/app/(dashboard)/grading/page.tsx` — grading UI with By-Student/By-Question tabs, category chip selector, bulk publish/unpublish bar, per-item publish, student score recap
- `src/app/(dashboard)/analytics/page.tsx` — KPI cards + Score Recap section with per-student category breakdown table + CSV export
- `src/app/(dashboard)/my-progress/page.tsx` — weighted charts + filterable assignments table with category filter, title search, CSV export
- `src/app/(dashboard)/dashboard/page.tsx` — student view shows published worksheets + syllabi with submission status badges, links to `/my-work` and `/pre-class`
- `src/app/(dashboard)/my-work/page.tsx` — **redesigned** as 3-tab assignment hub (Weekly Work / Syllabus / Worksheets) with published item fetch + submission status badges
- `src/app/(dashboard)/pre-class/page.tsx` — entry ticket/prep work with quiz + published syllabi section
- `src/app/worksheet/public/[id]/route.ts` — **main file (~1316 lines)**: PDF.js rendering, annotation tools, floating ruler/protractor, text editor, undo/redo, auto-save, submit button + status display; **auto-fills logged-in student name + auto-triggers checkSubmission()**
- `src/app/syllabus/public/[id]/route.ts` — syllabus document viewer + per-item textareas/canvases, signature, submit button + status display; **auto-fills logged-in student name + auto-triggers checkSubmission()**
- `src/app/api/student-work/submit/route.ts` — bulk submit endpoint for worksheet/syllabus (resolves student by name+grade)
- `src/app/api/student-work/route.ts` — GET/POST CRUD for student work; GET supports unauthenticated lookup by student_name+grade
- `src/app/api/teacher/grading/route.ts` — GET submissions by grade+status (skips status filter when `status=all`)
- `src/app/api/teacher/grading/[id]/route.ts` — PUT (grade manual), POST (auto-grade via LLM)
- `src/app/api/teacher/grading/publish/route.ts` — bulk publish/unpublish with score_category validation + notification creation
- `src/app/api/notifications/route.ts` + `[id]/route.ts` — list/create/mark-read student notifications
- `src/app/api/analytics/scores/route.ts` — score recapitulation per grade with per-student category breakdown + weighted totals
- `src/app/api/published-items/route.ts` — returns published worksheets + syllabi by grade for student dashboard
- `src/app/api/student/progress/route.ts` — weighted score calculation by category; filters by `status = 'returned'`
- `src/app/api/favicon/route.ts` — dynamic favicon serving school logo from DB
- `src/lib/supabase/require-role.ts` — `requireRole(allowedRoles[])` returns 401/403 for API routes
- `src/hooks/use-rbac.ts` — client-side RBAC with `useRBAC()` hook (isTeacher, isStudent, canManagePackages, etc.)
- `src/app/(dashboard)/syllabus/page.tsx` — syllabus planner (1408 lines), now gated with `useRBAC()`
- `src/app/(dashboard)/generate/page.tsx` — AI generation trigger, now gated with `useRBAC()`
- `src/app/(dashboard)/lesson-plan/page.tsx` — lesson plan generator, now gated with `useRBAC()`
- `src/app/(dashboard)/grades/[grade]/[week]/edit/page.tsx` — package editor, now gated with `useRBAC()`
- `supabase/migrations/00000000000022_shared_worksheets.sql` — base table + RLS
- `supabase/migrations/00000000000026_publish_flag.sql` — `published` column on `shared_worksheets` + `syllabus_documents`
- `supabase/migrations/00000000000027_publish_grading.sql` — `published_at` on `student_work` + `student_notifications` table with RLS
- `supabase/migrations/00000000000028_student_work_refs.sql` — `syllabus_id` + `worksheet_id` on `student_work`
- `knowledge-base/03_context.md` — assessment weights (classwork 40%, unit_test 20%, project 10%, homework 10%, mid_semester 10%, final_semester 10%)
- `knowledge-base/06_rbac.md` — roles, RLS policies, `requireRole()` helper pattern
