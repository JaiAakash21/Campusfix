<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';

// Categories are readable by anyone (used in the ticket submission form)
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$pdo  = get_db();
$stmt = $pdo->query(
    'SELECT id, name, description, created_at FROM categories ORDER BY name ASC'
);

send_json(['categories' => $stmt->fetchAll()]);
