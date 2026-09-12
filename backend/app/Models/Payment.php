<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'child_id',
        'amount',
        'date',
        'pdf_path',
        'state',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'child_id' => 'integer',
        'amount' => 'decimal:2',
        'date' => 'date',
        'state' => 'integer',
    ];

    /**
     * Get the user (parent) that owns this payment.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the parent that owns this payment (alias for user).
     */
    public function parent()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the child that this payment is for.
     */
    public function child()
    {
        return $this->belongsTo(Child::class, 'child_id');
    }
}
