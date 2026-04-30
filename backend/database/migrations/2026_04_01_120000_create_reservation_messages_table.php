<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reservation_id');
            $table->unsignedBigInteger('sender_user_id')->nullable();
            $table->string('sender_role', 30);
            $table->text('message');
            $table->timestamps();

            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('cascade');
            $table->foreign('sender_user_id')->references('id')->on('users')->onDelete('set null');

            $table->index('reservation_id');
            $table->index('sender_role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_messages');
    }
};
