<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Commandes personnalisées
Artisan::command('app:send-notifications', function () {
    $this->info('Sending notifications...');
    // Logique pour envoyer les notifications
})->purpose('Send pending notifications');

Artisan::command('app:cleanup-expired-reservations', function () {
    $this->info('Cleaning up expired reservations...');
    // Logique pour nettoyer les réservations expirées
})->purpose('Clean up expired reservations');

Artisan::command('app:generate-reports', function () {
    $this->info('Generating reports...');
    // Logique pour générer les rapports
})->purpose('Generate daily reports');