# SHB Academic Calendar 2026-2027 - Event Triggers & Rules

## Semester 1 Summary (113 Effective Days)
- July 2026: 15 HE (Orientation 13-15 Jul, UKBI 27-29 Jul)
- August 2026: 19 HE (TKA TO1 Gr12 10-14, Libur 17 Agu, Maulid 25 Agu)
- September 2026: 22 HE (TKA TO2 Gr12 7-11, Mid Sem1 Test 16-24 Sep)
- October 2026: 21 HE (TKA TO3 1-7 Oct, Marking Day 9 Oct, Internship 5-14, Edutrip Dieng 20-23)
- November 2026: 21 HE (Ujian TKA 2-5 Nov, Sem1 Tests 26-30 Nov)
- December 2026: 15 HE (Sem1 Tests Gr7-9 1-4 Dec, Libur mulai 21 Dec)

## Semester 2 Summary (107 Effective Days)
- January 2027: 18 HE (Masuk Sem2 6 Jan, IGCSE Mock1 Gr10 11-15, Practical Exam Gr12 26-29)
- February 2027: 17 HE (Practical Exam Gr12 1-4 Feb, Libur Imlek 5-6 Feb, Mid Sem2 12-22, IGCSE Mock2 23-25)
- March 2027: 7 HE REAL (Libur Idul Fitri 2-20 Mar, Libur Kamis-Jumat Agung 25-26 Mar, IGCSE Mock3 29-31)
- April 2027: 22 HE (Written USP Gr12 5-13 Apr, IGCSE/AS/A Level Test throughout April)
- May 2027: 18 HE (Practical USP Gr9 10-14, Libur Idul Adha 17, Waisak 20, Sem2 Tests Gr10-11 21-31)
- June 2027: 20 HE (Buddy Program, Commencement Gr12 8 Jun, Rapor 11 Jun, Holiday 14-30)

## Event Trigger Rules (If-Then Logic)

### Rule 1: TKA Try Out (Grade 12 ONLY)
Trigger: TKA Try Out 1/2/3
Action:
    - calendar_status = "tryout"
    - worksheet_type = "Bedah_Soal_TO"
    - homework = "Skip" (no pre-class, students exhausted)
    - classwork = "Discussion of TO mistakes using CER"
    - NO new material introduction

### Rule 2: IGCSE/AS/A Level Mock Test (Grade 10, 11)
Trigger: IGCSE Mock Test 1/2/3
Action:
    - calendar_status = "mock_test"
    - worksheet_type = "Past_Paper_Drill"
    - classwork = "Timed past paper + peer marking"
    - homework = "Self-analysis using Mistake Journal"

### Rule 3: Mid Semester / Final Semester Test
Trigger: Mid Sem 1/2 or Sem 1/2 Tests
Action:
    - calendar_status = "exam_week"
    - worksheet_type = "Simulasi_Ujian"
    - classwork = "Full exam simulation under timed conditions"
    - NO new material 1 week before exam

### Rule 4: Edutrip / Internship / Marking Day
Trigger: Edutrip Dieng, Marking Day, Internship
Action:
    - calendar_status = "offsite" or "self_study"
    - worksheet_type = "Project_Based" or "Skip"
    - If Marking Day: homework = "Self-study module with guided questions"
    - If Edutrip: project = "Physics phenomena observed during trip" (e.g., geothermal = thermo)

### Rule 5: Practical Exam (Grade 12)
Trigger: Practical Exam Grade 12 (Jan-Feb)
Action:
    - calendar_status = "practical_exam"
    - worksheet_type = "Paper3_Simulation"
    - classwork = "Lab-based experiment with data analysis"
    - Focus: manipulation, measurement, graphing, error bars

### Rule 6: Written USP (Grade 12)
Trigger: Written USP Grade 12 (April 5-13)
Action:
    - calendar_status = "USP_exam"
    - worksheet_type = "Skip" (students in exam)
    - NO regular class for Grade 12 during this period

### Rule 7: CRITICAL BLACKOUT - March 2027
Trigger: March 2-20, 2027 (Libur Idul Fitri)
Action:
    - calendar_status = "blackout"
    - effective_days = 7 (NOT 12 as originally planned)
    - NO NEW MATERIAL for ALL grades
    - worksheet_type = "Independent_Project" or "Past_Paper_Self_Study"
    - project = "Video Fisika di Rumah" or "Makalah Fisika Modern"
    - homework = "Long-term assignment submitted after holiday"

### Rule 8: Professional Development Days
Trigger: PD 1-10 throughout the year
Action:
    - calendar_status = "pd_day"
    - If students still in school: normal class
    - If students off: skip week's class

## Priority Hierarchy (When Multiple Events Overlap)
1. BLACKOUT (Libur Panjang) - highest priority, overrides all
2. EXAM (USP, TKA Ujian, Sem Tests) - second priority
3. MOCK TEST / TRY OUT - third priority
4. OFFSITE (Edutrip, Internship) - fourth priority
5. NORMAL - default

## Agent Decision Algorithm
    IF week IN blackout_dates:
        return BLACKOUT_PACKAGE
    ELIF week IN exam_dates AND grade IN affected_grades:
        return EXAM_PACKAGE
    ELIF week IN mock_test_dates AND grade IN affected_grades:
        return MOCK_TEST_PACKAGE
    ELIF week IN offsite_dates:
        return OFFSITE_PACKAGE
    ELSE:
        return NORMAL_FLIPPED_PACKAGE
