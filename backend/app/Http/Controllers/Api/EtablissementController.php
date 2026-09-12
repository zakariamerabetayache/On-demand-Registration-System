<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEtablissementRequest;
use App\Http\Requests\UpdateEtablissementRequest;
use App\Http\Resources\EtablissementResource;
use App\Models\Etablissement;
use Illuminate\Http\Request;

class EtablissementController extends Controller
{
    /**
     * Display a listing of etablissements with pagination and filtering.
     */
    public function index(Request $request)
    {
        $query = Etablissement::with(['wilaya', 'commune']);

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('designation_ar', 'like', "%{$search}%")
                  ->orWhere('designation_fr', 'like', "%{$search}%");
            });
        }

        // Filter by wilaya_id
        if ($request->has('wilaya_id') && !empty($request->wilaya_id)) {
            $query->where('wilaya_id', $request->wilaya_id);
        }

        // Filter by commune_id
        if ($request->has('commune_id') && !empty($request->commune_id)) {
            $query->where('commune_id', $request->commune_id);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->get('per_page', 10), 100);
        $etablissements = $query->paginate($perPage);

        return EtablissementResource::collection($etablissements);
    }

    /**
     * Store a newly created etablissement.
     */
    public function store(StoreEtablissementRequest $request)
    {
        $data = $request->validated();
        $etablissement = Etablissement::create($data);
        return response()->json([
            'message' => 'Etablissement created successfully',
            'etablissement' => new EtablissementResource($etablissement->load(['wilaya', 'commune'])),
        ], 201);
    }

    /**
     * Display the specified etablissement.
     */
    public function show($id)
    {
        $etablissement = Etablissement::with(['wilaya', 'commune', 'users'])->findOrFail($id);
        return new EtablissementResource($etablissement);
    }

    /**
     * Update the specified etablissement.
     */
    public function update(UpdateEtablissementRequest $request, $id)
    {
        $etablissement = Etablissement::findOrFail($id);
        $data = $request->validated();

        $etablissement->update($data);

        return response()->json([
            'message' => 'Etablissement updated successfully',
            'etablissement' => new EtablissementResource($etablissement->load(['wilaya', 'commune'])),
        ], 200);
    }

    /**
     * Remove the specified etablissement.
     */
    public function destroy($id)
    {
        $etablissement = Etablissement::findOrFail($id);
        
        // Check if etablissement has users
        if ($etablissement->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete etablissement with associated users',
            ], 422);
        }

        $etablissement->delete();

        return response()->json([
            'message' => 'Etablissement deleted successfully',
        ], 200);
    }

    /**
     * Bulk delete etablissements.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:etablissements,id',
        ]);

        // Check if any etablissement has users
        $etablissementsWithUsers = Etablissement::whereIn('id', $request->ids)
            ->whereHas('users')
            ->count();

        if ($etablissementsWithUsers > 0) {
            return response()->json([
                'message' => 'Cannot delete etablissements with associated users',
            ], 422);
        }

        $deletedCount = Etablissement::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => "{$deletedCount} etablissements deleted successfully",
        ], 200);
    }

    /**
     * Get etablissements count for statistics.
     */
    public function getCount(Request $request)
    {
        $query = Etablissement::query();

        // Get total count
        $total = $query->count();

        // Get counts by user association
        $withUsers = Etablissement::whereHas('users')->count();
        $withoutUsers = $total - $withUsers;

        // Get counts by wilaya
        $wilayaCounts = Etablissement::selectRaw('wilaya_id, count(*) as count')
            ->groupBy('wilaya_id')
            ->with('wilaya:id,designation_ar')
            ->get()
            ->pluck('count', 'wilaya.designation_ar')
            ->toArray();

        $counts = [
            'all' => $total,
            'with_users' => $withUsers,
            'without_users' => $withoutUsers,
        ];

        return response()->json($counts, 200);
    }

    /**
     * Upload logo for etablissement.
     */
    public function uploadLogo(Request $request, $id)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $etablissement = Etablissement::findOrFail($id);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($etablissement->logo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($etablissement->logo);
            }
            
            // Store new logo in storage/app/public/uploads/logos
            $file = $request->file('logo');
            $filename = 'etablissement_' . $id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $request->file('logo')->storeAs('uploads/logos', $filename, 'public');

            // Update etablissement logo path
            $etablissement->update(['logo' => $path]);

            return response()->json([
                'message' => 'Logo uploaded successfully',
                'logo_path' => $path,
                'etablissement' => new EtablissementResource($etablissement->load(['wilaya', 'commune'])),
            ], 200);
        }

        return response()->json([
            'message' => 'No logo file provided',
        ], 400);
    }

    /**
     * Delete logo for etablissement.
     */
    public function deleteLogo($id)
    {
        $etablissement = Etablissement::findOrFail($id);

        if ($etablissement->logo) {
            // Delete logo file from storage
            \Illuminate\Support\Facades\Storage::disk('public')->delete($etablissement->logo);
            
            // Remove logo path from database
            $etablissement->update(['logo' => null]);

            return response()->json([
                'message' => 'Logo deleted successfully',
                'etablissement' => new EtablissementResource($etablissement->load(['wilaya', 'commune'])),
            ], 200);
        }

        return response()->json([
            'message' => 'No logo to delete',
        ], 404);
    }

    /**
     * Update establishment parameters partially.
     * Only updates allowed parameter fields: verificationby, change_token, validation_by
     */
    public function updateParameters(Request $request, $id)
    {
        $etablissement = Etablissement::findOrFail($id);
        
        // Define allowed parameter fields with their validation rules
        $allowedFields = [
            'verificationby' => 'boolean',
            'change_token' => 'boolean',
            'validation_by' => 'nullable|string|in:watani,wilayi',
            'app_name' => 'nullable|string',
            'hero_title' => 'nullable|string',
            'hero_description' => 'nullable|string',
            'primary_color' => 'nullable|string',
        ];
        
        // Validate only the fields that are present in the request
        $rules = [];
        foreach ($allowedFields as $field => $rule) {
            if ($request->has($field)) {
                $rules[$field] = $rule;
            }
        }
        
        // If no valid fields are present, return error
        if (empty($rules)) {
            return response()->json([
                'message' => 'No valid parameter fields provided',
            ], 422);
        }
        
        $data = $request->validate($rules);
        
        // Update only the validated fields
        $etablissement->update($data);

        return response()->json([
            'message' => 'Parameters updated successfully',
            'etablissement' => new EtablissementResource($etablissement->load(['wilaya', 'commune'])),
        ], 200);
    }
}
