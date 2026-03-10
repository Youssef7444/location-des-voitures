<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'car_id',
        'start_date',
        'end_date',
        'total_days',
        'total_price',
        'status',
        'payment_method',
        'payment_status',
        'pickup_location',
        'dropoff_location',
        'driver_license_number',
        'special_requests',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    // Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Backward compatibility alias
    public function payment(): HasMany
    {
        return $this->payments();
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function damageReports(): HasMany
    {
        return $this->hasMany(DamageReport::class);
    }
}
