# CampusFix

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE) [![Live demo](https://img.shields.io/badge/Live%20demo-online-brightgreen?style=flat-square)](https://campusfix.free.nf/) ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=white) ![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)

A modern campus issue and maintenance tracking portal connecting students, staff, and administrators.

**Live Deployment:** [https://campusfix.free.nf/](https://campusfix.free.nf/) · Health Check: [`/backend/api/health.php`](https://campusfix.free.nf/backend/api/health.php)

---

## ⚡ Tech Stack

- **Frontend**: React 19, Vite, React Router 7, Bootstrap 5, Chart.js
- **Backend**: PHP 8.2 (REST API, PDO)
- **Database**: MySQL / MariaDB (InnoDB)
- **Server**: Apache (XAMPP locally · InfinityFree in production)

---

## ✨ Features

- **Students**: Report issues with category, priority & image attachment; track real-time status; collaborate via comments.
- **Staff**: View assigned queue, update ticket status (`in_progress`, `resolved`), and add resolution notes.
- **Admin**: Assign tickets to staff, manage users & categories, view resolution metrics, and export CSV reports.
- **Security & Reliability**:
  - Role-based access control (RBAC) & protected routing.
  - CSRF protection with token regeneration on authentication.
  - Secure session cookies with dynamic reverse-proxy HTTPS detection (`SameSite=Lax`).
  - Apache `.htaccess` security hardening blocking sensitive directories and `.env` files.
  - Automatic HTTPS enforcement and React SPA deep-link rewriting.
  - Global PHP JSON exception handling for consistent API error responses.
  - Prepared SQL statements with PDO throughout.

---

## 🚀 Local Development Setup

### 1. Database Setup
Ensure MySQL is running (e.g. via XAMPP) and import the schema and seed data:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Configuration
Create `backend/.env` for local development:
```ini
APP_ENV=development
DB_HOST=localhost
DB_NAME=campusfix
DB_USER=root
DB_PASS=
```
Serve via Apache/XAMPP at `http://localhost/campusfix` (or symlink the project folder into `C:\xampp\htdocs\campusfix`).

Verify local health: [http://localhost/campusfix/backend/api/health.php](http://localhost/campusfix/backend/api/health.php)

### 3. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Demo Accounts (Local Development)

All demo accounts use the password: **`password`**

| Role | Email | Portal |
| :--- | :--- | :--- |
| **Admin** | `admin@campusfix.local` | `/admin/dashboard` |
| **Staff** | `staff.it@campusfix.local` | `/staff/dashboard` |
| **Student** | `alice@campusfix.local` | `/student/dashboard` |

> ⚠️ These demo accounts come from `database/seed.sql` and use a publicly known password. Never import `seed.sql` into a production database — use `database/seed_prod.sql` instead, which seeds categories only. Create real accounts via `/register` and promote the first admin manually in phpMyAdmin.

---

## 🌍 Production Deployment (InfinityFree)

The production build is a static React bundle served from `htdocs/` alongside the PHP backend at `htdocs/backend/` (same origin, eliminating CORS issues).

### 1. Database Setup
In the InfinityFree control panel, open phpMyAdmin for your database and import:
1. `database/schema_prod.sql` — MySQL 5.7+ safe schema without `CREATE DATABASE` / `USE`.
2. `database/seed_prod.sql` — Seeds default ticket categories without demo accounts.

### 2. Build & Package
Keep production credentials in `backend/.env.production` (automatically ignored by git):
```ini
APP_ENV=production
DB_HOST=<your-infinityfree-mysql-host>
DB_NAME=<your-infinityfree-db-name>
DB_USER=<your-infinityfree-db-user>
DB_PASS=<your-infinityfree-db-password>
```

Run the build and packager script:
```bash
cd frontend && npm run build && cd ..
.\build_deploy.ps1
```
The packaging script will:
- Build the optimized Vite React distribution (`frontend/dist`).
- Stage production files into `deploy_package/`.
- Prioritize `backend/.env.production` for the production package while keeping your local `backend/.env` intact.
- Run integrity and security checks (validating non-localhost configuration, excluding `.git`, `node_modules`, etc.).
- Generate the final `campusfix_deploy.zip` archive.

### 3. Upload & File Permissions
1. In the InfinityFree Online File Manager, navigate to `htdocs/`.
2. Upload `campusfix_deploy.zip` and extract it directly into `htdocs/`.
3. Verify the root contains `index.html`, `.htaccess`, `assets/`, and `backend/`.
4. Ensure `backend/files/uploads/` has write permissions (`755`).
5. Access your deployment at **`https://campusfix.free.nf/`**.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## Author

Built by [Jai Aakash S](https://github.com/JaiAakash21) · [Portfolio](https://jaiaakash.xyz) · [LinkedIn](https://www.linkedin.com/in/jaiaakash21)
