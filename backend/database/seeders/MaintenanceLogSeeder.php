<?php

namespace Database\Seeders;

use App\Models\MaintenanceLog;
use Illuminate\Database\Seeder;

class MaintenanceLogSeeder extends Seeder
{
    public function run()
    {
        MaintenanceLog::factory(50)->create();
    }
}