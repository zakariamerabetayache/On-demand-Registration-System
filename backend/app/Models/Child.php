<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Child extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'nom_ar',
        'nom_fr',
        'prenom_ar',
        'prenom_fr',
        'date_nais',
        'sex',
        'bloodsign',
        'self_photo',
    ];

    protected $casts = [
        'parent_id' => 'integer',
        'date_nais' => 'date',
        'sex' => 'integer',
    ];

    /**
     * Get the parent that owns this child.
     */
    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    /**
     * Get the payments for this child.
     */
    public function payments()
    {
        return $this->hasMany(Payment::class, 'child_id');
    }

    /**
     * Get the check-in/outs for this child.
     */
    public function checkInOuts()
    {
        return $this->hasMany(CheckInOut::class, 'child_id');
    }
    
}
