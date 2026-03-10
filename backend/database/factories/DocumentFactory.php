<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'document_type' => $this->faker->randomElement(['driver_license', 'passport', 'insurance', 'contract']),
            'file_path' => 'documents/' . $this->faker->word() . '.pdf',
            'expiry_date' => $this->faker->dateTimeBetween('+1 month', '+5 years'),
            'verified' => false,
        ];
    }
}
