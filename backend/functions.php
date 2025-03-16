<?php
// backend/functions.php

/**
 * Read a JSON file and return its data as an array.
 */
function readJSON($filepath) {
    if (!file_exists($filepath)) {
        return [];
    }
    $json = file_get_contents($filepath);
    return json_decode($json, true) ?: [];
}

/**
 * Write an array to a JSON file.
 */
function writeJSON($filepath, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT);
    return file_put_contents($filepath, $json) !== false;
}

/**
 * Generate a unique ID.
 */
function generateId() {
    return uniqid();
}

/**
 * Sanitize input data.
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}
?>
