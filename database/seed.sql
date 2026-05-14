-- ============================================================
-- CORE V — Seed Data (PostgreSQL)
-- Run this AFTER schema.sql
-- All passwords are: Password123!
-- ============================================================

-- ─── USERS ───────────────────────────────────────────────────
INSERT INTO users (name, email, password, role, program) VALUES
  ('Eizen Rodriguez',             'student1@corev.test',    '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSIT'),
  ('Kenta Shimoda',               'student2@corev.test',    '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSCS'),
  ('Chelsea Garcia',              'student3@corev.test',    '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSIT'),
  ('Robbi Perez',                 'student4@corev.test',    '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSIT'),
  ('Prof. Denise Punzalan',       'faculty@corev.test',     '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'faculty',     NULL),
  ('Prof. Kenneth Bautista',      'faculty2@corev.test',    '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'faculty',     NULL),
  ('Coord. Reynaldo G. Bautista', 'coordinator@corev.test', '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'coordinator', NULL),
  ('IT Admin',                    'sysadmin@corev.test',    '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'sysadmin',    NULL);

-- ─── RESEARCH GROUPS ─────────────────────────────────────────
INSERT INTO research_groups (group_name, program, school_year, created_by) VALUES
  ('Group Alpha', 'BSIT', '2024-2025', (SELECT user_id FROM users WHERE email = 'coordinator@corev.test')),
  ('Group Beta',  'BSCS', '2024-2025', (SELECT user_id FROM users WHERE email = 'coordinator@corev.test')),
  ('Group Gamma', 'BSIT', '2024-2025', (SELECT user_id FROM users WHERE email = 'coordinator@corev.test'));

-- ─── GROUP MEMBERS ───────────────────────────────────────────
INSERT INTO group_members (group_id, user_id) VALUES
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Alpha'),
    (SELECT user_id  FROM users            WHERE email     = 'student1@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Alpha'),
    (SELECT user_id  FROM users            WHERE email     = 'student3@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Beta'),
    (SELECT user_id  FROM users            WHERE email     = 'student2@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Gamma'),
    (SELECT user_id  FROM users            WHERE email     = 'student4@corev.test')
  );

-- ─── PANEL ASSIGNMENTS ───────────────────────────────────────
INSERT INTO panel_assignments (group_id, faculty_id, role_in_panel, assigned_by) VALUES
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Alpha'),
    (SELECT user_id  FROM users            WHERE email     = 'faculty@corev.test'),
    'adviser',
    (SELECT user_id  FROM users            WHERE email     = 'coordinator@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Beta'),
    (SELECT user_id  FROM users            WHERE email     = 'faculty@corev.test'),
    'adviser',
    (SELECT user_id  FROM users            WHERE email     = 'coordinator@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Gamma'),
    (SELECT user_id  FROM users            WHERE email     = 'faculty@corev.test'),
    'panelist',
    (SELECT user_id  FROM users            WHERE email     = 'coordinator@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Alpha'),
    (SELECT user_id  FROM users            WHERE email     = 'faculty2@corev.test'),
    'panelist',
    (SELECT user_id  FROM users            WHERE email     = 'coordinator@corev.test')
  );

-- ─── SUBMISSIONS ─────────────────────────────────────────────
INSERT INTO submissions
  (group_id, title, abstract, keywords, authors, program, school_year, stage, status, submitted_by)
VALUES
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Alpha'),
    'AI-Powered Attendance Monitoring System Using Facial Recognition',
    'This study proposes an automated attendance monitoring system leveraging facial recognition technology and machine learning algorithms. The system aims to replace manual attendance tracking in academic institutions, reducing administrative overhead and improving accuracy. Using a convolutional neural network trained on a dataset of student facial images, the system achieves a recognition accuracy of 97.3% under controlled lighting conditions.',
    'facial recognition, attendance monitoring, machine learning, CNN, automation',
    'Eizen Rodriguez, Chelsea Garcia',
    'BSIT', '2024-2025', 'proposal', 'under_review',
    (SELECT user_id FROM users WHERE email = 'student1@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Beta'),
    'Blockchain-Based Academic Records Management System',
    'This research presents a decentralized academic records management system built on blockchain technology. The proposed system ensures tamper-proof storage and verification of academic credentials, addressing the growing problem of fraudulent certificates. Smart contracts are used to automate the issuance and validation of records.',
    'blockchain, academic records, smart contracts, decentralization, credential verification',
    'Kenta Shimoda',
    'BSCS', '2024-2025', 'defense', 'needs_revision',
    (SELECT user_id FROM users WHERE email = 'student2@corev.test')
  ),
  (
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Gamma'),
    'Mobile-Based Crop Disease Detection Using Deep Learning',
    'This paper presents a mobile application that uses deep learning to detect crop diseases from images captured by farmers. The model, based on MobileNetV2, was trained on a dataset of 15,000 labeled images across 12 disease categories. Field testing demonstrated 94.1% accuracy, providing an accessible diagnostic tool for smallholder farmers.',
    'deep learning, crop disease, MobileNetV2, mobile application, agriculture',
    'Robbi Perez',
    'BSIT', '2024-2025', 'final_submission', 'approved',
    (SELECT user_id FROM users WHERE email = 'student4@corev.test')
  );

-- ─── DOCUMENT VERSIONS ───────────────────────────────────────
INSERT INTO document_versions
  (submission_id, version_number, file_path, file_name, file_size, file_type, uploaded_by)
VALUES
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    1, 'uploads/submissions/1/v1_attendance_system.pdf', 'v1_attendance_system.pdf', 2048000, 'application/pdf',
    (SELECT user_id FROM users WHERE email = 'student1@corev.test')
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    2, 'uploads/submissions/1/v2_attendance_system.pdf', 'v2_attendance_system.pdf', 2150000, 'application/pdf',
    (SELECT user_id FROM users WHERE email = 'student1@corev.test')
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'Blockchain-Based%'),
    1, 'uploads/submissions/2/v1_blockchain_records.pdf', 'v1_blockchain_records.pdf', 1875000, 'application/pdf',
    (SELECT user_id FROM users WHERE email = 'student2@corev.test')
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    1, 'uploads/submissions/3/v1_crop_detection.pdf', 'v1_crop_detection.pdf', 3200000, 'application/pdf',
    (SELECT user_id FROM users WHERE email = 'student4@corev.test')
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    2, 'uploads/submissions/3/v2_crop_detection.pdf', 'v2_crop_detection.pdf', 3350000, 'application/pdf',
    (SELECT user_id FROM users WHERE email = 'student4@corev.test')
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    3, 'uploads/submissions/3/v3_crop_detection_final.pdf', 'v3_crop_detection_final.pdf', 3400000, 'application/pdf',
    (SELECT user_id FROM users WHERE email = 'student4@corev.test')
  );

-- ─── REVIEWS ─────────────────────────────────────────────────
INSERT INTO reviews (submission_id, reviewer_id, status_assigned) VALUES
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'for_revision'
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    (SELECT user_id FROM users WHERE email = 'faculty2@corev.test'),
    'for_revision'
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'approved'
  );

-- ─── REVIEW COMMENTS ─────────────────────────────────────────
INSERT INTO review_comments (submission_id, author_id, comment_text) VALUES
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'The methodology section needs more detail on the dataset collection process. Please specify the number of subjects and the conditions under which photos were taken.'
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'Consider adding a comparison with existing attendance systems to better justify your approach. A literature review table would strengthen this section.'
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    (SELECT user_id FROM users WHERE email = 'faculty2@corev.test'),
    'The system architecture diagram is unclear. Please revise Figure 2 to show the data flow between the camera module and the recognition engine more explicitly.'
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'Blockchain-Based%'),
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'Good concept overall, but the blockchain implementation lacks specifics. Which consensus mechanism are you using and why? Please address this in the revision.'
  ),
  (
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'Excellent work. The accuracy results are impressive and the mobile implementation is well documented. Approved for final submission.'
  );

-- ─── NOTIFICATIONS ───────────────────────────────────────────
INSERT INTO notifications (user_id, submission_id, type, message) VALUES
  (
    (SELECT user_id FROM users WHERE email = 'student1@corev.test'),
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    'status_change',
    'Your submission "AI-Powered Attendance Monitoring System" is now under review.'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student1@corev.test'),
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    'new_comment',
    'Prof. Denise Punzalan left feedback on your submission.'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student1@corev.test'),
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    'new_comment',
    'Prof. Kenneth Bautista left feedback on your submission.'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student2@corev.test'),
    (SELECT submission_id FROM submissions WHERE title LIKE 'Blockchain-Based%'),
    'status_change',
    'Your submission "Blockchain-Based Academic Records Management System" requires revision.'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student2@corev.test'),
    (SELECT submission_id FROM submissions WHERE title LIKE 'Blockchain-Based%'),
    'new_comment',
    'Prof. Denise Punzalan left feedback on your submission.'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student4@corev.test'),
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    'status_change',
    'Your submission "Mobile-Based Crop Disease Detection" has been approved!'
  );

-- ─── AUDIT LOGS ──────────────────────────────────────────────
INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES
  (
    (SELECT user_id FROM users WHERE email = 'student1@corev.test'),
    'UPLOAD_VERSION', 'submission',
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    '{"version": 1, "file": "v1_attendance_system.pdf"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student1@corev.test'),
    'UPLOAD_VERSION', 'submission',
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    '{"version": 2, "file": "v2_attendance_system.pdf"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student2@corev.test'),
    'UPLOAD_VERSION', 'submission',
    (SELECT submission_id FROM submissions WHERE title LIKE 'Blockchain-Based%'),
    '{"version": 1, "file": "v1_blockchain_records.pdf"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'student4@corev.test'),
    'UPLOAD_VERSION', 'submission',
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    '{"version": 1, "file": "v1_crop_detection.pdf"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'SUBMIT_REVIEW', 'submission',
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    '{"status": "for_revision"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'faculty@corev.test'),
    'SUBMIT_REVIEW', 'submission',
    (SELECT submission_id FROM submissions WHERE title LIKE 'Mobile-Based Crop%'),
    '{"status": "approved"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'faculty2@corev.test'),
    'SUBMIT_REVIEW', 'submission',
    (SELECT submission_id FROM submissions WHERE title LIKE 'AI-Powered Attendance%'),
    '{"status": "for_revision"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'coordinator@corev.test'),
    'ASSIGN_PANEL', 'group',
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Alpha'),
    '{"faculty": "faculty@corev.test", "role": "adviser"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'coordinator@corev.test'),
    'ASSIGN_PANEL', 'group',
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Beta'),
    '{"faculty": "faculty@corev.test", "role": "adviser"}'
  ),
  (
    (SELECT user_id FROM users WHERE email = 'coordinator@corev.test'),
    'ASSIGN_PANEL', 'group',
    (SELECT group_id FROM research_groups WHERE group_name = 'Group Gamma'),
    '{"faculty": "faculty@corev.test", "role": "panelist"}'
  );