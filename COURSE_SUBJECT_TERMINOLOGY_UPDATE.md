# Course/Subject Terminology Update

## Overview
Updated all user-facing terminology to use "Course/Subject" instead of just "Subject" to avoid confusion and provide clarity for users familiar with either term.

## Changes Made

### 1. Faculty Dashboard (`src/pages/FacultyDashboard.tsx`)
- **Line 95**: Filter label changed from "Subject:" to "Course/Subject:"
- **Line 95**: Dropdown option changed from "All Subjects" to "All Courses/Subjects"
- **Line 97**: Metric card changed from "Subjects Evaluated" to "Courses/Subjects Evaluated"
- **Line 105**: Feedback display changed from "Subject: {courseId}" to "Course/Subject: {courseId}"

### 2. Admin Dashboard (`src/pages/AdminDashboard.tsx`)
- **Line 103**: Metric card changed from "Subjects" to "Courses/Subjects"

### 3. Faculty Print Report (`src/components/FacultyPrintReport.tsx`)
- **Line 47**: Feedback display changed from "Subject: {courseId}" to "Course/Subject: {courseId}"

### 4. Excel Export (`src/utils/excel.ts`)
- **Line 284**: Sheet name changed from "Subject Performance" to "Course-Subject Performance"
- **Line 285**: Column header changed from "Subject" to "Course/Subject"

### 5. PDF Export (`src/utils/pdf.ts`)
- **Line 248**: Section header changed from "Subject Performance" to "Course/Subject Performance"
- **Line 256**: Table header changed from "Subject" to "Course/Subject"

### 6. Student Dashboard (`src/pages/StudentDashboard.tsx`)
- **Line 68**: Label changed from "2. Select Subject" to "2. Select Course/Subject"
- **Line 68**: Placeholder changed from "-- Choose a subject --" to "-- Choose a course/subject --"
- **Line 68**: Success message changed from "✓ All subjects evaluated!" to "✓ All courses/subjects evaluated!"

## Rationale

The term "Course/Subject" is used to accommodate different educational terminology preferences:
- In some educational systems, "Course" refers to individual classes
- In other systems (particularly Philippine universities following CHED standards), "Subject" is the preferred term
- Using both terms ensures clarity for all users regardless of their educational background

## Build Status
✅ Build successful - 2265 modules transformed
✅ No compilation errors
✅ All changes applied successfully

## Files Modified
1. `src/pages/FacultyDashboard.tsx`
2. `src/pages/AdminDashboard.tsx`
3. `src/pages/StudentDashboard.tsx`
4. `src/components/FacultyPrintReport.tsx`
5. `src/utils/excel.ts`
6. `src/utils/pdf.ts`

## Testing Recommendations
- Verify all UI labels display "Course/Subject" correctly
- Check Excel export sheet name and headers
- Verify PDF export section headers and table headers
- Test student evaluation flow to ensure new terminology displays properly
- Confirm faculty dashboard filters and metrics use updated terminology
