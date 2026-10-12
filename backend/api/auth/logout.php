<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

start_secure_session();
verify_csrf();

// Destroy server-side session data
session_destroy();

// Expire the session cookie in the browser
setcookie(session_name(), '', [
    'expires'  => time() - 3600,
    'path'     => '/',
    'secure'   => (($_ENV['APP_ENV'] ?? 'development') === 'production'),
    'httponly' => true,
    'samesite' => 'Strict',
]);

send_json(['message' => 'Logged out']);
