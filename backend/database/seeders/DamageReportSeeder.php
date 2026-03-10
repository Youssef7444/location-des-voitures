<?php

namespace Database\Seeders;

use App\Models\DamageReport;
use Illuminate\Database\Seeder;

class DamageReportSeeder extends Seeder
{
    public function run()
    {
        DamageReport::factory(30)->create();
    }
}