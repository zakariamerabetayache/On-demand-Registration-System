<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Wilaya;
use App\Models\Commune;
use App\Models\User;

class Etablissement extends Model
{
    use HasFactory;

    protected $fillable = [
        'designation_ar',
        'designation_fr',
        'logo',
        'wilaya_id',
        'commune_id',
        'adress',
        'email',
        'verificationby',
        'change_token',
        'validation_by',
        'app_name',
        'hero_title',
        'hero_description',
        'primary_color',
    ];

    protected $casts = [
        'wilaya_id' => 'integer',
        'commune_id' => 'integer',
        'verificationby' => 'boolean',
        'change_token' => 'boolean',
    ];

    /**
     * Get the wilaya that owns the etablissement.
     */
    public function wilaya()
    {
        return $this->belongsTo(Wilaya::class);
    }

    /**
     * Get the commune that owns the etablissement.
     */
    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }

    /**
     * Get the users for the etablissement.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

}
