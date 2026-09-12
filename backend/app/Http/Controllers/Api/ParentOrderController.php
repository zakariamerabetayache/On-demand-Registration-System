<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentOrder;
use App\Http\Resources\ParentOrderResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ParentOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ParentOrder::with(['parent', 'user']);
        
        // Filter by creator user_id (show orders created by the logged-in user)
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        } elseif ($request->has('parent_id')) {
            // Filter by parent_id (show orders for a specific parent)
            $query->where('parent_id', $request->parent_id);
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
            $query->whereHas('parent', function($q) use ($request) {
                $q->where('residence_id', $request->residence_id);
            });
        }
        
        // Search by parent name (nom_ar + prenom_ar)
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->whereHas('parent', function($q) use ($searchTerm) {
                $q->whereRaw("CONCAT(nom_ar, ' ', prenom_ar) LIKE ?", ["%{$searchTerm}%"])
                  ->orWhereRaw("CONCAT(prenom_ar, ' ', nom_ar) LIKE ?", ["%{$searchTerm}%"])
                  ->orWhere('email', 'LIKE', "%{$searchTerm}%");
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
        $parentOrders = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => ParentOrderResource::collection($parentOrders->items()),
            'meta' => [
                'current_page' => $parentOrders->currentPage(),
                'per_page' => $parentOrders->perPage(),
                'total' => $parentOrders->total(),
                'last_page' => $parentOrders->lastPage(),
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
            'parent_id' => 'required|exists:users,id',
            'user_id' => 'required|exists:users,id',
            'type' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $parentOrder = ParentOrder::create([
            'description' => $request->description,
            'parent_id' => $request->parent_id,
            'user_id' => $request->user_id,
            'type' => $request->type,
            'state' => 0, // Default state: sent
            'pdf_state' => 0, // Default PDF state: not uploaded
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الطلب بنجاح',
            'data' => new ParentOrderResource($parentOrder->load(['parent', 'user']))
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ParentOrder $parentOrder)
    {
        return response()->json([
            'success' => true,
            'data' => new ParentOrderResource($parentOrder->load(['parent', 'user']))
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ParentOrder $parentOrder)
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

        $parentOrder->update($request->only(['description', 'type', 'state']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الطلب بنجاح',
            'data' => new ParentOrderResource($parentOrder->load(['parent', 'user']))
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ParentOrder $parentOrder)
    {
        // Delete PDF file if exists
        if ($parentOrder->pdf_path && Storage::exists($parentOrder->pdf_path)) {
            Storage::delete($parentOrder->pdf_path);
        }
        
        $parentOrder->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الطلب بنجاح'
        ]);
    }

    /**
     * Upload PDF for parent order
     */
    public function uploadPdf(Request $request, ParentOrder $parentOrder)
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
        if ($parentOrder->pdf_path && Storage::exists($parentOrder->pdf_path)) {
            Storage::delete($parentOrder->pdf_path);
        }

        // Store new PDF
        $path = $request->file('pdf')->store('parent_orders', 'public');
        
        $parentOrder->update([
            'pdf_path' => $path,
            'pdf_state' => 1 // PDF uploaded
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الملف بنجاح',
            'data' => new ParentOrderResource($parentOrder->load(['parent', 'user']))
        ]);
    }

    /**
     * Update PDF state
     */
    public function updatePdfState(Request $request, ParentOrder $parentOrder)
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

        $parentOrder->update([
            'pdf_state' => $request->pdf_state
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الملف بنجاح',
            'data' => new ParentOrderResource($parentOrder->load(['parent', 'user']))
        ]);
    }

    /**
     * Get all parent orders for parents in a specific establishment (Admin view)
     * Route: GET /parent-orders/establishment/{etablissement_id}
     */
    public function getByEstablishment($etablissementId, Request $request)
    {
        try {
            // Validate the establishment exists
            $etablissement = \App\Models\Etablissement::find($etablissementId);
            if (!$etablissement) {
                return response()->json([
                    'message' => 'Establishment not found',
                    'data' => [],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 0,
                    'last_page' => 1
                ], 404);
            }

            // Start query: parent orders for parents in this establishment
            $query = ParentOrder::whereHas('parent', function ($parentQuery) use ($etablissementId) {
                $parentQuery->where('etablissement_id', $etablissementId);
            })
            ->with(['parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,etablissement_id,telephone', 'user:id,nom_ar,nom_fr,prenom_ar,prenom_fr']);

            // Search feature
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhereHas('parent', function ($parentQuery) use ($search) {
                          $parentQuery->where('nom_ar', 'like', "%{$search}%")
                                      ->orWhere('nom_fr', 'like', "%{$search}%")
                                      ->orWhere('prenom_ar', 'like', "%{$search}%")
                                      ->orWhere('prenom_fr', 'like', "%{$search}%")
                                      ->orWhere('email', 'like', "%{$search}%")
                                      ->orWhere('telephone', 'like', "%{$search}%");
                      });
                });
            }

            // Filter by type
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            // Filter by state
            if ($request->filled('state')) {
                $query->where('state', $request->state);
            }

            // Filter by PDF state
            if ($request->filled('pdf_state')) {
                $query->where('pdf_state', $request->pdf_state);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 10), 100);
            $parentOrders = $query->paginate($perPage);

            // Return result (includes parent and user info)
            return response()->json([
                'success' => true,
                'data' => ParentOrderResource::collection($parentOrders->items()),
                'current_page' => $parentOrders->currentPage(),
                'per_page' => $parentOrders->perPage(),
                'total' => $parentOrders->total(),
                'last_page' => $parentOrders->lastPage(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching parent orders: ' . $e->getMessage(),
                'data' => [],
                'current_page' => 1,
                'per_page' => 10,
                'total' => 0,
                'last_page' => 1
            ], 500);
        }
    }
}
