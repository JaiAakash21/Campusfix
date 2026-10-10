<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$user = require_auth();

$name = basename($_GET['name'] ?? '');  // basename strips any path traversal

if (empty($name) || !preg_match('/^[0-9a-f]{32}\.(jpg|png)$/i', $name)) {
    send_error('Invalid file name', 400);
}

$pdo  = get_db();
$stmt = $pdo->prepare(
    'SELECT fa.*, t.submitter_id, t.assigned_to
     FROM file_attachments fa
     JOIN tickets t ON t.id = fa.ticket_id
     WHERE fa.stored_name = ?'
);
$stmt->execute([$name]);
$row = $stmt->fetch();

if (!$row) {
    send_error('File not found', 404);
}

// Ownership — same rules as ticket detail
if ($user['role'] === 'student' && (int)$row['submitter_id'] !== (int)$user['id']) {
    send_error('Forbidden', 403);
}
if ($user['role'] === 'staff' && (int)$row['assigned_to'] !== (int)$user['id']) {
    send_error('Forbidden', 403);
}

$path = __DIR__ . '/uploads/' . $name;

if (!is_file($path)) {
    send_error('File not found on disk', 404);
}

header('Content-Type: '         . $row['mime_type']);
header('Content-Length: '       . filesize($path));
header('Content-Disposition: inline; filename="' . rawurlencode($row['original_name']) . '"');
header('Cache-Control: private, max-age=3600');
header('X-Content-Type-Options: nosniff');

readfile($path);
exit;
