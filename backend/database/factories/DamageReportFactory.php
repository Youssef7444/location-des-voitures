<?php

namespace Database\Factories;

use App\Models\DamageReport;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

class DamageReportFactory extends Factory
{
    protected $model = DamageReport::class;

    public function definition()
    {
        return [
            'reservation_id' => Reservation::factory(),
            'description' => $this->faker->paragraph(),
            'damage_photos' => json_encode(['photo1.jpg', 'photo2.jpg']),
            'estimated_cost' => $this->faker->numberBetween(100, 2000),
            'status' => $this->faker->randomElement(['reported', 'under_review', 'approved', 'rejected']),
        ];
    }
}