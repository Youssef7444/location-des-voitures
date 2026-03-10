<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
    use HasFactory;
    protected $fillable = [
        'company_id',
        'category_id',
        'brand',
        'model',
        'type_car',
        'year',
        'color',
        'license_plate',
        'mileage',
        'fuel_type',
        'transmission',
        'seats',
        'price_per_day',
        'discount_percent',
        'available',
        'features',
        'description',
    ];

    protected $casts = [
        'features' => 'json',
    ];

    // Relations
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(CarImage::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(MaintenanceLog::class);
    }

    public function insurances(): HasMany
    {
        return $this->hasMany(CarInsurance::class);
    }
}
