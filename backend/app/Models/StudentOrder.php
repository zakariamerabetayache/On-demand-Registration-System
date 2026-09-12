<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'description',
        'student_id',
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
        'student_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Get the student that owns the order.
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the user who created the order.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }


}
