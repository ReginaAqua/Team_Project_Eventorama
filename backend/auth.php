<?php
// backend/auth.php

require_once __DIR__ . '/functions.php';
$config = require_once __DIR__ . '/../config/config.php';

$usersFile = $config['users_file'];
$users = readJSON($usersFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    $username = isset($_POST['username']) ? sanitize($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    if (!$username || !$password) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
        exit;
    }

    // Prevent registration of reserved username "admin"
    if ($action === 'register' && strtolower($username) === 'admin') {
        echo json_encode(['success' => false, 'message' => 'The username "admin" is reserved.']);
        exit;
    }

    if ($action === 'register') {
        // Check if user already exists.
        foreach ($users as $user) {
            if ($user['username'] === $username) {
                echo json_encode(['success' => false, 'message' => 'Username already exists.']);
                exit;
            }
        }
        // Create new user with a hashed password and default role "user"
        $newUser = [
            'id' => generateId(),
            'username' => $username,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'role' => 'user'
        ];
        $users[] = $newUser;
        if (writeJSON($usersFile, $users)) {
            echo json_encode([
                'success' => true,
                'message' => 'Registration successful.',
                'username' => $username,
                'role' => 'user'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to write user data.']);
        }
        exit;
    }

    if ($action === 'login') {
        foreach ($users as $user) {
            if ($user['username'] === $username && password_verify($password, $user['password'])) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful.',
                    'username' => $username,
                    'role' => $user['role']
                ]);
                exit;
            }
        }
        echo json_encode(['success' => false, 'message' => 'Invalid credentials.']);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}
?>
