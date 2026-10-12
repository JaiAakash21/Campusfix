<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$user = require_auth();

// Return the current user + fresh CSRF token for Phase 2 of the bootstrap
send_json([
    'id'         => $user['id'],
    'name'       => $user['name'],
    'email'      => $user['email'],
    'role'       => $user['role'],
    'csrf_token' => $_SESSION['csrf_token'],
]);
