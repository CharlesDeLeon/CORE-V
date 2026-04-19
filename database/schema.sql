CREATE DATABASE IF NOT EXISTS core_db;
USE core_db;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT null,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
    user_id INT PRIMARY KEY,
    year_level INT NOT NULL,
    block_id VARCHAR(10) NOT NULL,
    program VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE research_papers (
  paper_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  authors TEXT NOT NULL,
  program VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  adviser_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (paper_id)
);

CREATE TABLE versions (
  version_id INT NOT NULL AUTO_INCREMENT,
  paper_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  version_number INT NOT NULL,
  uploader_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version_id),
  CONSTRAINT fk_paper_versions 
    FOREIGN KEY (paper_id) REFERENCES research_papers(paper_id) 
    ON DELETE CASCADE
);

CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    feedback TEXT,
    status_assigned ENUM('Ongoing', 'Needs Revision', 'Approved') NOT NULL,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paper_id INT NOT NULL,
    admin_id INT NOT NULL,
    FOREIGN KEY (paper_id) REFERENCES research_papers(paper_id),
    FOREIGN KEY (admin_id) REFERENCES users (user_id)
);

CREATE TABLE audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    paper_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (paper_id) REFERENCES research_papers(paper_id)
);