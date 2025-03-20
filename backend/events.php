<?php
// backend/events.php

require_once __DIR__ . '/functions.php';
$config = require_once __DIR__ . '/../config/config.php';

$eventsFile = $config['events_file'];
$events = readJSON($eventsFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // -------------------------------
    // EDIT EVENT: update an existing event
    // -------------------------------
    if (isset($_POST['action']) && $_POST['action'] === 'edit') {
        $eventId   = isset($_POST['eventId']) ? sanitize($_POST['eventId']) : '';
        $username  = isset($_POST['username']) ? sanitize($_POST['username']) : '';
        if (!$eventId || !$username) {
            echo json_encode(['success' => false, 'message' => 'Missing eventId or username.']);
            exit;
        }
        $found = false;
        foreach ($events as &$ev) {
            if ($ev['id'] === $eventId) {
                // Only allow event owner (or admin) to edit
                if ($ev['username'] !== $username) {
                    echo json_encode(['success' => false, 'message' => 'Unauthorized to edit this event.']);
                    exit;
                }
                $ev['eventName']       = isset($_POST['eventName']) ? sanitize($_POST['eventName']) : $ev['eventName'];
                $ev['date']            = isset($_POST['date']) ? sanitize($_POST['date']) : $ev['date'];
                $ev['time']            = isset($_POST['time']) ? sanitize($_POST['time']) : $ev['time'];
                $ev['description']     = isset($_POST['description']) ? sanitize($_POST['description']) : $ev['description'];
                $ev['displayLocation'] = isset($_POST['displayLocation']) ? sanitize($_POST['displayLocation']) : $ev['displayLocation'];
                $ev['lat']             = isset($_POST['lat']) ? sanitize($_POST['lat']) : $ev['lat'];
                $ev['lon']             = isset($_POST['lon']) ? sanitize($_POST['lon']) : $ev['lon'];
                $ev['location']        = isset($_POST['location']) ? sanitize($_POST['location']) : $ev['location'];

                // If a new poster is uploaded, update the poster field
                if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
                    $uploadsDir = __DIR__ . '/../public/uploads/';
                    $uniqueFilename = uniqid() . '_' . basename($_FILES['poster']['name']);
                    $targetFile = $uploadsDir . $uniqueFilename;
                    if (move_uploaded_file($_FILES['poster']['tmp_name'], $targetFile)) {
                        $ev['poster'] = 'uploads/' . $uniqueFilename;
                    }
                }
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => 'Event not found.']);
            exit;
        }
        if (writeJSON($eventsFile, $events)) {
            echo json_encode(['success' => true, 'message' => 'Event updated.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update event.']);
        }
        exit;
    }

    // -------------------------------
    // DELETE EVENT: remove an existing event
    // -------------------------------
    if (isset($_POST['action']) && $_POST['action'] === 'delete') {
        $eventId  = isset($_POST['eventId']) ? sanitize($_POST['eventId']) : '';
        $username = isset($_POST['username']) ? sanitize($_POST['username']) : '';
        if (!$eventId || !$username) {
            echo json_encode(['success' => false, 'message' => 'Missing eventId or username.']);
            exit;
        }
        $found = false;
        foreach ($events as $key => $ev) {
            if ($ev['id'] === $eventId) {
                // Only allow event owner (or admin) to delete
                if ($ev['username'] !== $username) {
                    echo json_encode(['success' => false, 'message' => 'You cannot delete this event.']);
                    exit;
                }
                unset($events[$key]);
                $events = array_values($events);
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => 'Event not found.']);
            exit;
        }
        if (writeJSON($eventsFile, $events)) {
            echo json_encode(['success' => true, 'message' => 'Event deleted!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete event.']);
        }
        exit;
    }

    // -------------------------------
    // VOTE ACTION: record "going" or "thinking" votes
    // -------------------------------
    if (isset($_POST['vote'])) {
        $voteType = isset($_POST['vote']) ? sanitize($_POST['vote']) : '';
        $eventId  = isset($_POST['eventId']) ? sanitize($_POST['eventId']) : '';
        $username = isset($_POST['username']) ? sanitize($_POST['username']) : '';
        if (!$eventId || !$username) {
            echo json_encode(['success' => false, 'message' => 'Missing eventId or username.']);
            exit;
        }
        $found = false;
        foreach ($events as &$ev) {
            if ($ev['id'] === $eventId) {
                $found = true;
                if (!in_array($voteType, ['going', 'thinking'])) {
                    echo json_encode(['success' => false, 'message' => 'Invalid vote type.']);
                    exit;
                }
                if (!isset($ev['going']) || !is_array($ev['going'])) {
                    $ev['going'] = [];
                }
                if (!isset($ev['thinking']) || !is_array($ev['thinking'])) {
                    $ev['thinking'] = [];
                }
                if ($voteType === 'going') {
                    if (!in_array($username, $ev['going'])) {
                        $ev['going'][] = $username;
                    }
                    // Remove user from thinking if present
                    if (($key = array_search($username, $ev['thinking'])) !== false) {
                        unset($ev['thinking'][$key]);
                        $ev['thinking'] = array_values($ev['thinking']);
                    }
                } else { // "thinking"
                    if (!in_array($username, $ev['thinking'])) {
                        $ev['thinking'][] = $username;
                    }
                    // Remove user from going if present
                    if (($key = array_search($username, $ev['going'])) !== false) {
                        unset($ev['going'][$key]);
                        $ev['going'] = array_values($ev['going']);
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

    // -------------------------------
    // CREATE EVENT: create a new event
    // -------------------------------
    $username    = isset($_POST['username']) ? sanitize($_POST['username']) : '';
    $eventName   = isset($_POST['eventName']) ? sanitize($_POST['eventName']) : '';
    $date        = isset($_POST['date']) ? sanitize($_POST['date']) : '';
    $time        = isset($_POST['time']) ? sanitize($_POST['time']) : '';
    $description = isset($_POST['description']) ? sanitize($_POST['description']) : '';
    $displayLocation = isset($_POST['displayLocation']) ? sanitize($_POST['displayLocation']) : '';
    $lat         = isset($_POST['lat']) ? sanitize($_POST['lat']) : '';
    $lon         = isset($_POST['lon']) ? sanitize($_POST['lon']) : '';
    $fullLoc     = isset($_POST['location']) ? sanitize($_POST['location']) : '';

    if (!$username || !$eventName || !$date || !$time || !$description) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        exit;
    }

    // Handle poster upload
    $posterPath = '';
    if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
        $uploadsDir = __DIR__ . '/../public/uploads/';
        $uniqueFilename = uniqid() . '_' . basename($_FILES['poster']['name']);
        $targetFile = $uploadsDir . $uniqueFilename;
        if (move_uploaded_file($_FILES['poster']['tmp_name'], $targetFile)) {
            $posterPath = 'uploads/' . $uniqueFilename;
        }
    }

    $newEvent = [
        'id'             => generateId(),
        'username'       => $username,
        'eventName'      => $eventName,
        'date'           => $date,
        'time'           => $time,
        'description'    => $description,
        'poster'         => $posterPath,
        'displayLocation'=> $displayLocation,
        'lat'            => $lat,
        'lon'            => $lon,
        'location'       => $fullLoc,
        'going'          => [],
        'thinking'       => [],
        'created_at'     => date("Y-m-d H:i:s")
    ];

    $events[] = $newEvent;
    if (writeJSON($eventsFile, $events)) {
        echo json_encode(['success' => true, 'message' => 'Event created.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save event.']);
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
