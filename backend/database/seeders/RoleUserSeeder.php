<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Etablissement;
use App\Models\Wilaya;
use App\Models\Commune;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have at least one etablissement
        $etablissement = Etablissement::firstOrCreate(
            ['id' => 1],
            [
                'designation_ar' => 'المقر الرئيسي',
                'designation_fr' => 'Main Headquarters',
                'wilaya_id' => 16, // Algiers
                'commune_id' => 1601,
                'adress' => '123 Main St, Algiers',
                'email' => 'admin@system.dz',
                'app_name' => 'Registration System',
                'primary_color' => '#0284c7',
            ]
        );

        $defaultPassword = Hash::make('password123');

        $members = [
            ['nom_ar' => 'بن علي', 'nom_fr' => 'Benali', 'prenom_ar' => 'أحمد', 'prenom_fr' => 'Ahmed', 'sex' => 0, 'email' => 'ahmed.benali@example.com', 'wilaya' => 16, 'commune' => 1601],
            ['nom_ar' => 'منصوري', 'nom_fr' => 'Mansouri', 'prenom_ar' => 'فاطمة', 'prenom_fr' => 'Fatima', 'sex' => 1, 'email' => 'fatima.mansouri@example.com', 'wilaya' => 16, 'commune' => 1602],
            ['nom_ar' => 'بوزيد', 'nom_fr' => 'Bouzid', 'prenom_ar' => 'محمد', 'prenom_fr' => 'Mohamed', 'sex' => 0, 'email' => 'mohamed.bouzid@example.com', 'wilaya' => 21, 'commune' => 2101],
            ['nom_ar' => 'قاسم', 'nom_fr' => 'Kasmi', 'prenom_ar' => 'مريم', 'prenom_fr' => 'Meriem', 'sex' => 1, 'email' => 'meriem.kasmi@example.com', 'wilaya' => 31, 'commune' => 3101],
            ['nom_ar' => 'حداد', 'nom_fr' => 'Haddad', 'prenom_ar' => 'ياسين', 'prenom_fr' => 'Yacine', 'sex' => 0, 'email' => 'yacine.haddad@example.com', 'wilaya' => 25, 'commune' => 2501],
            ['nom_ar' => 'زروقي', 'nom_fr' => 'Zerrouki', 'prenom_ar' => 'أمل', 'prenom_fr' => 'Amel', 'sex' => 1, 'email' => 'amel.zerrouki@example.com', 'wilaya' => 19, 'commune' => 1901],
            ['nom_ar' => 'سعدي', 'nom_fr' => 'Saadi', 'prenom_ar' => 'كريم', 'prenom_fr' => 'Karim', 'sex' => 0, 'email' => 'karim.saadi@example.com', 'wilaya' => 5, 'commune' => 501],
            ['nom_ar' => 'براهيمي', 'nom_fr' => 'Brahimi', 'prenom_ar' => 'ليلى', 'prenom_fr' => 'Leila', 'sex' => 1, 'email' => 'leila.brahimi@example.com', 'wilaya' => 1, 'commune' => 101],
            ['nom_ar' => 'حميدي', 'nom_fr' => 'Hamidi', 'prenom_ar' => 'سمير', 'prenom_fr' => 'Samir', 'sex' => 0, 'email' => 'samir.hamidi@example.com', 'wilaya' => 16, 'commune' => 1601],
            ['nom_ar' => 'بلقاسم', 'nom_fr' => 'Belkacem', 'prenom_ar' => 'خديجة', 'prenom_fr' => 'Khadidja', 'sex' => 1, 'email' => 'khadidja.belkacem@example.com', 'wilaya' => 21, 'commune' => 2102],
            ['nom_ar' => 'عباس', 'nom_fr' => 'Abbas', 'prenom_ar' => 'رضا', 'prenom_fr' => 'Reda', 'sex' => 0, 'email' => 'reda.abbas@example.com', 'wilaya' => 31, 'commune' => 3101],
            ['nom_ar' => 'طاهري', 'nom_fr' => 'Tahiri', 'prenom_ar' => 'سارة', 'prenom_fr' => 'Sara', 'sex' => 1, 'email' => 'sara.tahiri@example.com', 'wilaya' => 25, 'commune' => 2502],
            ['nom_ar' => 'ملياني', 'nom_fr' => 'Miliani', 'prenom_ar' => 'عمر', 'prenom_fr' => 'Omar', 'sex' => 0, 'email' => 'omar.miliani@example.com', 'wilaya' => 19, 'commune' => 1901],
            ['nom_ar' => 'رحماني', 'nom_fr' => 'Rahmani', 'prenom_ar' => 'نادية', 'prenom_fr' => 'Nadia', 'sex' => 1, 'email' => 'nadia.rahmani@example.com', 'wilaya' => 5, 'commune' => 501],
            ['nom_ar' => 'سليماني', 'nom_fr' => 'Slimani', 'prenom_ar' => 'علي', 'prenom_fr' => 'Ali', 'sex' => 0, 'email' => 'ali.slimani@example.com', 'wilaya' => 1, 'commune' => 101],
            ['nom_ar' => 'امقران', 'nom_fr' => 'Amokrane', 'prenom_ar' => 'حنان', 'prenom_fr' => 'Haneen', 'sex' => 1, 'email' => 'haneen.amokrane@example.com', 'wilaya' => 16, 'commune' => 1602],
            ['nom_ar' => 'بوقرة', 'nom_fr' => 'Bouguerra', 'prenom_ar' => 'مراد', 'prenom_fr' => 'Mourad', 'sex' => 0, 'email' => 'mourad.bouguerra@example.com', 'wilaya' => 21, 'commune' => 2119],
            ['nom_ar' => 'بوعزيز', 'nom_fr' => 'Bouaziz', 'prenom_ar' => 'صبرينة', 'prenom_fr' => 'Sabrina', 'sex' => 1, 'email' => 'sabrina.bouaziz@example.com', 'wilaya' => 31, 'commune' => 3101],
            ['nom_ar' => 'لعرج', 'nom_fr' => 'Laradj', 'prenom_ar' => 'حمزة', 'prenom_fr' => 'Hamza', 'sex' => 0, 'email' => 'hamza.laradj@example.com', 'wilaya' => 25, 'commune' => 2501],
            ['nom_ar' => 'بلعيد', 'nom_fr' => 'Belaid', 'prenom_ar' => 'ليندة', 'prenom_fr' => 'Linda', 'sex' => 1, 'email' => 'linda.belaid@example.com', 'wilaya' => 19, 'commune' => 1901],
        ];

        foreach ($members as $index => $m) {
            User::updateOrCreate(
                ['email' => $m['email']],
                [
                    'nom_ar' => $m['nom_ar'],
                    'nom_fr' => $m['nom_fr'],
                    'prenom_ar' => $m['prenom_ar'],
                    'prenom_fr' => $m['prenom_fr'],
                    'sex' => $m['sex'],
                    'email' => $m['email'],
                    'password' => $defaultPassword,
                    'role_id' => User::ROLE_PARTY_MEMBER,
                    'state' => ($index % 2 == 0) ? User::STATE_JOINED : User::STATE_IN_WAITING,
                    'etablissement_id' => $etablissement->id,
                    'wilaya_id' => $m['wilaya'],
                    'commune_id' => $m['commune'],
                    'function' => 'Member Profile ' . ($index + 1),
                    'email_verified_at' => Carbon::now(),
                    'app_id' => 0,
                    'nin' => '1000000000000000' . ($index + 10),
                    'telephone' => '0661' . str_pad($index, 6, '0', STR_PAD_LEFT),
                ]
            );
        }

        $users = [
            [
                'email' => 'admin@system.dz',
                'nom_ar' => 'مدير',
                'nom_fr' => 'Admin',
                'prenom_ar' => 'النظام',
                'prenom_fr' => 'System',
                'role_id' => User::ROLE_ADMIN,
                'state' => User::STATE_JOINED,
                'function' => 'System Administrator',
                'sex' => 0,
            ],
            [
                'email' => 'national@system.dz',
                'nom_ar' => 'مسير',
                'nom_fr' => 'Manager',
                'prenom_ar' => 'وطني',
                'prenom_fr' => 'National',
                'role_id' => User::ROLE_NATIONAL_ADMIN,
                'state' => User::STATE_JOINED,
                'function' => 'National Coordinator',
                'sex' => 0,
            ],
            [
                'email' => 'wilaya@system.dz',
                'nom_ar' => 'مسير',
                'nom_fr' => 'Manager',
                'prenom_ar' => 'ولائي',
                'prenom_fr' => 'Wilaya',
                'role_id' => User::ROLE_WILAYA_ADMIN,
                'state' => User::STATE_JOINED,
                'function' => 'Wilaya Coordinator',
                'wilaya_id' => 16,
                'sex' => 0,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password' => $defaultPassword,
                    'etablissement_id' => $etablissement->id,
                    'email_verified_at' => Carbon::now(),
                    'app_id' => 0,
                    'nin' => '123456789012345678',
                    'telephone' => '0550000000',
                    'sex' => $userData['sex'] ?? 0,
                ])
            );
        }
    }
}
