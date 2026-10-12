<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/helpers.php';

try {
    $pdo = get_db();
    $pdo->query('SELECT 1');
    send_json(['status' => 'ok', 'db' => 'ok']);
} catch (Throwable $e) {
    send_json(['status' => 'error', 'db' => 'error'], 503);
}
