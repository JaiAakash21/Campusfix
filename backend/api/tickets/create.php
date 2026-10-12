<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/helpers.php';
require_once __DIR__ . '/../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

$user = require_auth(['student']);
verify_csrf();

// Read fields from $_POST (multipart/form-data for file support)
$title       = trim($_POST['title']       ?? '');
$description = trim($_POST['description'] ?? '');
$category_id = (int) ($_POST['category_id'] ?? 0);
$priority    = $_POST['priority'] ?? 'medium';

if (empty($title) || strlen($title) > 255) {
    send_error('Title is required (max 255 characters)', 422);
}
if (empty($description)) {
    send_error('Description is required', 422);
}
if ($category_id <= 0) {
    send_error('Category is required', 422);
}
if (!in_array($priority, ['low', 'medium', 'high'], true)) {
    send_error('Priority must be low, medium, or high', 422);
}

$pdo = get_db();

// Verify category exists
$catChk = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
$catChk->execute([$category_id]);
if (!$catChk->fetch()) {
    send_error('Category not found', 404);
}

// Handle optional file upload
$file_data = handle_file_upload(__DIR__ . '/../../files/uploads');

$pdo->beginTransaction();
try {
    $ref = generate_ticket_ref($pdo);

    $ins = $pdo->prepare(
        'INSERT INTO tickets (ticket_ref, title, description, category_id, submitter_id, priority)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $ins->execute([$ref, $title, $description, $category_id, $user['id'], $priority]);
    $ticket_id = (int) $pdo->lastInsertId();

    // Record initial creation in the audit log
    $hist = $pdo->prepare(
        'INSERT INTO ticket_history (ticket_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, NULL, ?, ?)'
    );
    $hist->execute([$ticket_id, $user['id'], 'open', 'Ticket submitted']);

    if ($file_data !== null) {
        $fa = $pdo->prepare(
            'INSERT INTO file_attachments (ticket_id, original_name, stored_name, mime_type, size)
             VALUES (?, ?, ?, ?, ?)'
        );
        $fa->execute([
            $ticket_id,
            $file_data['original_name'],
            $file_data['stored_name'],
            $file_data['mime_type'],
            $file_data['size'],
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    if (isset($file_data['stored_name'])) {
        @unlink(__DIR__ . '/../../files/uploads/' . $file_data['stored_name']);
    }
    send_error('Failed to create ticket', 500);
}

send_json(['id' => $ticket_id, 'ticket_ref' => $ref], 201);

// ─── helpers ──────────────────────────────────────────────────────────────────

function generate_ticket_ref(PDO $pdo): string {
    $date   = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Ymd');
    $prefix = "CF-{$date}-";

    // FOR UPDATE locks the row so concurrent inserts cannot choose the same number
    $stmt = $pdo->prepare(
        'SELECT ticket_ref FROM tickets
         WHERE ticket_ref LIKE ?
         ORDER BY ticket_ref DESC
         LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([$prefix . '%']);
    $last = $stmt->fetchColumn();

    $next = ($last === false)
        ? 1
        : (int) substr($last, strrpos($last, '-') + 1) + 1;

    return $prefix . str_pad((string)$next, 4, '0', STR_PAD_LEFT);
}

function handle_file_upload(string $uploads_dir): ?array {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        send_error('File upload failed (code ' . $_FILES['file']['error'] . ')', 400);
    }

    if ($_FILES['file']['size'] > 2 * 1024 * 1024) {
        send_error('File too large — maximum is 2 MB', 400);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($_FILES['file']['tmp_name']);

    if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
        send_error('Only JPEG and PNG images are allowed', 400);
    }

    $ext         = $mime === 'image/jpeg' ? 'jpg' : 'png';
    $stored_name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest        = $uploads_dir . DIRECTORY_SEPARATOR . $stored_name;

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
        send_error('Failed to save uploaded file', 500);
    }

    return [
        'original_name' => basename($_FILES['file']['name']),
        'stored_name'   => $stored_name,
        'mime_type'     => $mime,
        'size'          => (int) $_FILES['file']['size'],
    ];
}
