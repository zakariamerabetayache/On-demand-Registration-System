<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'nom_ar' => $this->nom_ar,
            'nom_fr' => $this->nom_fr,
            'prenom_ar' => $this->prenom_ar,
            'prenom_fr' => $this->prenom_fr,
            'app_id' => $this->app_id,
            'role_id' => $this->role_id,
            'email' => $this->email,
            'etablissement_id' => $this->etablissement_id,
            'etablissement_designation' => $this->etablissement 
                ? ($this->etablissement->designation_fr ?? $this->etablissement->designation_ar) 
                : null,
       
           
           
            'etablissement' => new EtablissementResource($this->whenLoaded('etablissement')),
            'telephone' => $this->telephone,
            'nin' => $this->nin,
            'date_nais' => $this->date_nais,
            'sex' => $this->sex,
            'nb_crt' => $this->nb_crt,
            'adress' => $this->adress,
            'function' => $this->function,
            'state' => $this->state,
            'personal_token' => $this->personal_token,
            'identity_image' => $this->identity_image,
            'self_photo' => $this->self_photo,
            'referral_id' => $this->referral_id,
            'referral_token' => $this->referral_token,
            'wilaya_id' => $this->wilaya_id,
            'commune_id' => $this->commune_id,
            'wilaya_res_id' => $this->wilaya_res_id,
            'commune_res_id' => $this->commune_res_id,
            'wilaya_designation_ar' => $this->wilaya ? $this->wilaya->designation_ar : null,
            'commune_designation_ar' => $this->commune ? $this->commune->designation_ar : null,
            'wilaya_res_designation_ar' => $this->wilayaRes ? $this->wilayaRes->designation_ar : null,
            'commune_res_designation_ar' => $this->communeRes ? $this->communeRes->designation_ar : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'referrals_count' => $this->referrals_count,

        ];
    }
}
