<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Facades\Storage;

class Company extends Model
{
    use HasFactory;

    protected $appends = [
        'logo_url',
    ];

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'logo',
        'address',
        'city',
        'latitude',
        'longitude',
        'phone',
        'email',
        'website',
        'status',
        'subscription_end_date',
    ];
    
    protected $casts = [
        'subscription_end_date' => 'date',
    ];
    
    // Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    public function reservations(): HasManyThrough
    {
        return $this->hasManyThrough(Reservation::class, Car::class);
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) {
            return null;
        }

        if (str_starts_with($this->logo, 'http://') || str_starts_with($this->logo, 'https://')) {
            return $this->logo;
        }

        return Storage::disk(config('filesystems.public_upload_disk', 'public'))->url($this->logo);
    }
}
