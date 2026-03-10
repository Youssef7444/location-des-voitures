<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\Company;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CarFactory extends Factory
{
    protected $model = Car::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'category_id' => Category::factory(),
            'brand' => $this->faker->randomElement(['Toyota', 'BMW', 'Mercedes', 'Audi', 'Honda', 'Volkswagen', 'Renault', 'Peugeot']),
            'model' => $this->faker->word(),
            'type_car' => $this->faker->randomElement(['sedan', 'suv', 'truck', 'luxury', 'convertible', 'van']),
            'year' => $this->faker->year(),
            'color' => $this->faker->colorName(),
            'license_plate' => strtoupper($this->faker->bothify('??-###-??')),
            'mileage' => $this->faker->numberBetween(0, 100000),
            'fuel_type' => $this->faker->randomElement(['gasoline', 'diesel', 'electric', 'hybrid']),
            'transmission' => $this->faker->randomElement(['manual', 'automatic']),
            'seats' => $this->faker->numberBetween(2, 8),
            'price_per_day' => $this->faker->numberBetween(50, 200),
            'discount_percent' => $this->faker->numberBetween(0, 20),
            'available' => true,
            'features' => json_encode(['climatisation', 'GPS', 'Bluetooth', 'Caméra de recul']),
            'description' => $this->faker->sentence(),
        ];
    }
}
