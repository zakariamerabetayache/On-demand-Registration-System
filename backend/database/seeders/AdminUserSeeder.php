<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'nom_fr' => 'Admin',
                'prenom_fr' => 'Global',
                'nom_ar' => 'مدير',
                'prenom_ar' => 'عام',
                'password' => Hash::make('AAAAaa21.'),
                'role_id' => 'admin',
                'email_verified_at' => Carbon::now(),
                'app_id' => 0,
            ]
        );
    }
}
