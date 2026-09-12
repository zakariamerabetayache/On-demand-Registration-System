<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'designation',
        'port',
        'ip_address',
        'etablissement_id',
    ];

    protected $casts = [
        'etablissement_id' => 'integer',
    ];

    /**
     * Get the etablissement that owns the device.
     */
    public function etablissement()
    {
        return $this->belongsTo(Etablissement::class);
    }
}
