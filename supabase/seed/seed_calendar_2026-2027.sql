-- Seed: SHB Academic Calendar 2026-2027 - Semester 1
-- Based on 09_calendar_rules.md and database.ts schema
-- Each row represents one instructional week

INSERT INTO public.academic_calendars
  (id, academic_year, semester, month, week_number, start_date, end_date, effective_days, event_name, event_type, affected_grades, is_holiday, notes)
VALUES

-- July 2026
-- Week 1 (Jul 13-17)
(gen_random_uuid(), '2026-2027', 1, 7, 1, '2026-07-13', '2026-07-17', 3, 'Masa Orientasi', 'normal', ARRAY[7,10,11,12], false, 'Orientation 13-15 Jul; 3 effective days'),
-- Week 2 (Jul 20-24)
(gen_random_uuid(), '2026-2027', 1, 7, 2, '2026-07-20', '2026-07-24', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week'),
-- Week 3 (Jul 27-31)
(gen_random_uuid(), '2026-2027', 1, 7, 3, '2026-07-27', '2026-07-31', 3, 'UKBI', 'exam', ARRAY[10,11,12], false, 'UKBI assessment 27-29 Jul'),

-- August 2026
-- Week 4 (Aug 3-7)
(gen_random_uuid(), '2026-2027', 1, 8, 4, '2026-08-03', '2026-08-07', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week'),
-- Week 5 (Aug 10-14)
(gen_random_uuid(), '2026-2027', 1, 8, 5, '2026-08-10', '2026-08-14', 5, 'TKA TO1 Gr12', 'tryout', ARRAY[12], false, 'TKA Try Out 1 for Grade 12'),
-- Week 6 (Aug 17-21)
(gen_random_uuid(), '2026-2027', 1, 8, 6, '2026-08-17', '2026-08-21', 4, 'Libur HUT RI', 'holiday', ARRAY[7,10,11,12], true, '17 Aug Independence Day; 4 effective days'),
-- Week 7 (Aug 24-28)
(gen_random_uuid(), '2026-2027', 1, 8, 7, '2026-08-24', '2026-08-28', 4, 'Maulid Nabi', 'holiday', ARRAY[7,10,11,12], true, 'Maulid 25 Aug; 4 effective days'),

-- September 2026
-- Week 8 (Aug 31-Sep 4)
(gen_random_uuid(), '2026-2027', 1, 9, 8, '2026-08-31', '2026-09-04', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week'),
-- Week 9 (Sep 7-11)
(gen_random_uuid(), '2026-2027', 1, 9, 9, '2026-09-07', '2026-09-11', 5, 'TKA TO2 Gr12', 'tryout', ARRAY[12], false, 'TKA Try Out 2 for Grade 12'),
-- Week 10 (Sep 14-18)
(gen_random_uuid(), '2026-2027', 1, 9, 10, '2026-09-14', '2026-09-18', 5, 'Mid Semester 1 Tests', 'exam', ARRAY[7,10,11,12], false, 'Mid Sem1 Test 16-24 Sep'),
-- Week 11 (Sep 21-25)
(gen_random_uuid(), '2026-2027', 1, 9, 11, '2026-09-21', '2026-09-25', 4, 'Mid Semester 1 Tests', 'exam', ARRAY[7,10,11,12], false, 'Mid Sem1 Test continues; 16-24'),

-- October 2026
-- Week 12 (Sep 28-Oct 2)
(gen_random_uuid(), '2026-2027', 1, 10, 12, '2026-09-28', '2026-10-02', 5, 'TKA TO3', 'tryout', ARRAY[12], false, 'TKA TO3 1-7 Oct'),
-- Week 13 (Oct 5-9)
(gen_random_uuid(), '2026-2027', 1, 10, 13, '2026-10-05', '2026-10-09', 5, 'Internship; Marking Day', 'offsite', ARRAY[10,11,12], false, 'Internship 5-14; Marking Day 9 Oct'),
-- Week 14 (Oct 12-16)
(gen_random_uuid(), '2026-2027', 1, 10, 14, '2026-10-12', '2026-10-16', 5, 'Internship', 'offsite', ARRAY[10,11,12], false, 'Internship continues'),
-- Week 15 (Oct 19-23)
(gen_random_uuid(), '2026-2027', 1, 10, 15, '2026-10-19', '2026-10-23', 4, 'Edutrip Dieng', 'offsite', ARRAY[10,11], false, 'Edutrip Dieng 20-23 Oct'),
-- Week 16 (Oct 26-30)
(gen_random_uuid(), '2026-2027', 1, 10, 16, '2026-10-26', '2026-10-30', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week'),

-- November 2026
-- Week 17 (Nov 2-6)
(gen_random_uuid(), '2026-2027', 1, 11, 17, '2026-11-02', '2026-11-06', 4, 'Ujian TKA', 'exam', ARRAY[12], false, 'Ujian TKA 2-5 Nov'),
-- Week 18 (Nov 9-13)
(gen_random_uuid(), '2026-2027', 1, 11, 18, '2026-11-09', '2026-11-13', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week'),
-- Week 19 (Nov 16-20)
(gen_random_uuid(), '2026-2027', 1, 11, 19, '2026-11-16', '2026-11-20', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week'),
-- Week 20 (Nov 23-27)
(gen_random_uuid(), '2026-2027', 1, 11, 20, '2026-11-23', '2026-11-27', 5, 'Semester 1 Tests', 'exam', ARRAY[10,11,12], false, 'Sem1 Tests 26-30 Nov'),
-- Week 21 (Nov 30)
(gen_random_uuid(), '2026-2027', 1, 11, 21, '2026-11-30', '2026-12-04', 5, 'Semester 1 Tests', 'exam', ARRAY[7,9], false, 'Sem1 Tests Gr7-9 1-4 Dec'),

-- December 2026
-- Week 21 continued: Dec already handled by week 21 above
-- Week 22 (Dec 7-11)
(gen_random_uuid(), '2026-2027', 1, 12, 22, '2026-12-07', '2026-12-11', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week (post-exam activities)'),
-- Week 23 (Dec 14-18)
(gen_random_uuid(), '2026-2027', 1, 12, 23, '2026-12-14', '2026-12-18', 5, NULL, 'normal', ARRAY[7,10,11,12], false, 'Normal week'),
-- Week 24 (Dec 21-24)
(gen_random_uuid(), '2026-2027', 1, 12, 24, '2026-12-21', '2026-12-24', 0, 'Libur Semester 1', 'holiday', ARRAY[7,10,11,12], true, 'Holiday starts 21 Dec'),
-- Week 25 (Dec 28-31)
(gen_random_uuid(), '2026-2027', 1, 12, 25, '2026-12-28', '2026-12-31', 0, 'Libur Semester 1', 'holiday', ARRAY[7,10,11,12], true, 'Holiday continues');
