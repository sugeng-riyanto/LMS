# Sub-Agents Roster

## Agent 1: LessonPlanAgent (RPP Generator)
Role: Generates a 40-minute Flipped Classroom lesson plan.
Temperature: 0.2
Inputs:
    - topic (from 08_syllabus.md)
    - grade (7-12)
    - calendar_status (normal | exam | holiday | tryout)
    - previous_misconceptions (from 04_memory.md)
Output Schema:
    {
        "title": "string",
        "grade": "number",
        "duration_minutes": 40,
        "phases": [
            {
                "phase": "Entry Ticket & Hook",
                "minutes": 5,
                "activity": "string",
                "hook_question": "string",
                "mythbuster_or_analogy": "string"
            },
            {
                "phase": "Productive Struggle (Classwork 40%)",
                "minutes": 20,
                "activity": "string",
                "group_rule": "Ask 3 Before Me",
                "differentiation": {
                    "support": "string",
                    "challenge": "string"
                }
            },
            {
                "phase": "CER Challenge",
                "minutes": 10,
                "phenomenon": "string",
                "cer_template": {
                    "claim": "prompt",
                    "evidence": "prompt",
                    "reasoning": "prompt"
                }
            },
            {
                "phase": "Wrap-up & Mistake Journal",
                "minutes": 5,
                "reflection_prompt": "string",
                "peer_grading_instruction": "string"
            }
        ]
    }

## Agent 2: WorksheetAgent (LKPD Crafter)
Role: Creates a 3-level in-class worksheet aligned with Classwork 40%.
Temperature: 0.15
Inputs:
    - topic, grade, cognitive_level (Bloom's taxonomy target)
    - exam_type (IGCSE / AS / A2 / TKA / none)
Output Schema:
    {
        "title": "string",
        "levels": [
            {
                "level": 1,
                "name": "Sanity Check",
                "minutes": 10,
                "questions": [
                    {
                        "id": "L1-Q1",
                        "type": "short_answer",
                        "bloom": "remember",
                        "question": "string",
                        "mark_scheme": "string",
                        "peer_grade": true
                    }
                ]
            },
            {
                "level": 2,
                "name": "Productive Struggle / Mistake Hunter",
                "minutes": 20,
                "questions": [
                    {
                        "id": "L2-Q1",
                        "type": "problem_solving",
                        "bloom": "analyze",
                        "question": "string",
                        "intentional_error": "string",
                        "solution_steps": ["string"],
                        "derivation_method": "geometry | algebra | graph",
                        "exam_source": "IGCSE_Paper4_2024_Q3"
                    }
                ]
            },
            {
                "level": 3,
                "name": "CER Challenge",
                "minutes": 10,
                "questions": [
                    {
                        "id": "L3-Q1",
                        "type": "essay_cer",
                        "bloom": "evaluate",
                        "phenomenon": "string",
                        "model_answer": {
                            "claim": "string",
                            "evidence": "string",
                            "reasoning": "string"
                        }
                    }
                ]
            }
        ]
    }

## Agent 3: FlippedCuratorAgent
Role: Curates pre-class materials (Homework 10%) from approved sources.
Temperature: 0.1
Approved Sources (Whitelist):
    - PhET Interactive Simulations (phet.colorado.edu)
    - FuseSchool (youtube.com/@FuseSchool)
    - Physics Online (youtube.com/@PhysicsOnline)
    - CrashCourse Kids (youtube.com/@crashcoursekids)
    - Khan Academy (khanacademy.org)
    - ExamQA (examqa.com)
Output Schema:
    {
        "video_resource": {
            "title": "string",
            "url": "string",
            "duration_minutes": "number",
            "source": "string"
        },
        "interactive_simulation": {
            "title": "string",
            "url": "string",
            "instructions": "string"
        },
        "guided_notes": {
            "title": "string",
            "key_concepts": ["string"],
            "fill_in_blanks": [{"prompt": "string", "answer": "string"}]
        },
        "entry_ticket_quiz": [
            {
                "question": "string",
                "options": ["A", "B", "C", "D"],
                "correct": "string",
                "explanation": "string"
            }
        ]
    }

## Agent 4: LogisticsAgent
Role: Generates lab equipment checklist and checks availability.
Temperature: 0.05
Inputs:
    - lesson_plan activities from LessonPlanAgent
    - memory.md - broken/missing equipment list
Output Schema:
    {
        "lab_required": true,
        "equipment_list": [
            {"item": "string", "quantity": "number", "status": "available | broken | need_order"}
        ],
        "setup_instructions": "string",
        "safety_notes": ["string"],
        "lab_technician_message": "string"
    }

## Agent 5: BroadcastAgent
Role: Drafts engaging WA/LMS blast message for students.
Temperature: 0.4 (slightly creative for engagement)
Output Schema:
    {
        "wa_message": "string (Indonesian, engaging, with emoji hooks)",
        "lms_post": {
            "title": "string",
            "body": "string (markdown)",
            "attachments": ["url"],
            "deadline": "ISO datetime"
        },
        "parent_message": "string (formal Indonesian, informational)"
    }
