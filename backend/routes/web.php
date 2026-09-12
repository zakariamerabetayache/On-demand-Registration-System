<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/
Route::get('/update-autoloader', function () {
    $output = [];
    $returnCode = null;

    exec('cd ' . base_path() . ' && composer dump-autoload', $output, $returnCode);

    if ($returnCode === 0) {
        return 'Autoloader updated successfully';
    } else {
        return 'Error updating autoloader: ' . implode("\n", $output);
    }
});
//call artisan console commands
Route::get('/linkstorage', function () {
    Artisan::call('storage:link'); // this will do the command line job
});
Route::get('/clearstorage', function () {
    Artisan::call('storage:unlink'); // this will do the command line job
});

Route::get('/migrate', function (){
    $output = \Artisan::call('migrate', ['--verbose' => true]);
    \Log::info($output);
    return 'Migration log written to log file';
});

Route::get('/', function () {
    return view('welcome');
});
