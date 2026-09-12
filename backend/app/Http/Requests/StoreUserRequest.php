<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $roleId = $this->input('role_id', -1);
        
        $rules = [
            'role_id' => 'required|string|in:admin,national_admin,wilaya_admin,party_member',
            'email' => 'required|string|email|unique:users,email',
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'nom_ar' => 'required|string|max:255|regex:/^[\p{Arabic}\s]+$/u',
            'nom_fr' => 'required|string|max:255|regex:/^[\p{Latin}\s\'\-\.]+$/u',
            'prenom_ar' => 'required|string|max:255|regex:/^[\p{Arabic}\s]+$/u',
            'prenom_fr' => 'required|string|max:255|regex:/^[\p{Latin}\s\'\-\.]+$/u',
            'wilaya_id' => 'required|integer|exists:wilayas,id',
            'commune_id' => 'required|integer|exists:communes,id',
        ];

        // Conditional rules for Party Members (matching signup requirements)
        if ($roleId === 'party_member') {
            $rules = array_merge($rules, [
                'telephone' => 'nullable|string|max:20',
                'nin' => 'required|string|size:18',
                'adress' => 'required|string',
                'wilaya_res_id' => 'required|integer|exists:wilayas,id',
                'commune_res_id' => 'required|integer|exists:communes,id',
                'date_nais' => 'required|date',
                'sex' => 'required|in:0,1',
                'nb_crt' => 'required|string|max:10',
                'function' => 'nullable|string|max:255',
                'identity_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'self_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
        }

        // Etablissement is not required for root admin or national admin usually
        if (!in_array($roleId, ['admin'])) {
            $rules['etablissement_id'] = 'nullable|integer|exists:etablissements,id';
        }
        
        return $rules;
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nom_ar.regex' => 'الاسم بالعربية يجب أن يحتوي على أحرف عربية فقط',
            'nom_fr.regex' => 'الاسم بالفرنسية يجب أن يحتوي على أحرف لاتينية فقط',
            'prenom_ar.regex' => 'اللقب بالعربية يجب أن يحتوي على أحرف عربية فقط',
            'prenom_fr.regex' => 'اللقب بالفرنسية يجب أن يحتوي على أحرف لاتينية فقط',
        ];
    }
}
