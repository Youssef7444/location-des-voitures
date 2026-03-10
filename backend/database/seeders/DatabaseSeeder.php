<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            CitySeeder::class,
            CompanySeeder::class,
            CarSeeder::class,
            ReservationSeeder::class,
            ReviewSeeder::class,
            PaymentSeeder::class,
            NotificationSeeder::class,
            DocumentSeeder::class,
            MaintenanceLogSeeder::class,
            DamageReportSeeder::class,
        ]);
    }
}