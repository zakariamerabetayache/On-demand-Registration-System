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
        if(!Schema::hasTable('communes')){
        Schema::create('communes', function (Blueprint $table) {
            $table->id();
            $table->string('designation_ar');
            $table->string('designation_fr');
            $table->bigInteger('wilaya_id')->unsigned();
            $table->integer('postalc');
            $table->foreign('wilaya_id')->references('id')->on('wilayas');
            $table->timestamps();
        }); }
    }

    
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communes');
    }
};
