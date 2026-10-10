<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$user = require_auth();
$pdo  = get_db();

$ref = trim($_GET['ref'] ?? '');
$id  = (int) ($_GET['id'] ?? 0);

if (empty($ref) && $id <= 0) {
    send_error('ref or id is required', 422);
}

// Fetch ticket
$where = $ref !== '' ? 't.ticket_ref = ?' : 't.id = ?';
$key   = $ref !== '' ? $ref : $id;

$stmt = $pdo->prepare(
    "SELECT t.*,
            c.name  AS category_name,
            u1.name AS submitter_name,
            u2.name AS assigned_name
     FROM tickets t
     JOIN categories c ON c.id = t.category_id
     JOIN users u1     ON u1.id = t.submitter_id
     LEFT JOIN users u2 ON u2.id = t.assigned_to
     WHERE {$where}"
);
$stmt->execute([$key]);
$ticket = $stmt->fetch();

if (!$ticket) {
    send_error('Ticket not found', 404);
}

// Ownership check — 403 not 404 to avoid leaking existence of other tickets
if ($user['role'] === 'student' && (int)$ticket['submitter_id'] !== (int)$user['id']) {
    send_error('Forbidden', 403);
}
if ($user['role'] === 'staff' && (int)$ticket['assigned_to'] !== (int)$user['id']) {
    send_error('Forbidden', 403);
}

// Fetch audit history
$hist = $pdo->prepare(
    'SELECT th.*, u.name AS changed_by_name
     FROM ticket_history th
     JOIN users u ON u.id = th.changed_by
     WHERE th.ticket_id = ?
     ORDER BY th.created_at ASC'
);
$hist->execute([$ticket['id']]);
$history = $hist->fetchAll();

// Fetch comments
$com = $pdo->prepare(
    'SELECT cm.*, u.name AS author_name
     FROM comments cm
     JOIN users u ON u.id = cm.author_id
     WHERE cm.ticket_id = ?
     ORDER BY cm.created_at ASC'
);
$com->execute([$ticket['id']]);
$comments = $com->fetchAll();

// Fetch attachment (one per ticket)
$att = $pdo->prepare(
    'SELECT id, original_name, stored_name, mime_type, size, created_at
     FROM file_attachments WHERE ticket_id = ?'
);
$att->execute([$ticket['id']]);
$attachment = $att->fetch() ?: null;

send_json([
    'ticket'     => $ticket,
    'history'    => $history,
    'comments'   => $comments,
    'attachment' => $attachment,
]);
