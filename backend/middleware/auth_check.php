<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';

/**
 * Start a session with secure cookie settings.
 * Safe to call multiple times — skips if session is already active.
 */
function start_secure_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => (($_ENV['APP_ENV'] ?? 'development') === 'production'),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

/**
 * Verify the X-CSRF-Token header matches the session token.
 * Call on every POST/PATCH/DELETE endpoint.
 */
function verify_csrf(): void {
    $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $stored = $_SESSION['csrf_token'] ?? '';
    if (empty($header) || empty($stored) || !hash_equals($stored, $header)) {
        send_error('CSRF token invalid', 403);
    }
}

/**
 * Call at the top of every protected endpoint.
 * Execution order (Section 8 of plan):
 *   1. start_secure_session()
 *   2. check_idle_timeout()
 *   3. Session exists check
 *   4. Suspended account DB query
 *   5. Role check
 *
 * Returns the current user row from the DB.
 */
function require_auth(array $required_roles = []): array {
    start_secure_session();
    check_idle_timeout();

    if (empty($_SESSION['user_id'])) {
        send_error('Unauthenticated', 401);
    }

    // Live DB query — suspended accounts lose access on the very next request
    $pdo  = get_db();
    $stmt = $pdo->prepare('SELECT id, name, email, role, status FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] === 'suspended') {
        session_destroy();
        send_error('Account suspended or not found', 403);
    }

    if (!empty($required_roles) && !in_array($user['role'], $required_roles, true)) {
        send_error('Forbidden', 403);
    }

    return $user;
}

function check_idle_timeout(): void {
    $idle_limit = 1800;
    if (isset($_SESSION['last_active']) && (time() - $_SESSION['last_active']) > $idle_limit) {
        session_destroy();
        send_error('Session expired', 401);
    }
    $_SESSION['last_active'] = time();
}
