<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Commune;

class Wilaya extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'designation_ar',
        'designation_fr',
        'postalw',
    ];

    protected $casts = [
        'postalw' => 'integer',
    ];

    /**
     * Get the communes for the wilaya.
     */
    public function communes()
    {
        return $this->hasMany(Commune::class);
    }
}
