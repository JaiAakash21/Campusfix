<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

require_auth(['admin']);

$pdo = get_db();

$where  = ['1=1'];
$params = [];

// Optional role filter — used by admin ticket detail to populate staff dropdown
$role = $_GET['role'] ?? '';
if ($role && in_array($role, ['student', 'staff', 'admin'], true)) {
    $where[]  = 'role = ?';
    $params[] = $role;
}

$stmt = $pdo->prepare(
    'SELECT id, name, email, role, status, created_at
     FROM users
     WHERE ' . implode(' AND ', $where) . '
     ORDER BY created_at DESC'
);
$stmt->execute($params);
$users = $stmt->fetchAll();

send_json(['users' => $users]);
