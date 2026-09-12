<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommuneResource extends JsonResource
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
            'wilaya_id' => $this->wilaya_id,
            'postalc' => $this->postalc,
            'wilaya_designation_ar' => $this->wilaya?->designation_ar,
            'wilaya_designation_fr' => $this->wilaya?->designation_fr,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
