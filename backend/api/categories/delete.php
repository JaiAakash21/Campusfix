<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    send_error('Method not allowed', 405);
}

require_auth(['admin']);
verify_csrf();

$id = (int) ($_GET['id'] ?? 0);

if ($id <= 0) {
    send_error('id is required', 422);
}

$pdo  = get_db();
$stmt = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
$stmt->execute([$id]);
if (!$stmt->fetch()) {
    send_error('Category not found', 404);
}

// Refuse deletion if tickets still reference this category
$count = $pdo->prepare('SELECT COUNT(*) FROM tickets WHERE category_id = ?');
$count->execute([$id]);
if ((int)$count->fetchColumn() > 0) {
    send_error('Cannot delete: category has associated tickets', 409);
}

$pdo->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);

send_json(['success' => true]);
