<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarInsurance extends Model
{
    use HasFactory;
    protected $fillable = [
        'car_id',
        'insurance_type_id',
    ];

    // Relations
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function insuranceType(): BelongsTo
    {
        return $this->belongsTo(InsuranceType::class);
    }
}