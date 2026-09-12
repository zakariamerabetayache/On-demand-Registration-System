<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Wilaya;
use App\Models\Commune;
use App\Models\Etablissement;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Role constants
    public const ROLE_ADMIN = 'admin';
    public const ROLE_NATIONAL_ADMIN = 'national_admin';
    public const ROLE_WILAYA_ADMIN = 'wilaya_admin';
    public const ROLE_PARTY_MEMBER = 'party_member';

    // State constants
    public const STATE_IN_WAITING = 'in_waiting';
    public const STATE_JOINED = 'joined';
    public const STATE_INACTIVE = 'inactive';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_ar',
        'nom_fr',
        'prenom_ar',
        'prenom_fr',
        'app_id',
        'role_id',
        'email',
        'password',
        'etablissement_id',
        'email_verified_at',
        'identity_image',
        'self_photo',
        'date_nais',
        'sex',
        'nb_crt',
        'nin',
        'adress',
        'wilaya_id',
        'commune_id',
        'wilaya_res_id',
        'commune_res_id',
        'telephone',
        'state',
        'personal_token',
        'referral_id',
        'referral_token',
        'function',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'app_id' => 'integer',
    ];

    /**
     * Get the etablissement that owns the user.
     */
    public function etablissement()
    {
        return $this->belongsTo(Etablissement::class);
    }

    /**
     * Get the user who referred this member.
     */
    public function referrer()
    {
        return $this->belongsTo(User::class, 'referral_id');
    }
   

    /**
     * Get the members referred by this user.
     */
    public function referrals()
    {
        return $this->hasMany(User::class, 'referral_id');
    }

    /**
     * Get the wilaya of birth.
     */
    public function wilaya()
    {
        return $this->belongsTo(Wilaya::class, 'wilaya_id');
    }

    /**
     * Get the commune of birth.
     */
    public function commune()
    {
        return $this->belongsTo(Commune::class, 'commune_id');
    }

    /**
     * Get the wilaya of residence.
     */
    public function wilayaRes()
    {
        return $this->belongsTo(Wilaya::class, 'wilaya_res_id');
    }

    /**
     * Get the commune of residence.
     */
    public function communeRes()
    {
        return $this->belongsTo(Commune::class, 'commune_res_id');
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role_id === self::ROLE_ADMIN;
    }

    /**
     * Check if the user is a national admin.
     */
    public function isNationalAdmin(): bool
    {
        return $this->role_id === self::ROLE_NATIONAL_ADMIN;
    }

    /**
     * Check if the user is a wilaya admin.
     */
    public function isWilayaAdmin(): bool
    {
        return $this->role_id === self::ROLE_WILAYA_ADMIN;
    }

    /**
     * Check if the user is a party member.
     */
    public function isPartyMember(): bool
    {
        return $this->role_id === self::ROLE_PARTY_MEMBER;
    }

    /**
     * Scope a query to only include party members.
     */
    public function scopePartyMembers($query)
    {
        return $query->where('role_id', self::ROLE_PARTY_MEMBER);
    }

    /**
     * Scope a query to only include users waiting for approval.
     */
    public function scopeWaiting($query)
    {
        return $query->where('state', self::STATE_IN_WAITING);
    }

    /**
     * Scope a query to only include joined members.
     */
    public function scopeJoined($query)
    {
        return $query->where('state', self::STATE_JOINED);
    }
}

