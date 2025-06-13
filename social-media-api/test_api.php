<?php

/**
 * Simple API test script
 * Run with: php test_api.php
 */

$baseUrl = 'http://localhost:8000/api';

function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $headers[] = 'Content-Type: application/json';
    }
    
    if ($headers) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'body' => json_decode($response, true)
    ];
}

echo "Testing Social Media API...\n\n";

// Test health check
echo "1. Testing health check...\n";
$response = makeRequest($baseUrl . '/health');
echo "Status: " . $response['status'] . "\n";
echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";

// Test login with demo user
echo "2. Testing login with demo user...\n";
$loginData = [
    'email' => 'demo@example.com',
    'password' => 'password123'
];

$response = makeRequest($baseUrl . '/login', 'POST', $loginData);
echo "Status: " . $response['status'] . "\n";

if ($response['status'] === 200 && isset($response['body']['data']['access_token'])) {
    $token = $response['body']['data']['access_token'];
    echo "Login successful! Token obtained.\n\n";
    
    // Test getting user profile
    echo "3. Testing get user profile...\n";
    $headers = ['Authorization: Bearer ' . $token];
    $response = makeRequest($baseUrl . '/user', 'GET', null, $headers);
    echo "Status: " . $response['status'] . "\n";
    echo "User: " . json_encode($response['body']['data']['user'], JSON_PRETTY_PRINT) . "\n\n";
    
    // Test getting social media profiles
    echo "4. Testing get social media profiles...\n";
    $response = makeRequest($baseUrl . '/social-media-profiles', 'GET', null, $headers);
    echo "Status: " . $response['status'] . "\n";
    echo "Profiles count: " . $response['body']['data']['total'] . "\n";
    echo "Profiles: " . json_encode($response['body']['data']['profiles'], JSON_PRETTY_PRINT) . "\n\n";
    
    // Test getting profiles by platform
    echo "5. Testing get profiles by platform...\n";
    $response = makeRequest($baseUrl . '/social-media-profiles-by-platform', 'GET', null, $headers);
    echo "Status: " . $response['status'] . "\n";
    echo "Platforms: " . json_encode($response['body']['data']['platforms'], JSON_PRETTY_PRINT) . "\n\n";
    
} else {
    echo "Login failed!\n";
    echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";
}

echo "API testing completed!\n";