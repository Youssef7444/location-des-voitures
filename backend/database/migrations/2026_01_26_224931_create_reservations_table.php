<?php
// database/migrations/2024_01_07_000000_create_reservations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('car_id');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('total_days');
            $table->decimal('total_price', 10, 2);
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->enum('payment_method', ['credit_card', 'cash', 'bank_transfer'])->default('credit_card');
            $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending');
            $table->string('pickup_location')->nullable();
            $table->string('dropoff_location')->nullable();
            $table->string('driver_license_number')->nullable();
            $table->text('special_requests')->nullable();
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('car_id')->references('id')->on('cars')->onDelete('cascade');
            
            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};