<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

require_auth(['admin']);

$pdo = get_db();

$stmt = $pdo->query(
    "SELECT
        t.ticket_ref,
        t.title,
        c.name   AS category,
        t.status,
        t.priority,
        u1.name  AS submitter,
        u1.email AS submitter_email,
        u2.name  AS assigned_to,
        t.created_at,
        t.updated_at
     FROM tickets t
     JOIN categories c ON c.id = t.category_id
     JOIN users u1     ON u1.id = t.submitter_id
     LEFT JOIN users u2 ON u2.id = t.assigned_to
     ORDER BY t.created_at DESC"
);

$filename = 'campusfix-export-' . gmdate('Ymd-His') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: no-cache, no-store');
header('X-Content-Type-Options: nosniff');

$out = fopen('php://output', 'w');
fputcsv($out, [
    'Ref', 'Title', 'Category', 'Status', 'Priority',
    'Submitter', 'Submitter Email', 'Assigned To',
    'Created At (UTC)', 'Updated At (UTC)',
]);

while ($row = $stmt->fetch()) {
    fputcsv($out, [
        $row['ticket_ref'],
        $row['title'],
        $row['category'],
        $row['status'],
        $row['priority'],
        $row['submitter'],
        $row['submitter_email'],
        $row['assigned_to'] ?? '',
        $row['created_at'],
        $row['updated_at'],
    ]);
}

fclose($out);
exit;
