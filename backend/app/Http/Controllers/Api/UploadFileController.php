<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class UploadFileController extends Controller
{
    /**
     * Whitelisted models allowed for upload
     * Add here the models you want to support.
     */
    protected $modelMap = [
        'user'        => \App\Models\User::class,
        'etudiant'    => \App\Models\Etudiant::class,
        'professeur'  => \App\Models\Professeur::class,
        'parentorder' => \App\Models\ParentOrder::class,
        'payment'     => \App\Models\Payment::class,
        'child'       => \App\Models\Child::class,
        'morafik'     => \App\Models\Morafik::class,
        'checkinout'  => \App\Models\CheckInOut::class,
    ];

    /**
     * Generic file upload handler.
     *
     * @param  Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadFile(Request $request, $id)
    {
        try {
            // ✅ 1. Validate input
            $validator = Validator::make($request->all(), [
                'pdf'     => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240', // 10MB
                'modal'   => 'required|string',
                'storage' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            // ✅ 2. Check if the modal is allowed
            $modalKey = strtolower($request->modal);

            if (!array_key_exists($modalKey, $this->modelMap)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid model type: ' . $modalKey,
                    'allowed_models' => array_keys($this->modelMap)
                ], 400);
            }

            $modelClass = $this->modelMap[$modalKey];

            // ✅ 3. Find the record
            $holder = $modelClass::find($id);

            if (!$holder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found for ID: ' . $id,
                ], 404);
            }

            // ✅ 4. Delete old file if exists
            if (isset($holder->pdf_path) && $holder->pdf_path && Storage::disk('public')->exists($holder->pdf_path)) {
                Storage::disk('public')->delete($holder->pdf_path);
            }

            // ✅ 5. Store new file in the given folder
            $file = $request->file('pdf');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = time() . '_' . uniqid() . '.' . $extension;
            
            $path = $file->storeAs($request->storage, $fileName, 'public');

            // ✅ 6. Update model record
            $updateData = ['pdf_path' => $path];
            
            // // For ParentOrder, also update pdf_state to 1 (uploaded)
            if ($modalKey === 'parentorder') {
                $updateData['pdf_state'] = 1;
            }
            
            // // For Payment, also update state to 1 (completed)
            // if ($modalKey === 'payment') {
            //     $updateData['state'] = 1;
            // }
            
            $holder->update($updateData);

            // ✅ 7. Return success response
            return response()->json([
                'success' => true,
                'message' => 'تم رفع الملف بنجاح',
                'data'    => [
                    'id'            => $holder->id,
                    'pdf_path'      => $path,
                    'file_name'     => $fileName,
                    'original_name' => $originalName,
                    'model'         => $modalKey,
                    'storage'       => $request->storage,
                    'file_url'      => Storage::disk('public')->url($path),
                    'updated_record' => $holder->fresh()
                ],
            ]);
            
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('File upload error: ' . $e->getMessage(), [
                'id' => $id,
                'modal' => $request->modal ?? 'unknown',
                'storage' => $request->storage ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء رفع الملف',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
