<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    send_error('Method not allowed', 405);
}

require_auth(['admin']);
verify_csrf();

$body        = get_json_body();
$id          = (int) ($body['id']          ?? 0);
$name        = isset($body['name'])        ? trim($body['name'])        : null;
$description = isset($body['description']) ? trim($body['description']) : null;

if ($id <= 0) {
    send_error('id is required', 422);
}

$pdo  = get_db();
$stmt = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
$stmt->execute([$id]);
if (!$stmt->fetch()) {
    send_error('Category not found', 404);
}

$sets   = [];
$params = [];

if ($name !== null) {
    if (empty($name) || strlen($name) > 100) {
        send_error('Name must be 1–100 characters', 422);
    }
    // Check uniqueness (excluding current)
    $chk = $pdo->prepare('SELECT id FROM categories WHERE name = ? AND id != ?');
    $chk->execute([$name, $id]);
    if ($chk->fetch()) {
        send_error('Category name already exists', 409);
    }
    $sets[]   = 'name = ?';
    $params[] = $name;
}
if ($description !== null) {
    $sets[]   = 'description = ?';
    $params[] = $description !== '' ? $description : null;
}

if (empty($sets)) {
    send_error('Nothing to update', 422);
}

$params[] = $id;
$pdo->prepare(
    'UPDATE categories SET ' . implode(', ', $sets) . ' WHERE id = ?'
)->execute($params);

send_json(['success' => true]);
