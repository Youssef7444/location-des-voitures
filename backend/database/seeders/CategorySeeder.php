<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            ['name' => 'Économique', 'description' => 'Voitures petites et économiques', 'icon' => 'economic.png'],
            ['name' => 'Berline', 'description' => 'Voitures berlines confortables', 'icon' => 'sedan.png'],
            ['name' => 'SUV', 'description' => 'Véhicules tout-terrain spacieux', 'icon' => 'suv.png'],
            ['name' => 'Monospace', 'description' => 'Voitures familiales spacieuses', 'icon' => 'minivan.png'],
            ['name' => 'Coupé', 'description' => 'Voitures sportives élégantes', 'icon' => 'coupe.png'],
            ['name' => 'Cabriolet', 'description' => 'Voitures décapotables', 'icon' => 'convertible.png'],
            ['name' => 'Break', 'description' => 'Voitures breaks spacieuses', 'icon' => 'break.png'],
            ['name' => 'Utilitaire', 'description' => 'Véhicules utilitaires', 'icon' => 'van.png'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}