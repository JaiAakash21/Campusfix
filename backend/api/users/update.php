<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    send_error('Method not allowed', 405);
}

$admin = require_auth(['admin']);
verify_csrf();

$body   = get_json_body();
$id     = (int) ($body['id']     ?? 0);
$status = $body['status']        ?? null;
$role   = $body['role']          ?? null;
$name   = isset($body['name']) ? trim($body['name']) : null;

if ($id <= 0) {
    send_error('id is required', 422);
}

// Prevent admin from suspending themselves
if ($id === (int)$admin['id'] && $status === 'suspended') {
    send_error('You cannot suspend your own account', 403);
}

$pdo  = get_db();
$stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$stmt->execute([$id]);
if (!$stmt->fetch()) {
    send_error('User not found', 404);
}

$sets   = [];
$params = [];

if ($status !== null) {
    if (!in_array($status, ['active', 'suspended'], true)) {
        send_error('Status must be active or suspended', 422);
    }
    $sets[]   = 'status = ?';
    $params[] = $status;
}
if ($role !== null) {
    if (!in_array($role, ['student', 'staff', 'admin'], true)) {
        send_error('Role must be student, staff, or admin', 422);
    }
    $sets[]   = 'role = ?';
    $params[] = $role;
}
if ($name !== null) {
    if (empty($name) || strlen($name) > 100) {
        send_error('Name must be 1–100 characters', 422);
    }
    $sets[]   = 'name = ?';
    $params[] = $name;
}

if (empty($sets)) {
    send_error('Nothing to update', 422);
}

$params[] = $id;
$pdo->prepare(
    'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?'
)->execute($params);

send_json(['success' => true]);
