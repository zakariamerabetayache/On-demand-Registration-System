<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckInOut extends Model
{
    use HasFactory;

    protected $fillable = [
        'checker_id',
        'child_id',
        'date',
        'hour',
        'type',
        'state',
    ];

    protected $casts = [
        'checker_id' => 'integer',
        'child_id' => 'integer',
        'date' => 'date',
        'hour' => 'datetime:H:i',
        'type' => 'integer',
        'state' => 'integer',
    ];

    /**
     * Get the user (checker) that performed this check-in/out.
     */
    public function checker()
    {
        return $this->belongsTo(User::class, 'checker_id');
    }

    /**
     * Get the child that was checked in/out.
     */
    public function child()
    {
        return $this->belongsTo(Child::class, 'child_id');
    }
}
