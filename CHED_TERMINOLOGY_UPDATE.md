# CHED Terminology Compliance Update

## Overview

Updated all user-facing terminology to comply with the Commission on Higher Education (CHED) and Philippine university standards (e.g., University of the Philippines) as specified.

## Terminology Standards

According to CHED and Philippine universities:

- **Program** = The overall degree you are pursuing (e.g., BS Computer Science, BS Mathematics, BS Physics)
- **Subject** = Individual classes/courses you take within a program (e.g., CS101, MATH201, PHYS101)

**Note:** The term "Course" in American English refers to individual subjects, but in the Philippine educational context, "Course" can refer to the entire degree program. To avoid confusion and align with local standards, we use:
- **Program** for degree programs
- **Subject** for individual classes

## Changes Made

### 1. Faculty Dashboard (`src/pages/FacultyDashboard.tsx`)

**Updated Labels:**
- ✅ "Course:" → "Subject:" (filter dropdown)
- ✅ "All Courses" → "All Subjects" (dropdown option)
- ✅ "Courses Evaluated" → "Subjects Evaluated" (metrics card)
- ✅ "Course: {courseId}" → "Subject: {courseId}" (feedback display)

### 2. Admin Dashboard (`src/pages/AdminDashboard.tsx`)

**Updated Labels:**
- ✅ "Courses" → "Subjects" (metrics card in faculty detail view)

### 3. Faculty Print Report (`src/components/FacultyPrintReport.tsx`)

**Updated Labels:**
- ✅ "Course: {courseId}" → "Subject: {courseId}" (feedback section)

### 4. Excel Export (`src/utils/excel.ts`)

**Updated Sheet and Headers:**
- ✅ Sheet name: "Course Performance" → "Subject Performance"
- ✅ Column header: "Course" → "Subject"

### 5. PDF Export (`src/utils/pdf.ts`)

**Updated Section and Headers:**
- ✅ Section title: "Course Performance" → "Subject Performance"
- ✅ Table header: "Course" → "Subject"

### 6. Student Dashboard (`src/pages/StudentDashboard.tsx`)

**Already Compliant:**
- ✅ "1. Select Program" (correct)
- ✅ "2. Select Subject" (correct)
- ✅ "✓ All subjects evaluated!" (correct)

## Internal Variable Names

**Note:** Internal variable names (e.g., `courseId`, `courseFilter`, `facultyCourses`) were intentionally kept unchanged to avoid extensive refactoring. These are internal implementation details that do not affect user-facing terminology.

The key distinction is:
- **User-facing text** = Uses "Subject" and "Program" correctly
- **Internal code** = Uses `courseId` as a variable name (acceptable)

## Verification

### Build Status
```
✓ 2265 modules transformed
✓ built in 16.37s
No errors
```

### Terminology Matrix

| Context | Before | After | Status |
|---------|--------|-------|--------|
| Faculty Dashboard filter | "Course:" | "Subject:" | ✅ Updated |
| Faculty Dashboard dropdown | "All Courses" | "All Subjects" | ✅ Updated |
| Faculty Dashboard metrics | "Courses Evaluated" | "Subjects Evaluated" | ✅ Updated |
| Faculty Dashboard feedback | "Course: CS101" | "Subject: CS101" | ✅ Updated |
| Admin Dashboard metrics | "Courses" | "Subjects" | ✅ Updated |
| Print Report feedback | "Course: CS101" | "Subject: CS101" | ✅ Updated |
| Excel sheet name | "Course Performance" | "Subject Performance" | ✅ Updated |
| Excel column header | "Course" | "Subject" | ✅ Updated |
| PDF section title | "Course Performance" | "Subject Performance" | ✅ Updated |
| PDF table header | "Course" | "Subject" | ✅ Updated |
| Student Dashboard | "Select Subject" | "Select Subject" | ✅ Already correct |

## Examples

### Correct Usage

**Program (Degree):**
- BS Computer Science
- BS Mathematics
- BS Physics

**Subject (Individual Class):**
- CS101 - Introduction to Programming
- MATH201 - Calculus II
- PHYS101 - General Physics I

### User-Facing Text Examples

**Faculty Dashboard:**
```
Subject: [dropdown]
All Subjects
Subjects Evaluated: 3
Subject: CS101 • March 15, 2026
```

**Admin Dashboard:**
```
Subjects: 3
```

**Excel Export:**
```
Sheet: Subject Performance
Headers: Subject | Submissions | Average Score | Rating
Data: CS101 | 14 | 4.85 | Excellent
```

**PDF Export:**
```
Section: Subject Performance
Table: Subject | Submissions | Average
Data: CS101 | 14 | 4.85
```

## Compliance Statement

✅ **All user-facing terminology now complies with CHED and Philippine university standards.**

The system correctly distinguishes between:
- **Program** = Degree program (BS Computer Science, etc.)
- **Subject** = Individual class (CS101, MATH201, etc.)

This aligns with the terminology used by the Commission on Higher Education (CHED) and universities in the Philippines, including the University of the Philippines.

## References

- Commission on Higher Education (CHED) - Philippines
- University of the Philippines (UP) terminology standards
- Philippine higher education nomenclature conventions

---

**Status:** ✅ COMPLETE - All terminology updated and verified
**Build Status:** ✅ SUCCESSFUL
**Compliance:** ✅ CHED/Philippine University Standards
