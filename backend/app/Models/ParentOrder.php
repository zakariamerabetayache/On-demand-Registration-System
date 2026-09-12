<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'description',
        'parent_id',
        'user_id',
        'type',
        'state',
        'pdf_path',
        'pdf_state',
    ];

    protected $casts = [
        'type' => 'integer',
        'state' => 'integer',
        'pdf_state' => 'integer',
        'parent_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Get the parent that owns the order.
     */
    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    /** 
     * Get the user who created the order.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

}
