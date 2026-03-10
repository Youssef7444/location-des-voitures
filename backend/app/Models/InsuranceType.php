<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InsuranceType extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'description',
        'price_per_day',
        'coverage_details',
    ];

    protected $casts = [
        'coverage_details' => 'json',
    ];

    // Relations
    public function carInsurances(): HasMany
    {
        return $this->hasMany(CarInsurance::class);
    }
}