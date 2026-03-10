<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\Company;
use Illuminate\Database\Seeder;

class CarSeeder extends Seeder
{
    public function run()
    {
        // Récupérer les entreprises existantes
        $companies = Company::all();

        if ($companies->isEmpty()) {
            echo "Aucune entreprise trouvée.\n";
            return;
        }

        // Créer 20 voitures par entreprise
        foreach ($companies as $company) {
            Car::factory(20)->create([
                'company_id' => $company->id,
            ]);
        }
    }
}