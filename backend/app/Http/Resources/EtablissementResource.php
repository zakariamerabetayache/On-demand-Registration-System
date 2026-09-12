<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EtablissementResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'designation_ar' => $this->designation_ar,
            'designation_fr' => $this->designation_fr,
            'logo' => $this->logo,
            'wilaya_id' => $this->wilaya_id,
            'commune_id' => $this->commune_id,
           
            'adress' => $this->adress,
            'email' => $this->email,
            'verificationby' => $this->verificationby,
            'change_token' => $this->change_token,
            'validation_by' => $this->validation_by,
            'app_name' => $this->app_name,
            'hero_title' => $this->hero_title,
            'hero_description' => $this->hero_description,
            'primary_color' => $this->primary_color,
            'wilaya_designation_ar' => $this->wilaya ? $this->wilaya->designation_ar : null,
            'wilaya_designation_fr' => $this->wilaya ? $this->wilaya->designation_fr : null,
            'commune_designation_ar' => $this->commune ? $this->commune->designation_ar : null,
            'commune_designation_fr' => $this->commune ? $this->commune->designation_fr : null,
            'users_count' => $this->whenLoaded('users', function () {
                return $this->users->count();
            }),
            'wilaya' => $this->whenLoaded('wilaya'),
            'commune' => $this->whenLoaded('commune'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
