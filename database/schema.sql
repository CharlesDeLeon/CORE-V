-- ============================================================
-- Drop tables in reverse dependency order
-- ============================================================
DROP TABLE IF EXISTS audit_logs        CASCADE;
DROP TABLE IF EXISTS notifications     CASCADE;
DROP TABLE IF EXISTS review_comments   CASCADE;
DROP TABLE IF EXISTS reviews           CASCADE;
DROP TABLE IF EXISTS panel_assignments CASCADE;
DROP TABLE IF EXISTS group_members     CASCADE;
DROP TABLE IF EXISTS research_groups   CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS submissions       CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- ============================================================
-- ENUM types (PostgreSQL requires explicit types)
-- ============================================================
DROP TYPE IF EXISTS user_role          CASCADE;
DROP TYPE IF EXISTS submission_stage   CASCADE;
DROP TYPE IF EXISTS submission_status  CASCADE;
DROP TYPE IF EXISTS panel_role         CASCADE;
DROP TYPE IF EXISTS review_status      CASCADE;
DROP TYPE IF EXISTS notification_type  CASCADE;

CREATE TYPE user_role         AS ENUM ('student','faculty','coordinator','sysadmin');
CREATE TYPE submission_stage  AS ENUM ('proposal','defense','final_submission');
CREATE TYPE submission_status AS ENUM ('submitted','under_review','needs_revision','approved','rejected','published');
CREATE TYPE panel_role        AS ENUM ('adviser','panelist');
CREATE TYPE review_status     AS ENUM ('approved','for_revision','rejected');
CREATE TYPE notification_type AS ENUM ('status_change','new_comment','assignment','system');

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
  user_id     SERIAL PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        user_role     NOT NULL,
  program     VARCHAR(100)  DEFAULT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- research_groups
-- ============================================================
CREATE TABLE research_groups (
  group_id    SERIAL PRIMARY KEY,
  group_name  VARCHAR(200)  NOT NULL,
  program     VARCHAR(100)  DEFAULT NULL,
  school_year VARCHAR(20)   DEFAULT NULL,
  created_by  INT           NOT NULL REFERENCES users(user_id),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- group_members
-- ============================================================
CREATE TABLE group_members (
  member_id   SERIAL PRIMARY KEY,
  group_id    INT         NOT NULL REFERENCES research_groups(group_id),
  user_id     INT         NOT NULL REFERENCES users(user_id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- ============================================================
-- submissions
-- ============================================================
CREATE TABLE submissions (
  submission_id   SERIAL PRIMARY KEY,
  group_id        INT                NOT NULL REFERENCES research_groups(group_id),
  title           VARCHAR(300)       NOT NULL,
  abstract        TEXT               DEFAULT NULL,
  keywords        VARCHAR(300)       DEFAULT NULL,
  authors         VARCHAR(300)       DEFAULT NULL,
  program         VARCHAR(100)       DEFAULT NULL,
  school_year     VARCHAR(20)        DEFAULT NULL,
  stage           submission_stage   NOT NULL DEFAULT 'proposal',
  status          submission_status  NOT NULL DEFAULT 'submitted',
  is_published    BOOLEAN            NOT NULL DEFAULT FALSE,
  submitted_by    INT                NOT NULL REFERENCES users(user_id),
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- ============================================================
-- document_versions
-- ============================================================
CREATE TABLE document_versions (
  version_id      SERIAL PRIMARY KEY,
  submission_id   INT          NOT NULL REFERENCES submissions(submission_id),
  version_number  SMALLINT     NOT NULL DEFAULT 1,
  file_path       VARCHAR(500) NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_size       INT          DEFAULT NULL,
  file_type       VARCHAR(50)  DEFAULT NULL,
  uploaded_by     INT          NOT NULL REFERENCES users(user_id),
  uploaded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, version_number)
);

-- ============================================================
-- panel_assignments
-- ============================================================
CREATE TABLE panel_assignments (
  assignment_id   SERIAL PRIMARY KEY,
  group_id        INT        NOT NULL REFERENCES research_groups(group_id),
  faculty_id      INT        NOT NULL REFERENCES users(user_id),
  role_in_panel   panel_role NOT NULL,
  assigned_by     INT        NOT NULL REFERENCES users(user_id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, faculty_id, role_in_panel)
);

-- ============================================================
-- reviews
-- ============================================================
CREATE TABLE reviews (
  review_id       SERIAL PRIMARY KEY,
  submission_id   INT           NOT NULL REFERENCES submissions(submission_id),
  reviewer_id     INT           NOT NULL REFERENCES users(user_id),
  status_assigned review_status NOT NULL,
  reviewed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, reviewer_id)
);

-- ============================================================
-- review_comments
-- ============================================================
CREATE TABLE review_comments (
  comment_id    SERIAL PRIMARY KEY,
  submission_id INT         NOT NULL REFERENCES submissions(submission_id),
  author_id     INT         NOT NULL REFERENCES users(user_id),
  comment_text  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id         INT               NOT NULL REFERENCES users(user_id),
  submission_id   INT               DEFAULT NULL REFERENCES submissions(submission_id),
  type            notification_type NOT NULL,
  message         VARCHAR(500)      NOT NULL,
  is_read         BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ============================================================
-- audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  log_id         SERIAL PRIMARY KEY,
  user_id        INT          DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  actor_name     VARCHAR(150) DEFAULT NULL,
  action         VARCHAR(100) NOT NULL,
  target_type    VARCHAR(50)  DEFAULT NULL,
  target_id      INT          DEFAULT NULL,
  changes        JSONB        DEFAULT NULL,
  details        TEXT         DEFAULT NULL,
  user_agent     VARCHAR(500) DEFAULT NULL,
  correlation_id VARCHAR(100) DEFAULT NULL,
  request_id     VARCHAR(100) DEFAULT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_submissions_status    ON submissions(status);
CREATE INDEX idx_submissions_stage     ON submissions(stage);
CREATE INDEX idx_submissions_group     ON submissions(group_id);
CREATE INDEX idx_submissions_published ON submissions(is_published);
CREATE INDEX idx_versions_submission   ON document_versions(submission_id);
CREATE INDEX idx_reviews_reviewer      ON reviews(reviewer_id);
CREATE INDEX idx_comments_submission   ON review_comments(submission_id);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX idx_audit_user            ON audit_logs(user_id);
CREATE INDEX idx_audit_target          ON audit_logs(target_type, target_id);

-- Full-text search (PostgreSQL equivalent of MySQL FULLTEXT)
CREATE INDEX idx_submissions_fts ON submissions
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(keywords,'') || ' ' || COALESCE(authors,'')));

-- ============================================================
-- Auto-update updated_at columns (replaces MySQL ON UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();