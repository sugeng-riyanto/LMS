-- Add score categories for weighted grading
ALTER TABLE public.student_work
ADD COLUMN IF NOT EXISTS score_category TEXT CHECK (score_category IN ('classwork', 'unit_test', 'project', 'homework', 'mid_semester', 'final_semester'));

-- Student progress view with weighted calculations
CREATE OR REPLACE VIEW public.student_progress AS
SELECT
    sw.student_id,
    p.full_name,
    p.grade_assigned,
    COUNT(sw.id) FILTER (WHERE sw.score_category = 'classwork') AS classwork_count,
    COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'classwork'), 0) AS classwork_avg,
    COUNT(sw.id) FILTER (WHERE sw.score_category = 'unit_test') AS unit_test_count,
    COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'unit_test'), 0) AS unit_test_avg,
    COUNT(sw.id) FILTER (WHERE sw.score_category = 'project') AS project_count,
    COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'project'), 0) AS project_avg,
    COUNT(sw.id) FILTER (WHERE sw.score_category = 'homework') AS homework_count,
    COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'homework'), 0) AS homework_avg,
    COUNT(sw.id) FILTER (WHERE sw.score_category = 'mid_semester') AS mid_semester_count,
    COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'mid_semester'), 0) AS mid_semester_avg,
    COUNT(sw.id) FILTER (WHERE sw.score_category = 'final_semester') AS final_semester_count,
    COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'final_semester'), 0) AS final_semester_avg,
    -- Weighted total (out of 100)
    ROUND(
        COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'classwork'), 0) * 0.4 +
        COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'unit_test'), 0) * 0.2 +
        COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'project'), 0) * 0.1 +
        COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'homework'), 0) * 0.1 +
        COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'mid_semester'), 0) * 0.1 +
        COALESCE(AVG(sw.score) FILTER (WHERE sw.score_category = 'final_semester'), 0) * 0.1
    , 2) AS weighted_total
FROM public.student_work sw
JOIN public.profiles p ON sw.student_id = p.id
WHERE sw.score IS NOT NULL
GROUP BY sw.student_id, p.full_name, p.grade_assigned;
