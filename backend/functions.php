<?php
// functions.php

/**
 * Read JSON data from a file and return it as an associative array.
 */
function readJSON($filepath) {
    if (!file_exists($filepath)) {
        return [];
    }
    $json = file_get_contents($filepath);
    return json_decode($json, true) ?: [];
}

/**
 * Write an associative array as JSON data into a file.
 */
function writeJSON($filepath, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT);
    return file_put_contents($filepath, $json) !== false;
}

/**
 * Generate a unique identifier for events.
 */
function generateId() {
    return uniqid();
}

/**
 * Sanitize input to prevent XSS and other security issues.
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}
?>
