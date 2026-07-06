const fs = require('fs');
const path = require('path');

const BASE = 'src/app/(dashboard)';

const GUIDANCE = {
  'syllabus/page.tsx': {
    after: 'Syllabus Planner',
    text: 'Plan, organise, and manage weekly syllabi across subjects. Select a grade and week, define topics, set learning objectives, add activity questions and problems, and publish for student access.'
  },
  'lesson-plan/page.tsx': {
    after: 'Lesson Plan Generator',
    text: 'Create lesson plans using the official SHB template. Fill in the form fields, preview in Markdown or PDF, and download in DOCX format for classroom use.'
  },
  'worksheets/page.tsx': {
    after: 'Shared Worksheets',
    text: 'Upload PDF worksheets and publish them for students. Each worksheet can be assigned to a specific grade, week, subject, and assessment category (Classwork, Homework, etc.).'
  },
  'generate/page.tsx': {
    after: 'Generate Packages',
    text: 'Generate weekly teaching packages using AI. Select a grade to automatically produce lesson plans, worksheets, pre-class materials, lab logistics, and answer keys aligned to the Cambridge curriculum.'
  },
  'grading/page.tsx': {
    after: 'Grading Center',
    text: 'Review and grade student submissions. Filter by grade and subject, assign scores and feedback, set assessment categories, and publish or unpublish results to students.'
  },
  'analytics/page.tsx': {
    after: 'Analytics',
    text: 'View student performance summaries, score distributions, and weighted grade calculations. Monitor high achievers and students needing attention across subjects and assessment categories.'
  },
  'syllabus-manager/page.tsx': {
    after: 'Syllabus Manager',
    text: 'Upload, organise, and publish syllabus documents (Markdown, Quarto, PDF, Excel). Manage files by grade and subject, set assessment categories, and publish for student access.'
  },
  'calendar/page.tsx': {
    after: 'Calendar',
    text: 'Manage the academic calendar. Add or edit events such as holidays, exams, tryouts, and off-site activities. Events are reflected in the syllabus planner and student schedules.'
  },
  'memory/page.tsx': {
    after: 'Class Memory',
    text: 'Record observations about class sessions — misconceptions, student performance, lab equipment status, and notes for the following week. Use this to track continuity across lessons.'
  },
  'grades/page.tsx': {
    after: 'Grades',
    text: 'Browse weekly packages by grade. Select a grade to view or edit the lesson plan, worksheet, pre-class materials, lab logistics, broadcast message, and answer keys for each week.'
  },
};

const STUDENT_GUIDANCE = {
  'dashboard/page.tsx': {
    after: 'Dashboard',
    text: 'Your personalised overview. Access weekly packages, published worksheets, syllabus assignments, and quick links to My Week, Mistake Journal, and Pre-Class preparation.'
  },
  'my-week/page.tsx': {
    after: 'My Week',
    text: 'View your weekly learning package including lesson summaries, worksheets, pre-class videos, and assignments. Track your progress and submit your work.'
  },
  'my-work/page.tsx': {
    after: 'My Work',
    text: 'Access all published worksheets and syllabus assignments from your subject teachers. Complete interactive worksheets, submit your work, and track grading status.'
  },
  'pre-class/page.tsx': {
    after: 'Pre-Class',
    text: 'Complete pre-class preparation materials including entry ticket quizzes, instructional videos, and review of published syllabus documents before the lesson.'
  },
  'my-progress/page.tsx': {
    after: 'My Progress',
    text: 'Review your academic performance across assessment categories — Classwork, Unit Tests, Projects, Homework, and Semester Examinations. Track weighted scores and identify areas for improvement.'
  },
  'my-journal/page.tsx': {
    after: 'My Mistake Journal',
    text: 'Log mistakes from each subject to track your learning. Describe the error, identify the root cause, document the correct approach, and receive teacher feedback.'
  },
};

function addGuidance(filePath, titleText, guidanceText) {
  const fullPath = path.join(BASE, filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Find the h1 with the given title
  const patterns = [
    new RegExp(`(<h1[^>]*>\\s*${titleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<\\/h1>)\\s*\\n(\\s*)<p\\s`, 's'),
    new RegExp(`(<h1[^>]*>\\s*${titleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<\\/h1>)\\s*\\n`, 's'),
  ];
  
  let matched = false;
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const h1Tag = match[1];
      const indent = match[2] || '';
      const guidance = `\n${indent}<p className="text-sm text-muted-foreground">${guidanceText}</p>\n`;
      content = content.replace(pattern, h1Tag + guidance);
      matched = true;
      break;
    }
  }
  
  if (matched) {
    fs.writeFileSync(fullPath, content);
    console.log(`  ✓ ${filePath}`);
  } else {
    console.log(`  ✗ ${filePath} — could not find h1 with "${titleText}"`);
  }
}

console.log('=== Adding teacher guidance ===');
for (const [file, info] of Object.entries(GUIDANCE)) {
  addGuidance(file, info.after, info.text);
}

console.log('\n=== Adding student guidance ===');
for (const [file, info] of Object.entries(STUDENT_GUIDANCE)) {
  addGuidance(file, info.after, info.text);
}

console.log('\nDone.');
