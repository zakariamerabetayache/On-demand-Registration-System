<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'type' => (int) $this->type,
            'type_label' => $this->type == 0 ? 'أمر بإستدعاء' : 'إدراج ملف',
            'state' => (int) $this->state,
            'state_label' => $this->getStateLabel(),
            'pdf_path' => $this->pdf_path,
            'pdf_state' => (int) $this->pdf_state,
            'pdf_state_label' => $this->getPdfStateLabel(),
            'parent_id' => $this->parent_id,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            // Relationships
            'parent' => $this->whenLoaded('parent', function () {
                if ($this->parent) {
                    return [
                        'id' => $this->parent->id,
                        'nom_ar' => $this->parent->nom_ar,
                        'prenom_ar' => $this->parent->prenom_ar,
                        'email' => $this->parent->email,
                    ];
                }
                return null;
            }),
            
            'user' => $this->whenLoaded('user', function () {
                if ($this->user) {
                    return [
                        'id' => $this->user->id,
                        'nom_ar' => $this->user->nom_ar,
                        'prenom_ar' => $this->user->prenom_ar,
                        'role_id' => $this->user->role_id,
                    ];
                }
                return null;
            }),
        ];
    }
    
    /**
     * Get state label in Arabic
     */
    private function getStateLabel(): string
    {
        return match($this->state) {
            0 => 'تم الإرسال', // Sent
            1 => 'تم الحضور', // Attended
            2 => 'تم الإلغاء', // Cancelled
            default => 'غير محدد', // Undefined
        };
    }
    
    /**
     * Get PDF state label in Arabic
     */
    private function getPdfStateLabel(): string
    {
        return match($this->pdf_state) {
            0 => 'لم يتم رفع ملف', // No file uploaded
            1 => 'تم رفع ملف', // File uploaded
            2 => 'تم قبول الملف', // File accepted
            default => 'غير محدد', // Undefined
        };
    }
}
