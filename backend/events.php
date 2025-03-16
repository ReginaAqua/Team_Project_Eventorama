<?php
// backend/events.php

require_once __DIR__ . '/functions.php';
$config = require_once __DIR__ . '/../config/config.php';

$eventsFile = $config['events_file'];
$events = readJSON($eventsFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ADMIN ACTIONS: Edit or Delete event (only allowed if user is admin)
    if (isset($_POST['adminAction'])) {
        $adminAction = sanitize($_POST['adminAction']);
        $eventId = sanitize($_POST['eventId']);
        $username = sanitize($_POST['username']); // username sent from client

        // Load users to check role
        $users = readJSON($config['users_file']);
        $adminUser = null;
        foreach ($users as $user) {
            if ($user['username'] === $username) {
                $adminUser = $user;
                break;
            }
        }
        // Verify the user's role is "admin"
        if (!$adminUser || strtolower($adminUser['role']) !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
            exit;
        }

        if ($adminAction === 'delete') {
            $found = false;
            foreach ($events as $key => $event) {
                if ($event['id'] === $eventId) {
                    $found = true;
                    unset($events[$key]);
                    $events = array_values($events);
                    break;
                }
            }
            if (!$found) {
                echo json_encode(['success' => false, 'message' => 'Event not found.']);
                exit;
            }
            if (writeJSON($eventsFile, $events)) {
                echo json_encode(['success' => true, 'message' => 'Event deleted successfully.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete event.']);
            }
            exit;
        }
        elseif ($adminAction === 'edit') {
            $found = false;
            foreach ($events as &$event) {
                if ($event['id'] === $eventId) {
                    $found = true;
                    $event['eventName'] = isset($_POST['eventName']) ? sanitize($_POST['eventName']) : $event['eventName'];
                    $event['location'] = isset($_POST['location']) ? sanitize($_POST['location']) : $event['location'];
                    $event['date'] = isset($_POST['date']) ? sanitize($_POST['date']) : $event['date'];
                    $event['time'] = isset($_POST['time']) ? sanitize($_POST['time']) : $event['time'];
                    $event['description'] = isset($_POST['description']) ? sanitize($_POST['description']) : $event['description'];
                    // Optional poster update:
                    if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
                        $uploadsDir = __DIR__ . '/../public/uploads/';
                        $uniqueFilename = uniqid() . '_' . basename($_FILES['poster']['name']);
                        $targetFile = $uploadsDir . $uniqueFilename;
                        if (move_uploaded_file($_FILES['poster']['tmp_name'], $targetFile)) {
                            $event['poster'] = 'uploads/' . $uniqueFilename;
                        }
                    }
                    break;
                }
            }
            if (!$found) {
                echo json_encode(['success' => false, 'message' => 'Event not found.']);
                exit;
            }
            if (writeJSON($eventsFile, $events)) {
                echo json_encode(['success' => true, 'message' => 'Event updated successfully.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update event.']);
            }
            exit;
        }
    }

    // VOTE ACTION: (for non-admin users)
    if (isset($_POST['vote'])) {
        $voteType = sanitize($_POST['vote']); // Expected "going" or "thinking"
        $eventId = sanitize($_POST['eventId']);
        $username = sanitize($_POST['username']);

        $found = false;
        foreach ($events as &$event) {
            if ($event['id'] === $eventId) {
                $found = true;
                if (!in_array($voteType, ['going', 'thinking'])) {
                    echo json_encode(['success' => false, 'message' => 'Invalid vote type.']);
                    exit;
                }
                if (!isset($event['going']) || !is_array($event['going'])) {
                    $event['going'] = [];
                }
                if (!isset($event['thinking']) || !is_array($event['thinking'])) {
                    $event['thinking'] = [];
                }
                if ($voteType === 'going') {
                    if (!in_array($username, $event['going'])) {
                        $event['going'][] = $username;
                    }
                    if (($key = array_search($username, $event['thinking'])) !== false) {
                        unset($event['thinking'][$key]);
                        $event['thinking'] = array_values($event['thinking']);
                    }
                } elseif ($voteType === 'thinking') {
                    if (!in_array($username, $event['thinking'])) {
                        $event['thinking'][] = $username;
                    }
                    if (($key = array_search($username, $event['going'])) !== false) {
                        unset($event['going'][$key]);
                        $event['going'] = array_values($event['going']);
                    }
                }
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => 'Event not found.']);
            exit;
        }
        if (writeJSON($eventsFile, $events)) {
            echo json_encode(['success' => true, 'message' => 'Vote recorded.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update vote.']);
        }
        exit;
    }
    else {
        // EVENT CREATION (for non-admin users)
        $eventName   = isset($_POST['eventName']) ? sanitize($_POST['eventName']) : '';
        $location    = isset($_POST['location']) ? sanitize($_POST['location']) : '';
        $date        = isset($_POST['date']) ? sanitize($_POST['date']) : '';
        $time        = isset($_POST['time']) ? sanitize($_POST['time']) : '';
        $description = isset($_POST['description']) ? sanitize($_POST['description']) : '';
        $username    = isset($_POST['username']) ? sanitize($_POST['username']) : '';

        if (!$eventName || !$location || !$date || !$time || !$description || !$username) {
            echo json_encode(['success' => false, 'message' => 'All fields except poster are required.']);
            exit;
        }

        $posterPath = '';
        if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
            $uploadsDir = __DIR__ . '/../public/uploads/';
            $uniqueFilename = uniqid() . '_' . basename($_FILES['poster']['name']);
            $targetFile = $uploadsDir . $uniqueFilename;
            if (move_uploaded_file($_FILES['poster']['tmp_name'], $targetFile)) {
                $posterPath = 'uploads/' . $uniqueFilename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
                exit;
            }
        }

        $newEvent = [
            'id'          => generateId(),
            'username'    => $username,
            'eventName'   => $eventName,
            'location'    => $location,
            'date'        => $date,
            'time'        => $time,
            'description' => $description,
            'poster'      => $posterPath,
            'going'       => [],
            'thinking'    => [],
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
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'get') {
        echo json_encode(['success' => true, 'events' => $events]);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid request.']);
exit;
