<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('cars', 'doors')) {
            Schema::table('cars', function (Blueprint $table) {
                $table->dropColumn('doors');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('cars', 'doors')) {
            Schema::table('cars', function (Blueprint $table) {
                $table->tinyInteger('doors')->default(4)->after('seats');
            });
        }
    }
};

