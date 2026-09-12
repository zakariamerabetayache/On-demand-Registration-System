<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use App\Models\Child;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Payment::with(['user:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email', 'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr']);

            // Role-based filtering
            if ($user->role_id === 'parent') {
                // Parents can only see their own payments
                $query->where('user_id', $user->id);
            } elseif ($user->role_id === 'manager') {
                // Managers can see payments for their establishment
                $parentIds = User::where('etablissement_id', $user->etablissement_id)
                    ->where('role_id', 'parent')
                    ->pluck('id');
                $query->whereIn('user_id', $parentIds);
            }
            // Admins can see all payments (no additional filtering)

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('user', function($userQuery) use ($search) {
                        $userQuery->where('nom_ar', 'like', "%{$search}%")
                                 ->orWhere('nom_fr', 'like', "%{$search}%")
                                 ->orWhere('prenom_ar', 'like', "%{$search}%")
                                 ->orWhere('prenom_fr', 'like', "%{$search}%")
                                 ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('child', function($childQuery) use ($search) {
                        $childQuery->where('nom_ar', 'like', "%{$search}%")
                                  ->orWhere('nom_fr', 'like', "%{$search}%")
                                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                                  ->orWhere('prenom_fr', 'like', "%{$search}%");
                    })->orWhere('amount', 'like', "%{$search}%");
                });
            }

            // Filter by state
            if ($request->has('state') && $request->state !== '') {
                $query->where('state', $request->state);
            }

            // Filter by user_id (parent)
            if ($request->has('user_id') && !empty($request->user_id)) {
                $query->where('user_id', $request->user_id);
            }

            // Filter by child_id
            if ($request->has('child_id') && !empty($request->child_id)) {
                $query->where('child_id', $request->child_id);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $payments = $query->paginate($perPage);

            return response()->json($payments);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching payments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'child_id' => 'nullable|exists:children,id',
                'amount' => 'required|numeric|min:0',
                'date' => 'required|date',
                'pdf' => 'nullable|file|mimes:pdf|max:10240', // 10MB max
                'state' => 'integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify that the child belongs to the user (if child_id is provided)
            if ($request->child_id) {
                $child = Child::where('id', $request->child_id)
                              ->where('parent_id', $request->user_id)
                              ->first();

                if (!$child) {
                    return response()->json([
                        'message' => 'Child does not belong to the specified parent'
                    ], 422);
                }
            }

            // Handle PDF upload if provided
            $pdfPath = null;
            $state = $request->state ?? 0;
            
            if ($request->hasFile('pdf')) {
                $pdfPath = $request->file('pdf')->store('payments', 'public');
                $state = 1; // Mark as completed when PDF is uploaded
            }

            $payment = Payment::create([
                'user_id' => $request->user_id,
                'child_id' => $request->child_id,
                'amount' => $request->amount,
                'date' => $request->date,
                'pdf_path' => $pdfPath,
                'state' => $state,
            ]);
            
            $payment->load(['user:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email', 'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr']);

            return response()->json([
                'message' => 'Payment created successfully',
                'data' => $payment
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified payment.
     */
    public function show(Request $request, Payment $payment)
    {
        try {
            $user = $request->user();

            // Check permissions
            if ($user->role_id === 'parent' && $payment->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager') {
                $parentIds = User::where('etablissement_id', $user->etablissement_id)
                    ->where('role_id', 'parent')
                    ->pluck('id');
                
                if (!$parentIds->contains($payment->user_id)) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $payment->load(['user:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email', 'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr']);

            return response()->json([
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, Payment $payment)
    {
        try {
            $user = $request->user();

            // Check permissions - only admin and manager can update payments
            if (!in_array($user->role_id, ['admin', 'manager'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager') {
                $parentIds = User::where('etablissement_id', $user->etablissement_id)
                    ->where('role_id', 'parent')
                    ->pluck('id');
                
                if (!$parentIds->contains($payment->user_id)) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'sometimes|exists:users,id',
                'child_id' => 'sometimes|exists:children,id',
                'amount' => 'sometimes|numeric|min:0',
                'date' => 'sometimes|date',
                'pdf_path' => 'nullable|string',
                'state' => 'sometimes|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // If updating child_id, verify it belongs to the user
            if ($request->has('child_id') && $request->has('user_id')) {
                $child = Child::where('id', $request->child_id)
                              ->where('parent_id', $request->user_id)
                              ->first();

                if (!$child) {
                    return response()->json([
                        'message' => 'Child does not belong to the specified parent'
                    ], 422);
                }
            }

            $payment->update($request->all());
            $payment->load(['user:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email', 'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr']);

            return response()->json([
                'message' => 'Payment updated successfully',
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified payment.
     */
    public function destroy(Request $request, Payment $payment)
    {
        try {
            $user = $request->user();

            // Check permissions - only admin and manager can delete payments
            if (!in_array($user->role_id, ['admin', 'manager'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager') {
                $parentIds = User::where('etablissement_id', $user->etablissement_id)
                    ->where('role_id', 'parent')
                    ->pluck('id');
                
                if (!$parentIds->contains($payment->user_id)) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            // Delete PDF file if exists
            if ($payment->pdf_path && Storage::exists($payment->pdf_path)) {
                Storage::delete($payment->pdf_path);
            }

            $payment->delete();

            return response()->json([
                'message' => 'Payment deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // change state function 
    public function isCard($userId)
    {
        if (!$userId) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }
    
        // Check if the user has any payments
        $hasPayments = Payment::where("user_id", $userId)->exists();
    
        $iscard = $hasPayments ? true : false;
    
        return response()->json([
            "data" => $iscard
        ]);
    }
    

    public function paymentState($id, Request $request)
    {
        // ✅ Validate the incoming request
        $validated = $request->validate([
            'state' => 'required|integer|in:0,1', // example values
        ]);
    
        // ✅ Find the payment record
        $payment = Payment::find($id);
    
        if (!$payment) {
            return response()->json([
                'message' => 'Payment not found',
            ], 404);
        }
    
        // ✅ Update the payment state
        $payment->update([
            'state' => $validated['state'],
        ]);
    
        return response()->json([
            'message' => 'Payment state updated successfully',
            'payment' => $payment,
        ], 200);
    }
    

    /**
     * Upload PDF receipt for a payment.
     */
    public function uploadPdf(Request $request, Payment $payment)
    {
        try {
            $user = $request->user();

            // Check permissions - parents can upload for their own payments
            if ($user->role_id === 'parent' && $payment->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager') {
                $parentIds = User::where('etablissement_id', $user->etablissement_id)
                    ->where('role_id', 'parent')
                    ->pluck('id');
                
                if (!$parentIds->contains($payment->user_id)) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $validator = Validator::make($request->all(), [
                'pdf' => 'required|file|mimes:pdf|max:10240', // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Delete old PDF if exists
            if ($payment->pdf_path && Storage::exists($payment->pdf_path)) {
                Storage::delete($payment->pdf_path);
            }

            // Store new PDF
            $path = $request->file('pdf')->store('payments', 'public');
            
            $payment->update([
                'pdf_path' => $path,
                'state' => 1 // Mark as completed when PDF is uploaded
            ]);

            return response()->json([
                'message' => 'PDF uploaded successfully',
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error uploading PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payments for a specific establishment (admin/manager only).
     */
    public function getByEstablishment(Request $request, $etablissementId)
    {
        try {
            $user = $request->user();

            // Check permissions
            if (!in_array($user->role_id, ['admin', 'manager'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager' && $user->etablissement_id != $etablissementId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get all parent IDs for this establishment
            $parentIds = User::where('etablissement_id', $etablissementId)
                ->where('role_id', 'parent')
                ->pluck('id');

            if ($parentIds->isEmpty()) {
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 0,
                    'last_page' => 1
                ]);
            }

            $query = Payment::with(['user:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,etablissement_id', 'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr'])
                ->whereIn('user_id', $parentIds);

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('user', function($userQuery) use ($search) {
                        $userQuery->where('nom_ar', 'like', "%{$search}%")
                                 ->orWhere('nom_fr', 'like', "%{$search}%")
                                 ->orWhere('prenom_ar', 'like', "%{$search}%")
                                 ->orWhere('prenom_fr', 'like', "%{$search}%")
                                 ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('child', function($childQuery) use ($search) {
                        $childQuery->where('nom_ar', 'like', "%{$search}%")
                                  ->orWhere('nom_fr', 'like', "%{$search}%")
                                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                                  ->orWhere('prenom_fr', 'like', "%{$search}%");
                    })->orWhere('amount', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $payments = $query->paginate($perPage);

            return response()->json($payments);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching payments for establishment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a payment for the current authenticated parent.
     * Only requires PDF upload - amount comes from etablissement.price, date is current date, child_id is null
     */
    public function createForCurrentParent(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('etablissement'); // Ensure etablissement is loaded

            // Ensure only parents can create payments
            if ($user->role_id !== 'parent') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'pdf' => 'required|file|mimes:pdf|max:10240', // 10MB max - PDF is required
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Debug user information
            \Log::info('User ID: ' . $user->id);
            \Log::info('User role: ' . $user->role_id);
            \Log::info('User etablissement_id: ' . $user->etablissement_id);
            
            // Check if user has etablissement
            if (!$user->etablissement) {
                \Log::error('User does not have etablissement relationship');
                return response()->json([
                    'message' => 'User etablissement not found',
                    'error' => 'Please contact administrator to set up your establishment'
                ], 400);
            }
            
            // Get amount from user's etablissement price
            $amount = $user->etablissement->price ?? 0;
            \Log::info('Payment amount: ' . $amount);
            
            // Handle PDF upload (required)
            \Log::info('Uploading PDF file');
            $pdfPath = $request->file('pdf')->store('payments', 'public');
            \Log::info('PDF uploaded to: ' . $pdfPath);

            // Create payment record
            \Log::info('Creating payment record');
            $payment = Payment::create([
                'user_id' => $user->id, 
                'child_id' => null, 
                'amount' => $amount, 
                'date' => now()->format('Y-m-d'), 
                'pdf_path' => $pdfPath,
                'state' => 0,
            ]);
            \Log::info('Payment created with ID: ' . $payment->id);
            
            $payment->load(['user:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email', 'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr']);

            return response()->json([
                'message' => 'Payment created successfully',
                'data' => $payment
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Payment creation error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Error creating payment',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    /**
     * Get payment statistics for the current user
     */
    public function getStatistics(Request $request)
    {
        try {
            $user = $request->user();
            
            // Build base query based on user role
            $query = Payment::query();
            
            if ($user->role_id === 'parent') {
                // Parents can only see their own payment statistics
                $query->where('user_id', $user->id);
            } elseif ($user->role_id === 'manager') {
                // Managers can see statistics for their establishment
                $parentIds = User::where('etablissement_id', $user->etablissement_id)
                    ->where('role_id', 'parent')
                    ->pluck('id');
                $query->whereIn('user_id', $parentIds);
            }
            // Admins can see all payment statistics (no additional filtering)
            
            $totalPayments = $query->count();
            $pendingPayments = (clone $query)->where('state', 0)->count();
            $completedPayments = (clone $query)->where('state', 1)->count();
            $totalAmount = (clone $query)->sum('amount');
            
            return response()->json([
                'total' => $totalPayments,
                'pending' => $pendingPayments,
                'completed' => $completedPayments,
                'total_amount' => $totalAmount
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Payment statistics error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error fetching payment statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
