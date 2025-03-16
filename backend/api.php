<?php
// backend/api.php

/**
 * Simple API router. Use the URL parameter `endpoint` to choose:
 * - ?endpoint=auth   (for authentication: login/register)
 * - ?endpoint=events (for event actions)
 */
if (!isset($_GET['endpoint'])) {
    echo json_encode(['success' => false, 'message' => 'Endpoint not specified.']);
    exit;
}

$endpoint = $_GET['endpoint'];

switch ($endpoint) {
    case 'auth':
        require_once __DIR__ . '/auth.php';
        break;
    case 'events':
        require_once __DIR__ . '/events.php';
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Unknown endpoint.']);
        break;
}
?>
