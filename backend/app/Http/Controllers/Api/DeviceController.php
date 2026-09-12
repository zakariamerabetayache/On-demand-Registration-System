<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Etablissement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DeviceController extends Controller
{
    /**
     * Display a listing of devices for a specific establishment.
     */
    public function index($etablissementId, Request $request)
    {
        try {
            // Validate the establishment exists
            $etablissement = Etablissement::find($etablissementId);
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

            // Start query: devices for this establishment
            $query = Device::where('etablissement_id', $etablissementId)
                          ->with('etablissement:id,designation_ar,designation_fr');

            // Search feature
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('designation', 'like', "%{$search}%")
                      ->orWhere('port', 'like', "%{$search}%")
                      ->orWhere('ip_address', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'id');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min($request->get('per_page', 10), 100);
            $devices = $query->paginate($perPage);

            // Return result
            return response()->json($devices);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching devices: ' . $e->getMessage(),
                'data' => [],
                'current_page' => 1,
                'per_page' => 10,
                'total' => 0,
                'last_page' => 1
            ], 500);
        }
    }

    /**
     * Store a newly created device in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'designation' => 'required|string|max:255',
            'port' => 'required|string|max:255',
            'ip_address' => 'required|string|max:15|ip',
            'etablissement_id' => 'required|exists:etablissements,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $device = Device::create($request->all());
            $device->load('etablissement:id,designation_ar,designation_fr');

            return response()->json([
                'success' => true,
                'message' => 'Device created successfully',
                'data' => $device
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating device: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified device.
     */
    public function show(Device $device)
    {
        try {
            $device->load('etablissement:id,designation_ar,designation_fr');

            return response()->json([
                'success' => true,
                'data' => $device
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching device: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified device in storage.
     */
    public function update(Request $request, Device $device)
    {
        $validator = Validator::make($request->all(), [
            'designation' => 'required|string|max:255',
            'port' => 'nullable|string|max:255',
            'ip_address' => 'nullable|string|max:15|ip',
            'etablissement_id' => 'required|exists:etablissements,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $device->update($request->all());
            $device->load('etablissement:id,designation_ar,designation_fr');

            return response()->json([
                'success' => true,
                'message' => 'Device updated successfully',
                'data' => $device
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating device: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified device from storage.
     */
    public function destroy(Device $device)
    {
        try {
            $device->delete();

            return response()->json([
                'success' => true,
                'message' => 'Device deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting device: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get device statistics for an establishment
     */
    public function getCount($etablissementId)
    {
        try {
            $count = Device::where('etablissement_id', $etablissementId)->count();

            return response()->json([
                'success' => true,
                'total' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting device count: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get devices by establishment (alternative method for admin views)
     */
    public function getByEstablishment($etablissementId, Request $request)
    {
        // This method can be the same as index, just with a different route name
        return $this->index($etablissementId, $request);
    }

    /**
     * Get device statistics for establishment
     */
    public function getStatistics($etablissementId)
    {
        try {
            // Validate the establishment exists
            $etablissement = Etablissement::find($etablissementId);
            if (!$etablissement) {
                return response()->json([
                    'message' => 'Establishment not found'
                ], 404);
            }

            $totalDevices = Device::where('etablissement_id', $etablissementId)->count();
            $activeDevices = Device::where('etablissement_id', $etablissementId)
                                  ->whereNotNull('ip_address')
                                  ->count();
            $inactiveDevices = $totalDevices - $activeDevices;

            return response()->json([
                'success' => true,
                'statistics' => [
                    'total' => $totalDevices,
                    'active' => $activeDevices,
                    'inactive' => $inactiveDevices,
                    'establishment' => [
                        'id' => $etablissement->id,
                        'name_ar' => $etablissement->designation_ar,
                        'name_fr' => $etablissement->designation_fr
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting device statistics: ' . $e->getMessage()
            ], 500);
        }
    }
}
