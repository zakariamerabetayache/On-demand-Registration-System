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
        if(!Schema::hasTable('users')){
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nom_ar');
            $table->string('nom_fr');
            $table->string('prenom_ar');
            $table->string('prenom_fr');
            $table->integer('app_id')->default(0);
            $table->string('role_id');
            $table->string('email')->unique()->nullable();
            $table->bigInteger('etablissement_id')->unsigned()->nullable();
            $table->foreign('etablissement_id')->references('id')->on('etablissements');
            $table->timestamp('email_verified_at');
            $table->string('password');
            $table->string('identity_image')->nullable();
            $table->string('self_photo')->nullable();
            $table->date('date_nais')->nullable();
            $table->integer('sex')->nullable(); // 0=male, 1=female
            $table->string('nb_crt')->nullable();
            $table->string('nin')->nullable(); // National ID
            $table->string('personal_token')->nullable();
            $table->bigInteger('referral_id')->unsigned()->nullable();
            $table->string('referral_token')->nullable();
            $table->text('adress')->nullable();
            $table->bigInteger('wilaya_id')->unsigned()->nullable();
            $table->bigInteger('commune_id')->unsigned()->nullable();
            $table->bigInteger('wilaya_res_id')->unsigned()->nullable(); // Residence wilaya
            $table->bigInteger('commune_res_id')->unsigned()->nullable(); // Residence commune
            $table->string('telephone')->nullable();
            $table->string('state')->default('in_waiting'); 
            $table->string('function');
            $table->foreign('wilaya_id')->references('id')->on('wilayas');
            $table->foreign('commune_id')->references('id')->on('communes');
            $table->foreign('wilaya_res_id')->references('id')->on('wilayas');
            $table->foreign('commune_res_id')->references('id')->on('communes');
            $table->foreign('referral_id')->references('id')->on('users');
            $table->timestamps();
        }); }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
