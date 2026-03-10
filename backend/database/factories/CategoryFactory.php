<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition()
    {
        $categories = ['Économique', 'Berline', 'SUV', 'Monospace', 'Coupé', 'Cabriolet', 'Break', 'Utilitaire'];

        return [
            'name' => $this->faker->randomElement($categories),
            'description' => $this->faker->sentence(),
            'icon' => 'car-icon.png',
        ];
    }
}