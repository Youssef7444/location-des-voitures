<?php
// database/migrations/2024_01_13_000000_create_maintenance_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('car_id');
            $table->string('maintenance_type');
            $table->text('description')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->date('maintenance_date');
            $table->timestamps();
            
            // Foreign Key
            $table->foreign('car_id')->references('id')->on('cars')->onDelete('cascade');
            
            // Index
            $table->index('car_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_logs');
    }
};