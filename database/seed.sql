USE corev_db;

-- password for both accounts is: password 123
-- (already hashed with bcrypt, 10 salt rounds)

INSERT INTO users (name, email, password, role) VALUES
(
    'Charles De Leon',
    'student@demo.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Student'
),
(
    'Admin User',
    'admin@demo.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin'
);