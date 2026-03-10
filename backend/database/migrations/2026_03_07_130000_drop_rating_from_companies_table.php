<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('companies', 'rating')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->dropColumn('rating');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('companies', 'rating')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->decimal('rating', 3, 2)->default(0);
            });
        }
    }
};

