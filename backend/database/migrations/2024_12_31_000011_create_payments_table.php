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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('child_id')->nullable()->constrained('children');
            $table->decimal('amount', 10, 2); // Amount with 2 decimal places
            $table->date('date'); // Payment date
            $table->string('pdf_path')->nullable(); // Path to payment receipt PDF
            $table->integer('state')->default(0); // 0=pending, 1=completed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
