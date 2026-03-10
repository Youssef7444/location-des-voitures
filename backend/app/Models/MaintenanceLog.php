<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceLog extends Model
{
    use HasFactory;
    protected $fillable = [
        'car_id',
        'maintenance_type',
        'description',
        'cost',
        'maintenance_date',
    ];

    protected $casts = [
        'maintenance_date' => 'date',
    ];

    // Relations
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}