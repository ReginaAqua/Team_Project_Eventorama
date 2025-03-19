<?php
// backend/events.php

require_once __DIR__ . '/functions.php';
$config = require_once __DIR__ . '/../config/config.php';

$eventsFile = $config['events_file'];
$events = readJSON($eventsFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ADMIN ACTION: Delete or Edit event
    if (isset($_POST['adminAction'])) {
        $adminAction = sanitize($_POST['adminAction']);
        $eventId = sanitize($_POST['eventId']);
        $username = sanitize($_POST['username']); // should be checked for admin role in your implementation

        if ($adminAction === 'delete') {
            $found = false;
            foreach ($events as $key => $ev) {
                if ($ev['id'] === $eventId) {
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
                echo json_encode(['success' => true, 'message' => 'Event deleted.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete event.']);
            }
            exit;
        } elseif ($adminAction === 'edit') {
            $found = false;
            foreach ($events as &$ev) {
                if ($ev['id'] === $eventId) {
                    $found = true;
                    $ev['eventName']      = isset($_POST['eventName']) ? sanitize($_POST['eventName']) : $ev['eventName'];
                    $ev['date']           = isset($_POST['date']) ? sanitize($_POST['date']) : $ev['date'];
                    $ev['time']           = isset($_POST['time']) ? sanitize($_POST['time']) : $ev['time'];
                    $ev['description']    = isset($_POST['description']) ? sanitize($_POST['description']) : $ev['description'];
                    $ev['displayLocation']= isset($_POST['displayLocation']) ? sanitize($_POST['displayLocation']) : $ev['displayLocation'];
                    if (isset($_POST['lat'])) {
                        $ev['lat'] = sanitize($_POST['lat']);
                    }
                    if (isset($_POST['lon'])) {
                        $ev['lon'] = sanitize($_POST['lon']);
                    }
                    if (isset($_POST['location'])) {
                        $ev['location'] = sanitize($_POST['location']);
                    }
                    if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
                        $uploadsDir = __DIR__ . '/../public/uploads/';
                        $uniqueFilename = uniqid() . '_' . basename($_FILES['poster']['name']);
                        $targetFile = $uploadsDir . $uniqueFilename;
                        if (move_uploaded_file($_FILES['poster']['tmp_name'], $targetFile)) {
                            $ev['poster'] = 'uploads/' . $uniqueFilename;
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
                echo json_encode(['success' => true, 'message' => 'Event updated.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update event.']);
            }
            exit;
        }
    }
    // VOTE ACTION: Going/Thinking
    if (isset($_POST['vote'])) {
        $voteType = sanitize($_POST['vote']);
        $eventId = sanitize($_POST['eventId']);
        $username = sanitize($_POST['username']);

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
                    if (($key = array_search($username, $ev['thinking'])) !== false) {
                        unset($ev['thinking'][$key]);
                        $ev['thinking'] = array_values($ev['thinking']);
                    }
                } else {
                    if (!in_array($username, $ev['thinking'])) {
                        $ev['thinking'][] = $username;
                    }
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
    // CREATE EVENT
    else {
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

        // Handle poster
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
            'displayLocation'=> $displayLocation, // short address
            'lat'            => $lat,
            'lon'            => $lon,
            'location'       => $fullLoc,         // full address
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
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'get') {
        echo json_encode(['success' => true, 'events' => $events]);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid request.']);
exit;
