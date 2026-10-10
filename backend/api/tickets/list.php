<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../utils/helpers.php';
require_once __DIR__ . '/../../../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$user = require_auth();

$pdo = get_db();

// Pagination
$page     = max(1, (int) ($_GET['page']     ?? 1));
$per_page = min(50, max(1, (int) ($_GET['per_page'] ?? 10)));
$offset   = ($page - 1) * $per_page;

// Filters
$status      = $_GET['status']      ?? '';
$category_id = (int) ($_GET['category_id'] ?? 0);
$priority    = $_GET['priority']    ?? '';
$q           = trim($_GET['q']      ?? '');

// Build WHERE clause
$where  = ['1=1'];
$params = [];

// Role-based visibility
if ($user['role'] === 'student') {
    $where[]  = 't.submitter_id = ?';
    $params[] = $user['id'];
} elseif ($user['role'] === 'staff') {
    $where[]  = 't.assigned_to = ?';
    $params[] = $user['id'];
}
// admin sees everything

if ($status && in_array($status, ['open', 'in_progress', 'resolved', 'closed'], true)) {
    $where[]  = 't.status = ?';
    $params[] = $status;
}
if ($category_id > 0) {
    $where[]  = 't.category_id = ?';
    $params[] = $category_id;
}
if ($priority && in_array($priority, ['low', 'medium', 'high'], true)) {
    $where[]  = 't.priority = ?';
    $params[] = $priority;
}
if ($q !== '') {
    $where[]  = '(t.title LIKE ? OR t.description LIKE ?)';
    $params[] = '%' . $q . '%';
    $params[] = '%' . $q . '%';
}

$where_sql = implode(' AND ', $where);

// Count total rows
$count_stmt = $pdo->prepare(
    "SELECT COUNT(*) FROM tickets t WHERE {$where_sql}"
);
$count_stmt->execute($params);
$total = (int) $count_stmt->fetchColumn();

// Fetch page
$sort = $_GET['sort'] ?? 'created_at_desc';
$order = match($sort) {
    'created_at_asc'  => 't.created_at ASC',
    'updated_at_desc' => 't.updated_at DESC',
    'priority_desc'   => "FIELD(t.priority,'high','medium','low')",
    default           => 't.created_at DESC',
};

$stmt = $pdo->prepare(
    "SELECT t.id, t.ticket_ref, t.title, t.status, t.priority,
            t.created_at, t.updated_at,
            c.name AS category_name,
            u.name AS submitter_name,
            a.name AS assigned_name
     FROM tickets t
     JOIN categories c ON c.id = t.category_id
     JOIN users u      ON u.id = t.submitter_id
     LEFT JOIN users a ON a.id = t.assigned_to
     WHERE {$where_sql}
     ORDER BY {$order}
     LIMIT ? OFFSET ?"
);
$stmt->execute([...$params, $per_page, $offset]);
$tickets = $stmt->fetchAll();

send_json([
    'tickets' => $tickets,
    'meta'    => [
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $per_page,
        'total_pages' => (int) ceil($total / $per_page),
    ],
]);
