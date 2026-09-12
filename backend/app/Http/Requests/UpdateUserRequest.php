<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
            'email' => [
                'required',
                'string',
                'email',
                Rule::unique('users', 'email')->ignore($this->route('user'))
            ],
            'password' => ['nullable', 'string', 'min:6', 'confirmed'],
            'nom_ar' => 'required|string|max:255|regex:/^[\p{Arabic}\s]+$/u',
            'nom_fr' => 'required|string|max:255|regex:/^[\p{Latin}\s\'\-\.]+$/u',
            'prenom_ar' => 'required|string|max:255|regex:/^[\p{Arabic}\s]+$/u',
            'prenom_fr' => 'required|string|max:255|regex:/^[\p{Latin}\s\'\-\.]+$/u',
            'wilaya_id' => 'required|integer|exists:wilayas,id',
            'commune_id' => 'required|integer|exists:communes,id',
        ];

        // Conditional rules for Party Members
        if ($roleId === 'party_member') {
            $rules = array_merge($rules, [
                'nin' => 'required|string|size:18',
                'adress' => 'required|string',
                'telephone' => 'required|string|max:20',
                'wilaya_res_id' => 'required|integer|exists:wilayas,id',
                'commune_res_id' => 'required|integer|exists:communes,id',
                'date_nais' => 'required|date',
                'sex' => 'required|in:0,1',
                'nb_crt' => 'required|string|max:10',
                'function' => 'nullable|string|max:255',
            ]);
        }

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
