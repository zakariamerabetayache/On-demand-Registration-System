<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Wilaya;
use App\Models\Commune;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            [
                'id' => 1,
                'designation_ar' => 'أدرار',
                'designation_fr' => 'Adrar',
                'postalw' => 1000,
                'communes' => [
                    ['id' => 101, 'designation_ar' => 'أدرار', 'designation_fr' => 'Adrar', 'postalc' => 1000],
                ]
            ],
            [
                'id' => 16,
                'designation_ar' => 'الجزائر',
                'designation_fr' => 'Alger',
                'postalw' => 16000,
                'communes' => [
                    ['id' => 1601, 'designation_ar' => 'الجزائر الوسطى', 'designation_fr' => 'Alger Centre', 'postalc' => 16000],
                    ['id' => 1602, 'designation_ar' => 'سيدي امحمد', 'designation_fr' => 'Sidi M\'Hamed', 'postalc' => 16001],
                ]
            ],
            [
                'id' => 21,
                'designation_ar' => 'سكيكدة',
                'designation_fr' => 'Skikda',
                'postalw' => 21000,
                'communes' => [
                    ['id' => 2101, 'designation_ar' => 'سكيكدة', 'designation_fr' => 'Skikda', 'postalc' => 21000],
                    ['id' => 2102, 'designation_ar' => 'فلفلة', 'designation_fr' => 'Filfila', 'postalc' => 21001],
                    ['id' => 2119, 'designation_ar' => 'كركرة', 'designation_fr' => 'Kerkera', 'postalc' => 21019],
                ]
            ],
            [
                'id' => 31,
                'designation_ar' => 'وهران',
                'designation_fr' => 'Oran',
                'postalw' => 31000,
                'communes' => [
                    ['id' => 3101, 'designation_ar' => 'وهران', 'designation_fr' => 'Oran', 'postalc' => 31000],
                ]
            ],
            [
                'id' => 25,
                'designation_ar' => 'قسنطينة',
                'designation_fr' => 'Constantine',
                'postalw' => 25000,
                'communes' => [
                    ['id' => 2501, 'designation_ar' => 'قسنطينة', 'designation_fr' => 'Constantine', 'postalc' => 25000],
                    ['id' => 2502, 'designation_ar' => 'الخروب', 'designation_fr' => 'El Khroub', 'postalc' => 25001],
                ]
            ],
            [
                'id' => 5,
                'designation_ar' => 'باتنة',
                'designation_fr' => 'Batna',
                'postalw' => 5000,
                'communes' => [
                    ['id' => 501, 'designation_ar' => 'باتنة', 'designation_fr' => 'Batna', 'postalc' => 5000],
                ]
            ],
            [
                'id' => 19,
                'designation_ar' => 'سطيف',
                'designation_fr' => 'Sétif',
                'postalw' => 19000,
                'communes' => [
                    ['id' => 1901, 'designation_ar' => 'سطيف', 'designation_fr' => 'Sétif', 'postalc' => 19000],
                ]
            ],
        ];

        foreach ($locations as $locData) {
            $communes = $locData['communes'];
            unset($locData['communes']);
            
            $wilaya = Wilaya::updateOrCreate(['id' => $locData['id']], $locData);
            
            foreach ($communes as $comData) {
                $comData['wilaya_id'] = $wilaya->id;
                Commune::updateOrCreate(['id' => $comData['id']], $comData);
            }
        }
    }
}
