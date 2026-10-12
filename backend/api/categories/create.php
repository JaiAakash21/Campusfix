<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

require_auth(['admin']);
verify_csrf();

$body        = get_json_body();
$name        = trim($body['name']        ?? '');
$description = trim($body['description'] ?? '');

if (empty($name) || strlen($name) > 100) {
    send_error('Name is required (max 100 characters)', 422);
}

$pdo = get_db();

$chk = $pdo->prepare('SELECT id FROM categories WHERE name = ?');
$chk->execute([$name]);
if ($chk->fetch()) {
    send_error('Category name already exists', 409);
}

$ins = $pdo->prepare(
    'INSERT INTO categories (name, description) VALUES (?, ?)'
);
$ins->execute([$name, $description ?: null]);
$id = (int) $pdo->lastInsertId();

send_json(['id' => $id, 'name' => $name, 'description' => $description], 201);
