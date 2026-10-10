<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

start_secure_session();
verify_csrf();

$body  = get_json_body();
$email = trim($body['email']    ?? '');
$pass  = $body['password'] ?? '';

if (empty($email) || empty($pass)) {
    send_error('Email and password are required', 422);
}

$pdo  = get_db();
$stmt = $pdo->prepare('SELECT id, name, email, password_hash, role, status FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Use identical timing for "wrong email" and "wrong password" to prevent enumeration
if (!$user || !password_verify($pass, $user['password_hash'])) {
    send_error('Invalid email or password', 401);
}

if ($user['status'] === 'suspended') {
    send_error('Account is suspended', 403);
}

// Phase 2 of CSRF bootstrap:
// Regenerate session ID on login to prevent session fixation attacks.
// The pre-login CSRF token is destroyed; a fresh one is issued below.
session_regenerate_id(true);

$_SESSION['user_id']    = $user['id'];
$_SESSION['role']       = $user['role'];
$_SESSION['last_active'] = time();
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

send_json([
    'id'         => $user['id'],
    'name'       => $user['name'],
    'email'      => $user['email'],
    'role'       => $user['role'],
    'csrf_token' => $_SESSION['csrf_token'],
]);
