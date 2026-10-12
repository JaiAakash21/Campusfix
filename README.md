# CampusFix

A modern campus issue and maintenance tracking portal connecting students, staff, and administrators.

---

## ⚡ Tech Stack

- **Frontend**: React 19, Vite, React Router, Bootstrap 5
- **Backend**: PHP 8.2 (REST API, PDO)
- **Database**: MySQL / MariaDB (InnoDB)
- **Server**: Apache (XAMPP)

---

## ✨ Features

- **Students**: Report issues with category, priority & image attachment; track status; chat via comments.
- **Staff**: View assigned queue, update ticket status (`in_progress`, `resolved`), and add resolution notes.
- **Admin**: Assign tickets to staff, manage users & categories, view resolution metrics, and export CSV reports.
- **Security**: Role-based access control, CSRF protection, secure sessions, and prepared SQL statements.

---

## 🚀 Quick Setup

### 1. Database
Import the schema and test data into MySQL:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend
Create `backend/.env`:
```ini
APP_ENV=development
DB_HOST=localhost
DB_NAME=campusfix
DB_USER=root
DB_PASS=
```
Serve via Apache/XAMPP at `http://localhost/campusfix` (or symlink the project folder into `htdocs`).

Check health: [http://localhost/campusfix/backend/api/health.php](http://localhost/campusfix/backend/api/health.php)

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Demo Accounts

All accounts use the password: **`password`**

| Role | Email | Portal |
| :--- | :--- | :--- |
| **Admin** | `admin@campusfix.local` | `/admin/dashboard` |
| **Staff** | `staff.it@campusfix.local` | `/staff/dashboard` |
| **Student** | `alice@campusfix.local` | `/student/dashboard` |
