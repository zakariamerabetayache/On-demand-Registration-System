<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Wilaya;
use App\Models\Commune;
use App\Models\Etablissement;
use App\Models\User;
use App\Models\Child;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Wilaya
        $wilaya = Wilaya::updateOrCreate(
            ['id' => 1],
            [
                'designation_ar' => 'سكيكدة',
                'designation_fr' => 'Skikda',
                'postalw' => 21000
            ]
        );

        // 2. Create Commune
        $commune = Commune::updateOrCreate(
            ['id' => 1],
            [
                'designation_ar' => 'كركرة',
                'designation_fr' => 'Kerkera',
                'wilaya_id' => $wilaya->id,
                'postalc' => 21019
            ]
        );

        // 3. Create Etablissement with all migration fields
        $etablissement = Etablissement::updateOrCreate(
            ['id' => 1],
            [
                'designation_ar' => 'جمعية العطاء الخيرية',
                'designation_fr' => 'Association Ataa Charitable',
                'logo' => null,
                'wilaya_id' => $wilaya->id,
                'commune_id' => $commune->id,
                'adress' => 'حي الأمل، الجزائر العاصمة',
                'email' => 'contact@ataa-asso.dz',
                'verificationby' => false,
                'change_token' => false,
                'validation_by' => 'watani',
                
                // White Label Themes for the NGO
                'app_name' => 'منصة الانخراط الرقمية',
                'hero_title' => 'كن جزءاً من التغيير، انضم إلينا اليوم',
                'hero_description' => 'ترحب جمعية العطاء بكل من يرغب في المساهمة الفعالة. انخرط معنا الآن لتعزيز العمل التطوعي والمشاركة في بناء مجتمع متكامل ومتضامن.',
                'primary_color' => '#0284c7', // Sky blue theme color for hope and community
            ]
        );

        // 4. Create Manager User
        User::updateOrCreate(
            ['email' => 'manager@gmail.com'],
            [
                'nom_fr' => 'Manager',
                'prenom_fr' => 'Test',
                'nom_ar' => 'مسير',
                'prenom_ar' => 'تجريبي',
                'password' => Hash::make('AAAAaa21.'),
                'role_id' => 'manager',
                'state' => 1,
                'email_verified_at' => Carbon::now(),
                'etablissement_id' => $etablissement->id,
                'app_id' => 0,
            ]
        );

     

     
    }
}
