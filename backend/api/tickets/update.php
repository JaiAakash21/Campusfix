<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    send_error('Method not allowed', 405);
}

$user = require_auth(['staff', 'admin']);
verify_csrf();

$body = get_json_body();
$id   = (int) ($body['id'] ?? 0);

if ($id <= 0) {
    send_error('id is required', 422);
}

$pdo  = get_db();
$stmt = $pdo->prepare('SELECT * FROM tickets WHERE id = ?');
$stmt->execute([$id]);
$ticket = $stmt->fetch();

if (!$ticket) {
    send_error('Ticket not found', 404);
}

// Staff can only update tickets assigned to them
if ($user['role'] === 'staff' && (int)$ticket['assigned_to'] !== (int)$user['id']) {
    send_error('Forbidden', 403);
}

$new_status  = $body['status']      ?? null;
$assigned_to = array_key_exists('assigned_to', $body) ? $body['assigned_to'] : false;
$note        = trim($body['note']   ?? '');

// Validate status transition
$valid_statuses = ['open', 'in_progress', 'resolved', 'closed'];
if ($new_status !== null) {
    if (!in_array($new_status, $valid_statuses, true)) {
        send_error('Invalid status', 422);
    }
    // Staff cannot set open or closed — only admin can
    if ($user['role'] === 'staff' && !in_array($new_status, ['in_progress', 'resolved'], true)) {
        send_error('Staff may only set status to in_progress or resolved', 403);
    }
}

// Only admin can reassign
if ($assigned_to !== false && $user['role'] !== 'admin') {
    send_error('Only admin can reassign tickets', 403);
}

$pdo->beginTransaction();
try {
    $sets   = [];
    $params = [];

    if ($new_status !== null && $new_status !== $ticket['status']) {
        $sets[]   = 'status = ?';
        $params[] = $new_status;
        $sets[]   = 'updated_at = UTC_TIMESTAMP()';

        // Status change must be recorded in ticket_history in the same transaction
        $hist = $pdo->prepare(
            'INSERT INTO ticket_history (ticket_id, changed_by, old_status, new_status, note)
             VALUES (?, ?, ?, ?, ?)'
        );
        $hist->execute([
            $ticket['id'],
            $user['id'],
            $ticket['status'],
            $new_status,
            $note !== '' ? $note : null,
        ]);
    }

    if ($assigned_to !== false) {
        $sets[]   = 'assigned_to = ?';
        $params[] = ($assigned_to === null) ? null : (int)$assigned_to;
        $sets[]   = 'updated_at = UTC_TIMESTAMP()';
    }

    if (!empty($sets)) {
        // Deduplicate 'updated_at = UTC_TIMESTAMP()' if added twice
        $sets     = array_unique($sets);
        $params[] = $ticket['id'];
        $pdo->prepare(
            'UPDATE tickets SET ' . implode(', ', $sets) . ' WHERE id = ?'
        )->execute($params);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    send_error('Failed to update ticket', 500);
}

send_json(['success' => true]);
