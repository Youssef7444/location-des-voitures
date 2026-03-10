<?php
// database/migrations/2024_01_12_000000_create_car_insurance_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('car_insurance', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('car_id');
            $table->unsignedBigInteger('insurance_type_id');
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('car_id')->references('id')->on('cars')->onDelete('cascade');
            $table->foreign('insurance_type_id')->references('id')->on('insurance_types')->onDelete('cascade');
            
            // Indexes
            $table->index('car_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_insurance');
    }
};