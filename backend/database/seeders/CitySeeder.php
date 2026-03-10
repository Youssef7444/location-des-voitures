<?php

namespace Database\Seeders;

use App\Models\City;
use Illuminate\Database\Seeder;

class CitySeeder extends Seeder
{
    public function run()
    {
        $cities = [
            ['name' => 'Paris', 'country' => 'France'],
            ['name' => 'Lyon', 'country' => 'France'],
            ['name' => 'Marseille', 'country' => 'France'],
            ['name' => 'Toulouse', 'country' => 'France'],
            ['name' => 'Nice', 'country' => 'France'],
            ['name' => 'Alger', 'country' => 'Algérie'],
            ['name' => 'Oran', 'country' => 'Algérie'],
            ['name' => 'Constantine', 'country' => 'Algérie'],
            ['name' => 'Casablanca', 'country' => 'Maroc'],
            ['name' => 'Fès', 'country' => 'Maroc'],
        ];

        foreach ($cities as $city) {
            City::create($city);
        }
    }
}
