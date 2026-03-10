<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->string('type_car', 30)->nullable()->after('model');
            $table->index('type_car');
        });

        $categoryNamesById = DB::table('categories')->pluck('name', 'id');
        $cars = DB::table('cars')->get(['id', 'category_id']);

        foreach ($cars as $car) {
            $rawCategory = $categoryNamesById[$car->category_id] ?? '';
            DB::table('cars')
                ->where('id', $car->id)
                ->update(['type_car' => $this->resolveTypeFromCategory($rawCategory)]);
        }
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropIndex(['type_car']);
            $table->dropColumn('type_car');
        });
    }

    private function resolveTypeFromCategory(string $categoryName): string
    {
        $value = strtolower($categoryName);

        if (str_contains($value, 'suv')) {
            return 'suv';
        }

        if (str_contains($value, 'truck')) {
            return 'truck';
        }

        if (str_contains($value, 'lux')) {
            return 'luxury';
        }

        if (str_contains($value, 'convert')) {
            return 'convertible';
        }

        if (str_contains($value, 'van')) {
            return 'van';
        }

        return 'sedan';
    }
};
