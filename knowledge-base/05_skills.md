# Available Skills / Tools (Function Calling)

## Tool 1: query_shb_calendar
Signature: query_shb_calendar(week_start: date, week_end: date) -> json
Description: Searches the SHB Academic Calendar for events in the given date range.
Returns: list of events, affected grades, and conflict severity (none/minor/major).
RAG Source: Supabase table academic_calendars (populated from XLSX upload).
Example Output:
    {
        "events": [
            {
                "name": "TKA Try Out 2 Grade 12",
                "dates": "2026-09-07 to 2026-09-11",
                "affected_grades": [12],
                "severity": "major",
                "action": "replace_regular_lesson_with_TO_review"
            }
        ]
    }

## Tool 2: get_syllabus_sequence
Signature: get_syllabus_sequence(grade: int, week_number: int) -> json
Description: Returns the planned topic for the given grade and week based on Prota.
RAG Source: 08_syllabus.md + Supabase table syllabus_progress.
Example Output:
    {
        "grade": 11,
        "week": 8,
        "topic": "Topic 5: Work, Energy, Power",
        "subtopics": ["5.1 Energy conservation", "5.2 GPE and KE"],
        "prerequisites": ["Topic 2 Kinematics", "Topic 3 Dynamics"],
        "cambridge_ao_focus": ["AO1 (50%)", "AO2 (50%)"]
    }

## Tool 3: get_class_memory
Signature: get_class_memory(grade: int, previous_week: int) -> json
Description: Retrieves last week's misconceptions, struggling students, and notes.
Source: Supabase table class_memory.

## Tool 4: search_phet_simulation
Signature: search_phet_simulation(topic: string, grade_level: string) -> json
Description: Queries PhET database for age-appropriate simulations.
Filters: grade_level (lower_secondary | igcse | as_alevel).
Whitelist: Only returns URLs from phet.colorado.edu.

## Tool 5: search_past_paper
Signature: search_past_paper(syllabus: string, topic: string, paper: string, difficulty: string) -> json
Description: Queries Cambridge Past Paper database (0625 or 9702).
Returns: question text, mark scheme, paper reference, year.
Example: search_past_paper("9702", "Topic 16 Thermodynamics", "Paper 4", "HOTS")

## Tool 6: check_lab_inventory
Signature: check_lab_inventory(equipment_list: string[]) -> json
Description: Queries Supabase lab_inventory table.
Returns: availability status for each item, broken items list.

## Tool 7: save_weekly_package
Signature: save_weekly_package(grade: int, package: json) -> uuid
Description: Saves the generated weekly package to Supabase weekly_packages table.
Sets status to "pending_review".

## Tool 8: send_notification
Signature: send_notification(user_id: uuid, message: string, channel: string) -> void
Description: Sends push notification via PWA, email, or WA.
Channels: pwa_push | email | whatsapp

## Tool 9: derive_equation_geometric
Signature: derive_equation_geometric(equation: string, method: string) -> json
Description: Generates step-by-step derivation using geometry/algebra (NO calculus).
Methods: area_under_graph | algebraic_substitution | vector_resolution.
Hard Rule: NEVER use integration or differentiation.

## Tool 10: generate_cer_prompt
Signature: generate_cer_prompt(phenomenon: string, grade: int) -> json
Description: Formats a scientific phenomenon into CER template.
Returns: claim prompt, evidence prompt, reasoning prompt, model answer.
