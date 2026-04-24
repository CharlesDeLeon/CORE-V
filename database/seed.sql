-- ============================================================
-- CORE V — Seed Data
-- Run this AFTER your schema (drop/create tables) script
-- All passwords are: Password123!
-- ============================================================

-- ─── USERS ───────────────────────────────────────────────────
INSERT INTO users (name, email, password, role, program) VALUES
  ('Eizen Rodriguez',               'student1@corev.test',     '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSIT'),
  ('Kenta Shimoda',                 'student2@corev.test',     '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSCS'),
  ('Chelsea Garcia',                'student3@corev.test',     '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSIT'),
  ('Robbi Perez',                   'student4@corev.test',     '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'student',     'BSIT'),
  ('Prof. Denise Punzalan',         'faculty@corev.test',      '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'faculty',     NULL),
  ('Prof. Kenneth Bautista',        'faculty2@corev.test',     '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'faculty',     NULL),
  ('Coord. Reynaldo G. Bautista',   'coordinator@corev.test',  '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'coordinator', NULL),
  ('IT Admin',                      'sysadmin@corev.test',     '$2b$10$o.ahri7SUGWeoxMa5gstWet5kIUGXGNB/3Qy.XXYEJEz7.NtubQ6C', 'sysadmin',    NULL);

-- ─── RESEARCH GROUPS ─────────────────────────────────────────
-- created_by references coordinator (user_id 7)
INSERT INTO research_groups (group_name, program, school_year, created_by) VALUES
  ('Group Alpha', 'BSIT', '2024-2025', 7),
  ('Group Beta',  'BSCS', '2024-2025', 7),
  ('Group Gamma', 'BSIT', '2024-2025', 7);

-- ─── GROUP MEMBERS ───────────────────────────────────────────
-- Group Alpha (group_id 1): Eizen Rodriguez (1), Chelsea Garcia (3)
-- Group Beta  (group_id 2): Kenta Shimoda (2)
-- Group Gamma (group_id 3): Robbi Perez (4)
INSERT INTO group_members (group_id, user_id) VALUES
  (1, 1),
  (1, 3),
  (2, 2),
  (3, 4);

-- ─── PANEL ASSIGNMENTS ───────────────────────────────────────
-- Prof. Denise Punzalan (faculty_id 5): adviser for Alpha & Beta, panelist for Gamma
-- Prof. Kenneth Bautista (faculty_id 6): panelist for Alpha
-- assigned_by references coordinator (user_id 7)
INSERT INTO panel_assignments (group_id, faculty_id, role_in_panel, assigned_by) VALUES
  (1, 5, 'adviser',  7),
  (2, 5, 'adviser',  7),
  (3, 5, 'panelist', 7),
  (1, 6, 'panelist', 7);

-- ─── SUBMISSIONS ─────────────────────────────────────────────
-- submitted_by references the group leader's user_id
INSERT INTO submissions
  (group_id, title, abstract, keywords, authors, program, school_year, stage, status, submitted_by)
VALUES
  (
    1,
    'AI-Powered Attendance Monitoring System Using Facial Recognition',
    'This study proposes an automated attendance monitoring system leveraging facial recognition technology and machine learning algorithms. The system aims to replace manual attendance tracking in academic institutions, reducing administrative overhead and improving accuracy. Using a convolutional neural network trained on a dataset of student facial images, the system achieves a recognition accuracy of 97.3% under controlled lighting conditions.',
    'facial recognition, attendance monitoring, machine learning, CNN, automation',
    'Eizen Rodriguez, Chelsea Garcia',
    'BSIT', '2024-2025', 'proposal', 'under_review', 1
  ),
  (
    2,
    'Blockchain-Based Academic Records Management System',
    'This research presents a decentralized academic records management system built on blockchain technology. The proposed system ensures tamper-proof storage and verification of academic credentials, addressing the growing problem of fraudulent certificates. Smart contracts are used to automate the issuance and validation of records.',
    'blockchain, academic records, smart contracts, decentralization, credential verification',
    'Kenta Shimoda',
    'BSCS', '2024-2025', 'defense', 'needs_revision', 2
  ),
  (
    3,
    'Mobile-Based Crop Disease Detection Using Deep Learning',
    'This paper presents a mobile application that uses deep learning to detect crop diseases from images captured by farmers. The model, based on MobileNetV2, was trained on a dataset of 15,000 labeled images across 12 disease categories. Field testing demonstrated 94.1% accuracy, providing an accessible diagnostic tool for smallholder farmers.',
    'deep learning, crop disease, MobileNetV2, mobile application, agriculture',
    'Robbi Perez',
    'BSIT', '2024-2025', 'final_submission', 'approved', 4
  );

-- ─── DOCUMENT VERSIONS ───────────────────────────────────────
INSERT INTO document_versions
  (submission_id, version_number, file_path, file_name, file_size, file_type, uploaded_by)
VALUES
  (1, 1, 'uploads/submissions/1/v1_attendance_system.pdf',    'v1_attendance_system.pdf',    2048000, 'application/pdf', 1),
  (1, 2, 'uploads/submissions/1/v2_attendance_system.pdf',    'v2_attendance_system.pdf',    2150000, 'application/pdf', 1),
  (2, 1, 'uploads/submissions/2/v1_blockchain_records.pdf',   'v1_blockchain_records.pdf',   1875000, 'application/pdf', 2),
  (3, 1, 'uploads/submissions/3/v1_crop_detection.pdf',       'v1_crop_detection.pdf',       3200000, 'application/pdf', 4),
  (3, 2, 'uploads/submissions/3/v2_crop_detection.pdf',       'v2_crop_detection.pdf',       3350000, 'application/pdf', 4),
  (3, 3, 'uploads/submissions/3/v3_crop_detection_final.pdf', 'v3_crop_detection_final.pdf', 3400000, 'application/pdf', 4);

-- ─── REVIEWS ─────────────────────────────────────────────────
-- Prof. Denise Punzalan (reviewer_id 5) reviewed submissions 1 and 3
-- Prof. Kenneth Bautista (reviewer_id 6) reviewed submission 1
INSERT INTO reviews (submission_id, reviewer_id, status_assigned) VALUES
  (1, 5, 'for_revision'),
  (1, 6, 'for_revision'),
  (3, 5, 'approved');

-- ─── REVIEW COMMENTS ─────────────────────────────────────────
-- author_id references the reviewing faculty's user_id
INSERT INTO review_comments (submission_id, author_id, comment_text) VALUES
  (1, 5, 'The methodology section needs more detail on the dataset collection process. Please specify the number of subjects and the conditions under which photos were taken.'),
  (1, 5, 'Consider adding a comparison with existing attendance systems to better justify your approach. A literature review table would strengthen this section.'),
  (1, 6, 'The system architecture diagram is unclear. Please revise Figure 2 to show the data flow between the camera module and the recognition engine more explicitly.'),
  (2, 5, 'Good concept overall, but the blockchain implementation lacks specifics. Which consensus mechanism are you using and why? Please address this in the revision.'),
  (3, 5, 'Excellent work. The accuracy results are impressive and the mobile implementation is well documented. Approved for final submission.');

-- ─── NOTIFICATIONS ───────────────────────────────────────────
-- user_id references the student being notified
INSERT INTO notifications (user_id, submission_id, type, message) VALUES
  (1, 1, 'status_change', 'Your submission "AI-Powered Attendance Monitoring System" is now under review.'),
  (1, 1, 'new_comment',   'Prof. Denise Punzalan left feedback on your submission.'),
  (1, 1, 'new_comment',   'Prof. Kenneth Bautista left feedback on your submission.'),
  (2, 2, 'status_change', 'Your submission "Blockchain-Based Academic Records Management System" requires revision.'),
  (2, 2, 'new_comment',   'Prof. Denise Punzalan left feedback on your submission.'),
  (4, 3, 'status_change', 'Your submission "Mobile-Based Crop Disease Detection" has been approved!');

-- ─── AUDIT LOGS ──────────────────────────────────────────────
INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES
  (1, 'UPLOAD_VERSION', 'submission', 1, '{"version": 1, "file": "v1_attendance_system.pdf"}'),
  (1, 'UPLOAD_VERSION', 'submission', 1, '{"version": 2, "file": "v2_attendance_system.pdf"}'),
  (2, 'UPLOAD_VERSION', 'submission', 2, '{"version": 1, "file": "v1_blockchain_records.pdf"}'),
  (4, 'UPLOAD_VERSION', 'submission', 3, '{"version": 1, "file": "v1_crop_detection.pdf"}'),
  (5, 'SUBMIT_REVIEW',  'submission', 1, '{"status": "for_revision"}'),
  (5, 'SUBMIT_REVIEW',  'submission', 3, '{"status": "approved"}'),
  (6, 'SUBMIT_REVIEW',  'submission', 1, '{"status": "for_revision"}'),
  (7, 'ASSIGN_PANEL',   'group',      1, '{"faculty_id": 5, "role": "adviser"}'),
  (7, 'ASSIGN_PANEL',   'group',      2, '{"faculty_id": 5, "role": "adviser"}'),
  (7, 'ASSIGN_PANEL',   'group',      3, '{"faculty_id": 5, "role": "panelist"}');