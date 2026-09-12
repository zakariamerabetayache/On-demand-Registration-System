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
        Schema::create('etablissements', function (Blueprint $table) {
            $table->id();
            $table->string('designation_ar');
            $table->string('designation_fr');
            $table->string('logo')->nullable();
            $table->foreignId('wilaya_id')->constrained('wilayas');
            $table->foreignId('commune_id')->constrained('communes');
            $table->text('adress')->nullable();
            $table->string('email')->nullable(); // Email address            
            $table->boolean('verificationby')->default(false);
            $table->boolean('change_token')->default(false);
            $table->enum('validation_by', ['wilayi', 'watani'])->default('watani');
            
            // White Labeling Fields
            $table->string('app_name')->nullable();
            $table->string('hero_title')->nullable();
            $table->text('hero_description')->nullable();
            $table->string('primary_color')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('etablissements');
    }
};
