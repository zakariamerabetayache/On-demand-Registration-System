<?php
// Temporary file to check PHP version and configuration on hosting server
// Remove this file after checking

echo "<h2>PHP Version Information</h2>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>MySQL Extension:</strong> " . (extension_loaded('mysql') ? 'Yes' : 'No') . "</p>";
echo "<p><strong>MySQLi Extension:</strong> " . (extension_loaded('mysqli') ? 'Yes' : 'No') . "</p>";
echo "<p><strong>PDO MySQL:</strong> " . (extension_loaded('pdo_mysql') ? 'Yes' : 'No') . "</p>";

echo "<h3>Database Configuration</h3>";
echo "<p><strong>DB_CONNECTION:</strong> " . env('DB_CONNECTION') . "</p>";
echo "<p><strong>DB_HOST:</strong> " . env('DB_HOST') . "</p>";
echo "<p><strong>DB_PORT:</strong> " . env('DB_PORT') . "</p>";

echo "<h3>PDO Attributes (if using PDO)</h3>";
try {
    $pdo = new PDO('mysql:host=' . env('DB_HOST') . ';dbname=' . env('DB_DATABASE'), env('DB_USERNAME'), env('DB_PASSWORD'));
    echo "<p><strong>PDO::ATTR_EMULATE_PREPARES:</strong> " . ($pdo->getAttribute(PDO::ATTR_EMULATE_PREPARES) ? 'True' : 'False') . "</p>";
    echo "<p><strong>PDO::ATTR_STRINGIFY_FETCHES:</strong> " . ($pdo->getAttribute(PDO::ATTR_STRINGIFY_FETCHES) ? 'True' : 'False') . "</p>";
} catch (Exception $e) {
    echo "<p>Could not connect to database: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><em>Remember to delete this file after checking!</em></p>";
?>
