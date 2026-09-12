<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWilayaRequest;
use App\Http\Requests\UpdateWilayaRequest;
use App\Http\Resources\WilayaResource;
use App\Models\Wilaya;
use Illuminate\Http\Request;

class WilayaController extends Controller
{
    /**
     * Display a listing of wilayas with pagination and filtering.
     */
    public function index(Request $request)
    {
        $query = Wilaya::query()->withCount('communes');

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('designation_ar', 'like', "%{$search}%")
                  ->orWhere('designation_fr', 'like', "%{$search}%")
                  ->orWhere('postalw', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->get('per_page', 10), 100);
        $wilayas = $query->paginate($perPage);

        return WilayaResource::collection($wilayas);
    }

    /**
     * Store a newly created wilaya.
     */
    public function store(StoreWilayaRequest $request)
    {
        $data = $request->validated();
        $wilaya = Wilaya::create($data);

        return response()->json([
            'message' => 'Wilaya created successfully',
            'wilaya' => new WilayaResource($wilaya),
        ], 201);
    }

    /**
     * Display the specified wilaya.
     */
    public function show($id)
    {
        $wilaya = Wilaya::findOrFail($id);
        return new WilayaResource($wilaya);
    }

    /**
     * Update the specified wilaya.
     */
    public function update(UpdateWilayaRequest $request, $id)
    {
        $wilaya = Wilaya::findOrFail($id);
        $data = $request->validated();
        $wilaya->update($data);

        return response()->json([
            'message' => 'Wilaya updated successfully',
            'wilaya' => new WilayaResource($wilaya),
        ], 200);
    }

    /**
     * Remove the specified wilaya.
     */
    public function destroy($id)
    {
        $wilaya = Wilaya::findOrFail($id);
        
        // Check if wilaya has communes
        if ($wilaya->communes()->count() > 0) {
            return response()->json([
                'error' => 'Cannot delete wilaya with existing communes'
            ], 422);
        }
        
        $wilaya->delete();

        return response()->json([
            'message' => 'Wilaya deleted successfully',
        ], 200);
    }

    /**
     * Bulk delete wilayas.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:wilayas,id',
        ]);

        // Check if any wilaya has communes
        $wilayasWithCommunes = Wilaya::whereIn('id', $request->ids)->has('communes')->count();
        if ($wilayasWithCommunes > 0) {
            return response()->json([
                'error' => 'Cannot delete wilayas that have communes'
            ], 422);
        }

        $deletedCount = Wilaya::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => "{$deletedCount} wilayas deleted successfully",
        ], 200);
    }

    /**
     * Get wilayas count for statistics.
     */
    public function getCount(Request $request)
    {
        $query = Wilaya::query();

        // Get total count
        $total = $query->count();
        $withCommunes = Wilaya::has('communes')->count();
        $withoutCommunes = $total - $withCommunes;

        $counts = [
            'all' => $total,
            'with_communes' => $withCommunes,
            'without_communes' => $withoutCommunes,
        ];

        return response()->json($counts, 200);
    }
}
