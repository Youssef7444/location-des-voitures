<?php
// database/migrations/2024_01_05_000000_create_cars_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('category_id');
            $table->string('brand');
            $table->string('model');
            $table->year('year');
            $table->string('color')->nullable();
            $table->string('license_plate')->unique();
            $table->integer('mileage')->nullable();
            $table->enum('fuel_type', ['gasoline', 'diesel', 'electric', 'hybrid'])->default('gasoline');
            $table->enum('transmission', ['manual', 'automatic'])->default('manual');
            $table->tinyInteger('seats')->default(5);
            $table->decimal('price_per_day', 8, 2);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->boolean('available')->default(true);
            $table->json('features')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories');
            
            // Indexes
            $table->index('company_id');
            $table->index('available');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
