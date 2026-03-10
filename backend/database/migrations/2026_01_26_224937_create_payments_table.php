<?php
// database/migrations/2024_01_10_000000_create_payments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reservation_id');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['credit_card', 'cash', 'bank_transfer', 'paypal', 'stripe'])->default('credit_card');
            $table->string('transaction_id')->unique()->nullable();
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            
            // Foreign Key
            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('cascade');
            
            // Indexes
            $table->index('reservation_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};