USE corev_db;

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