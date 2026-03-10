<?php

namespace Database\Factories;

use App\Models\MaintenanceLog;
use App\Models\Car;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaintenanceLogFactory extends Factory
{
    protected $model = MaintenanceLog::class;

    public function definition()
    {
        return [
            'car_id' => Car::factory(),
            'maintenance_type' => $this->faker->randomElement(['oil_change', 'tire_rotation', 'inspection', 'repair']),
            'description' => $this->faker->paragraph(),
            'cost' => $this->faker->numberBetween(50, 500),
            'maintenance_date' => $this->faker->dateTime(),
        ];
    }
}