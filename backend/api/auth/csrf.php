<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

// Phase 1 of CSRF bootstrap: called before login/register while unauthenticated.
// Starts a temporary session and returns a CSRF token.
// Phase 2 happens in login.php: session_regenerate_id() + fresh token.

start_secure_session();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

send_json(['csrf_token' => $_SESSION['csrf_token']]);
