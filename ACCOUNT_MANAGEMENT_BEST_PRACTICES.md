# Account Management Best Practices for Faculty Evaluation Systems

## Executive Summary

This report outlines industry best practices for account creation and forgotten account handling in faculty evaluation systems, based on research from universities and higher education institutions.

---

## Part 1: Account Creation Best Practices

### 1.1 How Universities Typically Handle Account Creation

#### **Industry Standard Approaches:**

1. **SIS Integration (Most Common)** ⭐⭐⭐⭐⭐
   - Automatic synchronization with Student Information System
   - Accounts created when students enroll in courses
   - Faculty accounts created when assigned to teach
   - Zero manual work, always up-to-date

2. **SSO/LDAP Integration** ⭐⭐⭐⭐⭐
   - Single Sign-On with institutional credentials
   - Users log in with university email/password
   - No separate passwords to remember
   - Automatic provisioning/deprovisioning

3. **Bulk CSV Import** ⭐⭐⭐⭐
   - Admin uploads CSV file with user data
   - System creates all accounts at once
   - Good for initial setup or migration
   - Can update existing accounts

4. **Self-Service Registration** ⭐⭐⭐
   - Users register with university email
   - System verifies email domain
   - Admin approval workflow
   - Good for small institutions

5. **Manual Admin Creation** ⭐⭐
   - Admin creates accounts one by one
   - Time-consuming but controlled
   - Only practical for testing/small deployments

### 1.2 Recommended Approach for Your System

#### **Phase 1: Quick Win (Implement Now)**
**Bulk CSV Import Feature**

**Why:**
- ✅ Immediate improvement (1-2 days to implement)
- ✅ Works with current architecture
- ✅ Can import from existing SIS
- ✅ Saves hours of manual work
- ✅ No IT coordination required

**Features to Add:**
1. CSV upload interface with drag-and-drop
2. Downloadable template with instructions
3. Data validation and error reporting
4. Preview before import
5. Option to update existing accounts
6. Import history and audit log

**CSV Format Example:**
```csv
user_id,first_name,last_name,email,role,department,program
C24-001,Alice,Johnson,alice.j@university.edu,student,BSCS
F001,Sarah,Chen,sarah.chen@university.edu,faculty,Computer Science
M001,Patricia,Moore,patricia.moore@university.edu,dean,Computer Science
```

#### **Phase 2: Better Integration (Future)**
**SIS/LDAP Integration**

**Why:**
- ✅ Industry standard
- ✅ Automatic synchronization
- ✅ No manual work
- ✅ Always up-to-date

**Requirements:**
- Access to university's SIS or LDAP
- IT department coordination
- Security review
- Testing environment

#### **Phase 3: User-Friendly (Optional)**
**Self-Service Registration**

**Why:**
- ✅ Reduces admin workload
- ✅ Users can reset passwords
- ✅ Good for faculty onboarding

**Features:**
- Email verification
- Domain restriction (@university.edu only)
- Admin approval workflow
- Password reset functionality

---

## Part 2: Forgotten Account Handling

### 2.1 How Universities Handle Forgotten Accounts

#### **Industry Standard Approaches:**

1. **Self-Service Password Reset (SSPR)** ⭐⭐⭐⭐⭐
   - Users reset password via email verification
   - No IT help desk needed
   - Available 24/7
   - Most common in higher education

2. **Security Questions** ⭐⭐⭐⭐
   - Users answer pre-set security questions
   - Alternative to email verification
   - Good backup method
   - Less secure than email

3. **Admin-Assisted Reset** ⭐⭐⭐
   - User contacts IT/help desk
   - Admin manually resets password
   - Sends temporary password via email
   - Labor-intensive but secure

4. **Account Recovery Links** ⭐⭐⭐⭐
   - Time-limited recovery links
   - Sent to registered email
   - Single-use tokens
   - Secure and user-friendly

5. **Multi-Factor Authentication (MFA)** ⭐⭐⭐⭐⭐
   - SMS code, authenticator app, or email
   - Additional security layer
   - Required for password reset
   - Industry best practice

### 2.2 Recommended Approach for Your System

#### **Essential Features (Must Have):**

1. **"Forgot Password" Link on Login Page**
   - Prominently displayed
   - Clear and accessible
   - Works for all user roles

2. **Email-Based Password Reset**
   - User enters email address
   - System sends reset link (expires in 1 hour)
   - User clicks link and creates new password
   - Confirmation email sent

3. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character
   - Cannot reuse last 5 passwords

4. **Account Lockout Protection**
   - Lock account after 5 failed attempts
   - 30-minute lockout period
   - Email notification to user
   - Admin can manually unlock

#### **Advanced Features (Nice to Have):**

5. **Security Questions (Backup Method)**
   - 3-5 security questions during registration
   - Alternative if email access lost
   - Cannot be same as password

6. **Admin Password Reset**
   - Admin can reset any user's password
   - Temporary password generated
   - User forced to change on next login
   - Audit log of all admin resets

7. **Account Status Management**
   - Active/Inactive/Suspended status
   - Inactive accounts after 90 days no login
   - Email reminder before deactivation
   - Admin can reactivate accounts

8. **Session Management**
   - Auto-logout after 30 minutes inactivity
   - "Remember me" option (7 days)
   - View active sessions
   - Force logout from all devices

### 2.3 Implementation Priority

#### **Priority 1: Critical (Implement Immediately)**
1. ✅ Forgot password functionality
2. ✅ Email-based password reset
3. ✅ Password requirements enforcement
4. ✅ Account lockout protection

#### **Priority 2: Important (Implement Soon)**
5. ✅ Admin password reset capability
6. ✅ Account status management
7. ✅ Session timeout
8. ✅ Login audit logging

#### **Priority 3: Nice to Have (Future)**
9. ✅ Security questions
10. ✅ Multi-factor authentication
11. ✅ Active session viewer
12. ✅ Password history tracking

---

## Part 3: Complete Account Lifecycle Management

### 3.1 Account Creation Flow

```
1. Admin uploads CSV file
   ↓
2. System validates data
   ↓
3. Preview of accounts to be created
   ↓
4. Admin confirms import
   ↓
5. Accounts created with temporary passwords
   ↓
6. Welcome emails sent to all users
   ↓
7. Users set their own passwords on first login
```

### 3.2 Password Reset Flow

```
1. User clicks "Forgot Password"
   ↓
2. User enters email address
   ↓
3. System sends reset link (expires in 1 hour)
   ↓
4. User clicks link
   ↓
5. User creates new password
   ↓
6. System validates password requirements
   ↓
7. Confirmation email sent
   ↓
8. User can login with new password
```

### 3.3 Account Deactivation Flow

```
1. System detects 90 days of inactivity
   ↓
2. Warning email sent (7 days before deactivation)
   ↓
3. If no login, account deactivated
   ↓
4. Notification sent to admin
   ↓
5. Admin can reactivate if needed
   ↓
6. User must reset password to reactivate
```

---

## Part 4: Security Best Practices

### 4.1 Password Security

- ✅ Hash passwords using bcrypt (cost factor 12)
- ✅ Never store plain text passwords
- ✅ Use salt for each password
- ✅ Implement password strength meter
- ✅ Block common passwords (password123, etc.)

### 4.2 Email Security

- ✅ Use HTTPS for all reset links
- ✅ Include timestamp in reset tokens
- ✅ Invalidate token after use
- ✅ Log all password reset attempts
- ✅ Notify user of successful password change

### 4.3 Account Security

- ✅ Implement rate limiting on login attempts
- ✅ Use CAPTCHA after 3 failed attempts
- ✅ Log all login attempts (success and failure)
- ✅ Monitor for suspicious activity
- ✅ Implement IP-based restrictions for admin accounts

---

## Part 5: User Experience Considerations

### 5.1 Clear Communication

**Password Reset Email Template:**
```
Subject: Reset Your FES Password

Dear [Name],

We received a request to reset your password for the Faculty Evaluation System.

Click the link below to create a new password:
[Reset Link]

This link will expire in 1 hour for security purposes.

If you didn't request this reset, please ignore this email or contact IT support.

Best regards,
FES Administration
```

**Welcome Email Template:**
```
Subject: Welcome to the Faculty Evaluation System

Dear [Name],

Your account has been created for the Faculty Evaluation System.

Login Credentials:
- Username: [Email]
- Temporary Password: [Temp Password]

Please login and change your password immediately.

Login URL: [Login URL]

If you have any questions, please contact IT support.

Best regards,
FES Administration
```

### 5.2 Error Messages

**Good Error Messages:**
- ✅ "Password must be at least 8 characters long"
- ✅ "Password must contain at least one number"
- ✅ "This reset link has expired. Please request a new one."
- ✅ "Too many failed attempts. Please try again in 30 minutes."

**Bad Error Messages:**
- ❌ "Invalid credentials" (too vague)
- ❌ "Error 500" (not user-friendly)
- ❌ "Access denied" (doesn't explain why)

---

## Part 6: Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Add "Forgot Password" link to login page
- [ ] Implement email-based password reset
- [ ] Add password requirements validation
- [ ] Implement account lockout protection
- [ ] Create password reset email templates

### Phase 2: Admin Tools (Week 2)
- [ ] Add admin password reset capability
- [ ] Implement account status management
- [ ] Create user management interface
- [ ] Add login audit logging
- [ ] Implement session timeout

### Phase 3: Bulk Import (Week 3)
- [ ] Create CSV import interface
- [ ] Implement data validation
- [ ] Add preview functionality
- [ ] Create import templates
- [ ] Implement error handling

### Phase 4: Advanced Features (Week 4)
- [ ] Add security questions
- [ ] Implement account deactivation
- [ ] Add email notifications
- [ ] Create admin dashboard for accounts
- [ ] Implement password history

---

## Part 7: Metrics and Monitoring

### 7.1 Key Metrics to Track

- Password reset requests per week
- Average time to reset password
- Failed login attempts per user
- Account lockout frequency
- CSV import success rate
- User activation rate
- Time to first login after account creation

### 7.2 Alerts and Notifications

- 🔴 Alert: More than 50 failed login attempts in 1 hour
- 🟡 Warning: User account inactive for 80 days
- 🟢 Info: CSV import completed successfully
- 🔴 Alert: Password reset link expired before use
- 🟡 Warning: Admin password reset performed

---

## Part 8: Compliance and Privacy

### 8.1 Data Protection

- ✅ Comply with FERPA (student data)
- ✅ Follow institutional data retention policies
- ✅ Encrypt sensitive data at rest
- ✅ Use HTTPS for all data transmission
- ✅ Implement proper access controls

### 8.2 Audit Requirements

- Log all account creation events
- Log all password changes
- Log all admin actions
- Log all failed login attempts
- Retain logs for minimum 1 year
- Make logs available for audit

---

## Conclusion

### Immediate Actions Required:

1. **Implement Bulk CSV Import** (Priority: HIGH)
   - Saves hours of manual work
   - Scalable for large deployments
   - Can be done in 1-2 days

2. **Add Forgot Password Functionality** (Priority: CRITICAL)
   - Essential for user experience
   - Reduces IT support burden
   - Industry standard expectation

3. **Implement Password Security** (Priority: CRITICAL)
   - Protect user accounts
   - Meet security requirements
   - Prevent unauthorized access

### Long-term Recommendations:

1. **SIS Integration** (Future)
   - Automate account creation
   - Keep data synchronized
   - Reduce manual work

2. **Self-Service Features** (Future)
   - Empower users
   - Reduce admin workload
   - Improve user satisfaction

3. **Advanced Security** (Future)
   - Multi-factor authentication
   - Behavioral analytics
   - Threat detection

---

## Appendix: Sample CSV Template

```csv
user_id,first_name,last_name,email,role,department,program,courses
C24-001,Alice,Johnson,alice.johnson@university.edu,student,Computer Science,BSCS,"CS101,CS201,MATH101"
C24-002,Bob,Smith,bob.smith@university.edu,student,Computer Science,BSCS,"CS101,CS150,CS201"
F001,Sarah,Chen,sarah.chen@university.edu,faculty,Computer Science,,"CS101,CS201,CS301"
F002,James Wilson,james.wilson@university.edu,faculty,Computer Science,,"CS401,CS350"
M001,Patricia Moore,patricia.moore@university.edu,dean,Computer Science,,
```

**Column Descriptions:**
- `user_id`: Unique identifier (student ID, faculty ID, etc.)
- `first_name`: User's first name
- `last_name`: User's last name
- `email`: University email address (used for login)
- `role`: student, faculty, dean, or admin
- `department`: Department name
- `program`: Program code (for students only)
- `courses`: Comma-separated list of course codes (for students/faculty)

---

**Document Version:** 1.0  
**Last Updated:** 2026  
**Status:** Ready for Implementation
