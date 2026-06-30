# Memory State Management

## Table: class_memory (Supabase)
Columns:
    - id: UUID (Primary Key)
    - grade: INT (7-12)
    - week_number: INT (1-43)
    - academic_year: TEXT (e.g., "2026-2027")
    - topic_taught: TEXT
    - misconceptions: JSONB (array of strings)
    - average_classwork_score: FLOAT
    - students_struggling: JSONB (array of {student_id, topic, issue})
    - students_advanced: JSONB (array of {student_id, ready_for})
    - lab_equipment_status: JSONB (inventory snapshot)
    - notes_for_next_week: TEXT
    - created_at: TIMESTAMPTZ

## Example Record
    {
        "id": "uuid-123",
        "grade": 12,
        "week_number": 8,
        "academic_year": "2026-2027",
        "topic_taught": "TKA Termodinamika + Cambridge Topic 16",
        "misconceptions": [
            "Students confuse Q (heat) with T (temperature)",
            "Students think work done BY gas is negative in expansion"
        ],
        "average_classwork_score": 72.5,
        "students_struggling": [
            {"student_id": "uuid-A", "topic": "First Law of Thermo", "issue": "sign convention"}
        ],
        "students_advanced": [
            {"student_id": "uuid-B", "ready_for": "Carnot Engine derivation"}
        ],
        "lab_equipment_status": {
            "multimeters": {"total": 15, "broken": 2},
            "stopwatches": {"total": 20, "broken": 0}
        },
        "notes_for_next_week": "Start with sign convention correction. Use P-V diagram geometry for work derivation.",
        "created_at": "2026-09-12T15:00:00Z"
    }

## Table: mistake_journals (Student-owned)
Columns:
    - id: UUID
    - student_id: UUID (FK to users)
    - grade: INT
    - entry_date: DATE
    - topic: TEXT
    - mistake_description: TEXT
    - root_cause: TEXT
    - correct_approach: TEXT
    - law_or_principle: TEXT
    - created_at: TIMESTAMPTZ

## Memory Access Rules
- Super Admin (Guru Fisika): Full CRUD on all tables
- Teacher: Read-only on class_memory for assigned grades
- Lab Assistant: Read-only on lab_equipment_status, can update inventory
- Student: Read/write only their own mistake_journals entries

## Memory Update Trigger
After each class session, Super Admin updates class_memory with:
    1. New misconceptions observed
    2. Average classwork score
    3. Students needing intervention
    4. Lab equipment used/broken
    5. Notes for next week's agent

This memory is then queried by Master Orchestrator every Saturday.
