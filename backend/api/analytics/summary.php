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

// Status counts
$counts = $pdo->query(
    "SELECT
        SUM(status = 'open')        AS open_count,
        SUM(status = 'in_progress') AS in_progress_count,
        SUM(status = 'resolved')    AS resolved_count,
        SUM(status = 'closed')      AS closed_count,
        COUNT(*)                    AS total
     FROM tickets"
)->fetch();

// Average resolution time in hours — excludes unresolved tickets
$avg_row = $pdo->query(
    "SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) AS avg_hours
     FROM tickets
     WHERE status IN ('resolved', 'closed')"
)->fetch();
$avg_hours = $avg_row['avg_hours'] !== null
    ? round((float)$avg_row['avg_hours'], 1)
    : null;

// Tickets by category
$by_category = $pdo->query(
    "SELECT c.name, COUNT(t.id) AS count
     FROM tickets t
     JOIN categories c ON c.id = t.category_id
     GROUP BY c.id, c.name
     ORDER BY count DESC"
)->fetchAll();

// Tickets submitted per month (last 6 months)
$by_month = $pdo->query(
    "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM tickets
     WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 MONTH)
     GROUP BY month
     ORDER BY month ASC"
)->fetchAll();

// Open tickets per staff member (for workload view)
$by_staff = $pdo->query(
    "SELECT u.name, COUNT(t.id) AS count
     FROM tickets t
     JOIN users u ON u.id = t.assigned_to
     WHERE t.status IN ('open', 'in_progress')
     GROUP BY u.id, u.name
     ORDER BY count DESC"
)->fetchAll();

send_json([
    'open_count'          => (int)$counts['open_count'],
    'in_progress_count'   => (int)$counts['in_progress_count'],
    'resolved_count'      => (int)$counts['resolved_count'],
    'closed_count'        => (int)$counts['closed_count'],
    'total'               => (int)$counts['total'],
    'avg_resolution_hours'=> $avg_hours,
    'tickets_by_category' => $by_category,
    'tickets_by_month'    => $by_month,
    'open_by_staff'       => $by_staff,
]);
