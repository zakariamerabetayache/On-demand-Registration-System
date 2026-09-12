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
        Schema::create('children', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->onDelete('cascade');
            $table->string('nom_ar');
            $table->string('nom_fr');
            $table->string('prenom_ar');
            $table->string('prenom_fr');
            $table->date('date_nais');
            $table->integer('sex')->default(0); // 0=male, 1=female
            $table->string('bloodsign')->nullable();
            $table->string('self_photo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('children');
    }
};
