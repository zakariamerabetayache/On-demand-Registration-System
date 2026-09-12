<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentOrder;
use App\Http\Resources\StudentOrderResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class StudentOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = StudentOrder::with(['student', 'user']);
        
        // Filter by creator user_id (show orders created by the logged-in user)
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        } elseif ($request->has('student_id')) {
            // Filter by student_id (show orders for a specific student)
            $query->where('student_id', $request->student_id);
        } else {
            // Default: filter by current authenticated user as creator
            $user = $request->user();
            if ($user) {
                $query->where('user_id', $user->id);
            } else {
                // If no authenticated user, return empty result
                $query->where('user_id', -1); // Non-existent user ID
            }
        } 
        
        // Filter by residence_id if provided
        if ($request->has('residence_id')) {
            $query->whereHas('student', function($q) use ($request) {
                $q->where('residence_id', $request->residence_id);
            });
        }
        
        // Search by student name (nom_ar + prenom_ar)
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->whereHas('student', function($q) use ($searchTerm) {
                $q->whereRaw("CONCAT(nom_ar, ' ', prenom_ar) LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("CONCAT(prenom_ar, ' ', nom_ar) LIKE ?", ["%{$searchTerm}%"])
                  ->orWhere('nb_inscription', 'LIKE', "%{$searchTerm}%");
            });
        }
        
        // Filter by type
        if ($request->has('type') && $request->type !== null) {
            $query->where('type', $request->type);
        }
        
        // Filter by state
        if ($request->has('state') && $request->state !== null) {
            $query->where('state', $request->state);
        }
        
        // Pagination
        $perPage = $request->get('per_page', 10);
        $studentOrders = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => StudentOrderResource::collection($studentOrders->items()),
            'meta' => [
                'current_page' => $studentOrders->currentPage(),
                'per_page' => $studentOrders->perPage(),
                'total' => $studentOrders->total(),
                'last_page' => $studentOrders->lastPage(),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'required|string|max:1000',
            'student_id' => 'required|exists:users,id',
            'user_id' => 'required|exists:users,id',
            'type' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $studentOrder = StudentOrder::create([
            'description' => $request->description,
            'student_id' => $request->student_id,
            'user_id' => $request->user_id,
            'type' => $request->type,
            'state' => 0, // Default state: sent
            'pdf_state' => 0, // Default PDF state: not uploaded
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الطلب بنجاح',
            'data' => new StudentOrderResource($studentOrder->load(['student', 'user']))
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(StudentOrder $studentOrder)
    {
        return response()->json([
            'success' => true,
            'data' => new StudentOrderResource($studentOrder->load(['student', 'user']))
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StudentOrder $studentOrder)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'sometimes|required|string|max:1000',
            'type' => 'sometimes|required|integer|in:0,1',
            'state' => 'sometimes|required|integer|in:0,1,2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $studentOrder->update($request->only(['description', 'type', 'state']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الطلب بنجاح',
            'data' => new StudentOrderResource($studentOrder->load(['student', 'user']))
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StudentOrder $studentOrder)
    {
        // Delete PDF file if exists
        if ($studentOrder->pdf_path && Storage::exists($studentOrder->pdf_path)) {
            Storage::delete($studentOrder->pdf_path);
        }
        
        $studentOrder->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الطلب بنجاح'
        ]);
    }

    /**
     * Upload PDF for student order
     */
    public function uploadPdf(Request $request, StudentOrder $studentOrder)
    {
        $validator = Validator::make($request->all(), [
            'pdf' => 'required|file|mimes:pdf|max:10240', // Max 10MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Delete old PDF if exists
        if ($studentOrder->pdf_path && Storage::exists($studentOrder->pdf_path)) {
            Storage::delete($studentOrder->pdf_path);
        }

        // Store new PDF
        $path = $request->file('pdf')->store('student_orders', 'public');
        
        $studentOrder->update([
            'pdf_path' => $path,
            'pdf_state' => 1 // PDF uploaded
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الملف بنجاح',
            'data' => new StudentOrderResource($studentOrder->load(['student', 'user']))
        ]);
    }

    /**
     * Get student orders for a specific user (student)
     */
  

    /**
     * Update PDF state
     */
    public function updatePdfState(Request $request, StudentOrder $studentOrder)
    {
        $validator = Validator::make($request->all(), [
            'pdf_state' => 'required|integer|in:0,1,2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $studentOrder->update([
            'pdf_state' => $request->pdf_state
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الملف بنجاح',
            'data' => new StudentOrderResource($studentOrder->load(['student', 'user']))
        ]);
    }
}