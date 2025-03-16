<?php
// backend/events.php

require_once __DIR__ . '/functions.php';
$config = require_once __DIR__ . '/../config/config.php';

$eventsFile = $config['events_file'];
$events = readJSON($eventsFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create a new event
    $eventName   = isset($_POST['eventName']) ? sanitize($_POST['eventName']) : '';
    $location    = isset($_POST['location']) ? sanitize($_POST['location']) : '';
    $date        = isset($_POST['date']) ? sanitize($_POST['date']) : '';
    $time        = isset($_POST['time']) ? sanitize($_POST['time']) : '';
    $description = isset($_POST['description']) ? sanitize($_POST['description']) : '';
    $username    = isset($_POST['username']) ? sanitize($_POST['username']) : '';

    // Basic validation
    if (!$eventName || !$location || !$date || !$time || !$description || !$username) {
        echo json_encode(['success' => false, 'message' => 'All fields except poster are required.']);
        exit;
    }

    // Handle file upload if present
    $posterPath = ''; // Default empty
    if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
        // Create a unique filename
        $uploadsDir = __DIR__ . '/../public/uploads/';
        $uniqueFilename = uniqid() . '_' . basename($_FILES['poster']['name']);
        $targetFile = $uploadsDir . $uniqueFilename;

        // Move the uploaded file
        if (move_uploaded_file($_FILES['poster']['tmp_name'], $targetFile)) {
            $posterPath = 'uploads/' . $uniqueFilename;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
            exit;
        }
    }

    // Build the new event array
    $newEvent = [
        'id'          => generateId(),
        'username'    => $username,
        'eventName'   => $eventName,
        'location'    => $location,
        'date'        => $date,
        'time'        => $time,
        'description' => $description,
        'poster'      => $posterPath,
        'going'       => 0,
        'thinking'    => 0,
        'created_at'  => date("Y-m-d H:i:s")
    ];

    $events[] = $newEvent;

    if (writeJSON($eventsFile, $events)) {
        echo json_encode(['success' => true, 'message' => 'Event created successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save event data.']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'get') {
        echo json_encode(['success' => true, 'events' => $events]);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid request.']);
exit;
