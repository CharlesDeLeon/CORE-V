SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS review_comments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS panel_assignments;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS research_groups;
DROP TABLE IF EXISTS document_versions;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  user_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,    
  role          ENUM('student','faculty','coordinator','sysadmin') NOT NULL,
  program       VARCHAR(100)  DEFAULT NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE research_groups (
  group_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_name    VARCHAR(200)  NOT NULL,
  program       VARCHAR(100)  DEFAULT NULL,
  school_year   VARCHAR(20)   DEFAULT NULL,
  created_by    INT UNSIGNED  NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE group_members (
  member_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id      INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,                    -- must be role=student
  joined_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_group_user (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES research_groups(group_id),
  FOREIGN KEY (user_id)  REFERENCES users(user_id)
);

CREATE TABLE submissions (
  submission_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id        INT UNSIGNED  NOT NULL,
  title           VARCHAR(300)  NOT NULL,
  abstract        TEXT          DEFAULT NULL,
  keywords        VARCHAR(300)  DEFAULT NULL,
  authors         VARCHAR(300)  DEFAULT NULL,
  program         VARCHAR(100)  DEFAULT NULL,
  school_year     VARCHAR(20)   DEFAULT NULL,
  stage           ENUM('proposal','defense','final_submission') NOT NULL DEFAULT 'proposal',
  status          ENUM('submitted','under_review','needs_revision','approved','rejected','published')
                  NOT NULL DEFAULT 'submitted',

  is_published    TINYINT(1)    NOT NULL DEFAULT 0,
  submitted_by    INT UNSIGNED  NOT NULL,            
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id)     REFERENCES research_groups(group_id),
  FOREIGN KEY (submitted_by) REFERENCES users(user_id)
);

CREATE TABLE document_versions (
  version_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id   INT UNSIGNED  NOT NULL,
  version_number  SMALLINT      NOT NULL DEFAULT 1,
  file_path       VARCHAR(500)  NOT NULL,
  file_name       VARCHAR(255)  NOT NULL,
  file_size       INT UNSIGNED  DEFAULT NULL,
  file_type       VARCHAR(50)   DEFAULT NULL,
  uploaded_by     INT UNSIGNED  NOT NULL,
  uploaded_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_version (submission_id, version_number),
  FOREIGN KEY (submission_id) REFERENCES submissions(submission_id),
  FOREIGN KEY (uploaded_by)   REFERENCES users(user_id)
);

CREATE TABLE panel_assignments (
  assignment_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id        INT UNSIGNED  NOT NULL,
  faculty_id      INT UNSIGNED  NOT NULL,                 -- must be role=faculty
  role_in_panel   ENUM('adviser','panelist') NOT NULL,
  assigned_by     INT UNSIGNED  NOT NULL,                 -- coordinator user_id
  assigned_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_panel (group_id, faculty_id, role_in_panel),
  FOREIGN KEY (group_id)    REFERENCES research_groups(group_id),
  FOREIGN KEY (faculty_id)  REFERENCES users(user_id),
  FOREIGN KEY (assigned_by) REFERENCES users(user_id)
);

CREATE TABLE reviews (
  review_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id   INT UNSIGNED  NOT NULL,
  reviewer_id     INT UNSIGNED  NOT NULL,                 -- role=faculty
  status_assigned ENUM('approved','for_revision','rejected') NOT NULL,
  reviewed_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (submission_id, reviewer_id),
  FOREIGN KEY (submission_id) REFERENCES submissions(submission_id),
  FOREIGN KEY (reviewer_id)   REFERENCES users(user_id)
);

CREATE TABLE review_comments (
  comment_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id   INT UNSIGNED  NOT NULL,
  author_id       INT UNSIGNED  NOT NULL,                 -- faculty or coordinator
  comment_text    TEXT          NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (submission_id) REFERENCES submissions(submission_id),
  FOREIGN KEY (author_id)     REFERENCES users(user_id)
);

CREATE TABLE notifications (
  notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED  NOT NULL,                 -- recipient
  submission_id   INT UNSIGNED  DEFAULT NULL,             -- related paper (optional)
  type            ENUM('status_change','new_comment','assignment','system') NOT NULL,
  message         VARCHAR(500)  NOT NULL,
  is_read         TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)       REFERENCES users(user_id),
  FOREIGN KEY (submission_id) REFERENCES submissions(submission_id)
);

CREATE TABLE audit_logs (
  log_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED  DEFAULT NULL,             -- NULL if system action
  action          VARCHAR(100)  NOT NULL,                 -- e.g. 'UPLOAD_VERSION', 'STATUS_CHANGED'
  target_type     VARCHAR(50)   DEFAULT NULL,             -- e.g. 'submission', 'user'
  target_id       INT UNSIGNED  DEFAULT NULL,             -- ID of affected record
  details         TEXT          DEFAULT NULL,             -- JSON string for extra context
  ip_address      VARCHAR(45)   DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_submissions_status      ON submissions(status);
CREATE INDEX idx_submissions_stage       ON submissions(stage);
CREATE INDEX idx_submissions_group       ON submissions(group_id);
CREATE INDEX idx_submissions_published   ON submissions(is_published);
CREATE INDEX idx_versions_submission     ON document_versions(submission_id);
CREATE INDEX idx_reviews_reviewer        ON reviews(reviewer_id);
CREATE INDEX idx_comments_submission     ON review_comments(submission_id);
CREATE INDEX idx_notifications_user      ON notifications(user_id, is_read);
CREATE INDEX idx_audit_user              ON audit_logs(user_id);
CREATE INDEX idx_audit_target            ON audit_logs(target_type, target_id);
ALTER TABLE submissions ADD FULLTEXT INDEX ft_search (title, keywords, authors);

INSERT INTO users (name, email, password_hash, role, program) VALUES
  ('Juan dela Cruz',    'student@corev.test',     '$2a$10$REPLACE_WITH_REAL_HASH', 'student',     'BSIT'),
  ('Prof. Maria Santos','faculty@corev.test',     '$2a$10$REPLACE_WITH_REAL_HASH', 'faculty',     NULL),
  ('Coord. Ana Reyes',  'coordinator@corev.test', '$2a$10$REPLACE_WITH_REAL_HASH', 'coordinator', NULL),
  ('IT Admin',          'sysadmin@corev.test',    '$2a$10$REPLACE_WITH_REAL_HASH', 'sysadmin',    NULL);