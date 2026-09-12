<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Wilaya;

class Commune extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'designation_ar',
        'designation_fr',
        'wilaya_id',
        'postalc',
    ];

    protected $casts = [
        'wilaya_id' => 'integer',
        'postalc' => 'integer',
    ];

    /**
     * Get the wilaya that owns the commune.
     */
    public function wilaya()
    {
        return $this->belongsTo(Wilaya::class);
    }
}
