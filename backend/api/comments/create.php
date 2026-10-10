<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

$user = require_auth();
verify_csrf();

$body      = get_json_body();
$ticket_id = (int) ($body['ticket_id'] ?? 0);
$comment   = trim($body['body']        ?? '');

if ($ticket_id <= 0) {
    send_error('ticket_id is required', 422);
}
if (empty($comment)) {
    send_error('Comment body is required', 422);
}

$pdo = get_db();

// Fetch ticket and verify the user has access to it
$stmt = $pdo->prepare('SELECT id, submitter_id, assigned_to FROM tickets WHERE id = ?');
$stmt->execute([$ticket_id]);
$ticket = $stmt->fetch();

if (!$ticket) {
    send_error('Ticket not found', 404);
}

// Ownership: student → own ticket only; staff → assigned ticket only; admin → any
if ($user['role'] === 'student' && (int)$ticket['submitter_id'] !== (int)$user['id']) {
    send_error('Forbidden', 403);
}
if ($user['role'] === 'staff' && (int)$ticket['assigned_to'] !== (int)$user['id']) {
    send_error('Forbidden', 403);
}

$ins = $pdo->prepare(
    'INSERT INTO comments (ticket_id, author_id, body) VALUES (?, ?, ?)'
);
$ins->execute([$ticket_id, $user['id'], $comment]);
$comment_id = (int) $pdo->lastInsertId();

send_json([
    'id'          => $comment_id,
    'ticket_id'   => $ticket_id,
    'author_id'   => $user['id'],
    'author_name' => $user['name'],
    'body'        => $comment,
    'created_at'  => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s'),
], 201);
