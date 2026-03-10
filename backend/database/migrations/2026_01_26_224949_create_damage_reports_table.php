<?php
// database/migrations/2024_01_14_000000_create_damage_reports_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damage_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reservation_id');
            $table->text('description');
            $table->json('damage_photos')->nullable();
            $table->decimal('estimated_cost', 10, 2)->nullable();
            $table->enum('status', ['reported', 'under_review', 'approved', 'rejected'])->default('reported');
            $table->timestamps();
            
            // Foreign Key
            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('cascade');
            
            // Index
            $table->index('reservation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damage_reports');
    }
};