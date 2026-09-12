<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('check_in_outs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checker_id')->constrained('users');
            $table->foreignId('child_id')->constrained('children');
            $table->date('date'); // Check-in/out date
            $table->time('hour'); // Check-in/out time
            $table->integer('type')->default(0); // 0 = check-in, 1 = check-out
            $table->integer('state')->default(0); // 0 = unchecked, 1 = checked
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('check_in_outs');
    }
};
