<?php
// backend/auth.php

require_once __DIR__ . '/functions.php';
$config = require_once __DIR__ . '/../config/config.php';

$usersFile = $config['users_file'];
$users = readJSON($usersFile);

// Process POST requests for login or registration.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';

    $username = isset($_POST['username']) ? sanitize($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : ''; // leave password raw

    if (!$username || !$password) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
        exit;
    }

    // Registration process
    if ($action === 'register') {
        // Check if user already exists.
        foreach ($users as $user) {
            if ($user['username'] === $username) {
                echo json_encode(['success' => false, 'message' => 'Username already exists.']);
                exit;
            }
        }
        // Create new user with a hashed password.
        $newUser = [
            'id' => generateId(),
            'username' => $username,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'role' => 'user' // default role
        ];
        $users[] = $newUser;
        if (writeJSON($usersFile, $users)) {
            echo json_encode(['success' => true, 'message' => 'Registration successful.', 'username' => $username]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to write user data.']);
        }
        exit;
    }

    // Login process
    if ($action === 'login') {
        foreach ($users as $user) {
            if ($user['username'] === $username && password_verify($password, $user['password'])) {
                echo json_encode(['success' => true, 'message' => 'Login successful.', 'username' => $username]);
                exit;
            }
        }
        echo json_encode(['success' => false, 'message' => 'Invalid credentials.']);
        exit;
    }

    // Unknown action
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}
?>
