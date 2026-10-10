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

$body = get_json_body();
$name  = trim($body['name']  ?? '');
$email = trim($body['email'] ?? '');
$pass  = $body['password']   ?? '';

if (empty($name) || strlen($name) > 100) {
    send_error('Name is required (max 100 characters)', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
    send_error('Valid email is required', 422);
}
if (strlen($pass) < 8) {
    send_error('Password must be at least 8 characters', 422);
}

$pdo = get_db();

// Check email not already taken
$chk = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$chk->execute([$email]);
if ($chk->fetch()) {
    send_error('Email already registered', 409);
}

// Public registration always creates student accounts — never staff or admin
$hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
$ins  = $pdo->prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
);
$ins->execute([$name, $email, $hash, 'student']);
$id = (int) $pdo->lastInsertId();

send_json(['id' => $id, 'name' => $name, 'email' => $email, 'role' => 'student'], 201);
