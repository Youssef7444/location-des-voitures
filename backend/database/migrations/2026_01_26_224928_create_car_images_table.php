<?php
// database/migrations/2024_01_06_000000_create_car_images_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('car_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('car_id');
            $table->string('image_path');
            $table->boolean('is_main')->default(false);
            $table->timestamps();
            
            // Foreign Key
            $table->foreign('car_id')->references('id')->on('cars')->onDelete('cascade');
            
            // Index
            $table->index('car_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_images');
    }
};