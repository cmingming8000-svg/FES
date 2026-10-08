# Data Access Control Implementation Summary

## Overview
This document summarizes the data access control implementation for print reports and exports in the Faculty Evaluation System (FES).

## Access Control Matrix

| Role | Can See Student IDs | Can See Individual Feedback | Can See Faculty Names | Can See Department Aggregates |
|------|---------------------|----------------------------|----------------------|------------------------------|
| **Admin** | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes |
| **Faculty** | ✗ No | ✓ Yes (own only, anonymous) | ✓ Yes (own only) | ✓ Yes (department avg) |
| **Dean** | ✗ No | ✗ No | ✓ Yes (department only) | ✓ Yes (department only) |
| **Student** | ✗ No | ✗ No | ✗ No | ✗ No |

## Implementation Details

### 1. PDF Export (`src/utils/pdf.ts`)

**Function Signature:**
```typescript
export async function exportFacultyPDF(
  facultyId: string, 
  cycleId?: string, 
  includeStudentIds: boolean = false
): Promise<void>
```

**Access Control:**
- When `includeStudentIds = false` (default):
  - Shows faculty metrics and criteria breakdown
  - Shows anonymous student feedback (no student IDs)
  - Used by: Faculty, Dean (if they had access)
  
- When `includeStudentIds = true`:
  - Shows all of the above PLUS
  - Shows "Evaluation Details" section with:
    - Student ID
    - Course
    - Average Rating
    - Submission Date
  - Used by: Admin only

**Callers:**
- `FacultyDashboard.tsx` line 88: `exportFacultyPDF(facultyId, cycleId)` → Anonymous
- `AdminDashboard.tsx` line 103: `exportFacultyPDF(selectedFaculty.id, cycleId, true)` → With student IDs

### 2. Excel Export (`src/utils/excel.ts`)

**Function Signature:**
```typescript
export async function exportFacultyReport(
  facultyId: string, 
  cycleId?: string, 
  includeStudentIds: boolean = false
): Promise<void>
```

**Access Control:**
- When `includeStudentIds = false` (default):
  - Cover sheet: Faculty info, performance summary
  - Criteria Analysis: Criteria and sub-question averages
  - Course Performance: Course-level metrics
  - Student Feedback: Anonymous feedback (course, feedback text, date)
  - Score Distribution: Rating distribution
  - Used by: Faculty, Dean (if they had access)
  
- When `includeStudentIds = true`:
  - Shows all of the above PLUS
  - Adds "Evaluation Details" sheet with:
    - Student ID
    - Student Name
    - Program
    - Course
    - Average Rating
    - Date
    - Feedback
  - Used by: Admin only

**Callers:**
- `FacultyDashboard.tsx` line 87: `exportFacultyReport(facultyId, cycleId)` → Anonymous
- `AdminDashboard.tsx` line 102: `exportFacultyReport(f.id, cycleId, true)` → With student IDs
- `AdminDashboard.tsx` line 103: `exportFacultyReport(selectedFaculty.id, cycleId, true)` → With student IDs

### 3. Dean Report (`src/utils/deanReport.ts`)

**Function Signature:**
```typescript
export async function exportDeanReport(
  department: string, 
  cycleId?: string
): Promise<void>
```

**Access Control:**
- Department Overview: Department name, evaluation period, faculty count, submissions, average
- Faculty Summary: Faculty names, submission counts, averages, status, acknowledgment status
- Criteria Performance: Department-level criteria averages
- Training Needs: Department-level training needs analysis
- **NO student data** - completely anonymous at student level
- Used by: Dean only

**Callers:**
- `DeanDashboard.tsx` line 49: `exportDeanReport(department, cycleId)` → Department aggregates only

### 4. Print Reports

#### Admin Print Report (`src/components/AdminPrintReport.tsx`)
- System Overview: Total faculty, evaluations
- Department Summary: Department-level aggregates
- **Evaluation Details**: Individual evaluation data with student IDs, names, programs
- Footer: "Admin Access Only"
- Used by: Admin only

#### Faculty Print Report (`src/components/FacultyPrintReport.tsx`)
- Faculty Information: Own faculty info
- Performance Summary: Own metrics
- Criteria Performance Breakdown: Own criteria averages
- Student Feedback: Anonymous feedback (course, feedback text, date)
- **NO student IDs** - completely anonymous
- Used by: Faculty only

#### Dean Print Report (`src/components/DeanPrintReport.tsx`)
- Department Overview: Department aggregates
- Faculty Performance Summary: Faculty names and averages (no student data)
- **NO student data** - completely anonymous at student level
- Used by: Dean only

## Security Measures

1. **Parameter-Based Access Control**: Export functions use `includeStudentIds` parameter to control data visibility
2. **Role-Based UI Controls**: Each dashboard only shows export buttons appropriate for that role
3. **Data Filtering**: Store methods filter data based on caller's role
4. **PII Stripping**: Student feedback is PII-stripped for non-admin roles
5. **Explicit Labeling**: Admin reports clearly label sections containing identifiable information

## Verification Checklist

- [x] Admin exports include student IDs when `includeStudentIds = true`
- [x] Faculty exports are anonymous (no student IDs)
- [x] Dean exports show only department aggregates (no student data)
- [x] Admin print report includes detailed evaluation data with student IDs
- [x] Faculty print report is anonymous
- [x] Dean print report shows only department-level data
- [x] All exports respect role-based access boundaries
- [x] Student feedback is anonymous for non-admin roles
- [x] Admin reports are clearly labeled as "Admin Access Only"

## Notes

- Student data is stored with `studentId` field in evaluations
- Admin can see student names via `store.getStudentById()`
- Faculty and Dean cannot access student-identifiable information
- All exports dynamically adjust to current criteria/sub-question structure
- PII detection and stripping is applied to feedback text for non-admin roles
