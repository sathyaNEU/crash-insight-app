<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DataController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// GET endpoint to fetch data from the incidents_view
Route::get('/v1/incidents', [DataController::class, 'getIncidents']);

// POST endpoint to load all dimensions and facts
Route::post('/v1/load', [DataController::class, 'loadData']);

Route::get('/v1/dashboard', [DataController::class, 'getDashboardMetrics']);
