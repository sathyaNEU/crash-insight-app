<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DataController extends Controller
{
    /**
     * Fetch data from the incidents_view.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getIncidents()
    {
        try {
            // Fetch data from the incidents_view
            $data = DB::table('incidents_view')->get();
            
            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch incident data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Load categories and incidents data from external API.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function loadData(Request $request)
    {
        try {
            // Fetch data from Somerville API
            $response = Http::withoutVerifying()->get('https://data-for-all.s3.us-east-1.amazonaws.com/Police_Data__Crashes_20251016.csv');
            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch data from external API',
                    'error' => $response->status()
                ], 500);
            }
            
            $incidents = $response->json();
            
            // Process and load categories
            $lightConditions = $this->loadLightConditions($incidents);
            $weatherConditions = $this->loadWeatherConditions($incidents);
            $roadSurfaces = $this->loadRoadSurfaces($incidents);
            $trafficControlDevices = $this->loadTrafficControlDevices($incidents);
            $intersectionTypes = $this->loadIntersectionTypes($incidents);
            $roadTypes = $this->loadRoadTypes($incidents);
            $collisionTypes = $this->loadCollisionTypes($incidents);
            $eventLocations = $this->loadEventLocations($incidents);
            
            // Load incidents
            $loadedIncidents = $this->loadIncidents($incidents, [
                'light_conditions' => $lightConditions,
                'weather_conditions' => $weatherConditions,
                'road_surfaces' => $roadSurfaces,
                'traffic_control_devices' => $trafficControlDevices,
                'intersection_types' => $intersectionTypes,
                'road_types' => $roadTypes,
                'collision_types' => $collisionTypes,
                'event_locations' => $eventLocations
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Data loaded successfully',
                'counts' => [
                    'light_conditions' => count($lightConditions),
                    'weather_conditions' => count($weatherConditions),
                    'road_surfaces' => count($roadSurfaces),
                    'traffic_control_devices' => count($trafficControlDevices),
                    'intersection_types' => count($intersectionTypes),
                    'road_types' => count($roadTypes),
                    'collision_types' => count($collisionTypes),
                    'event_locations' => count($eventLocations),
                    'incidents' => count($loadedIncidents)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Extract and load light conditions from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadLightConditions($incidents)
    {
        try {
            $lightConditions = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['ambntlightdesc']) && trim($incident['ambntlightdesc']) != '') {
                    $lightCondition = trim($incident['ambntlightdesc']);
                    
                    if (!in_array(['id' => $id, 'name' => $lightCondition], $lightConditions)) {
                        $exists = false;
                        foreach ($lightConditions as $existing) {
                            if ($existing['name'] === $lightCondition) {
                                $exists = true;
                                break;
                            }
                        }
                        
                        if (!$exists) {
                            $lightConditions[] = [
                                'id' => $id++,
                                'name' => $lightCondition
                            ];
                            
                            // Insert into database
                            DB::table('light_conditions')->insertOrIgnore([
                                'id' => $id - 1,
                                'name' => $lightCondition
                            ]);
                        }
                    }
                }
            }
            
            return $lightConditions;
        } catch (\Exception $e) {
            // Log error and rethrow
            Log::error('Error loading light conditions: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Extract and load weather conditions from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadWeatherConditions($incidents)
    {
        try {
            $weatherConditions = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['weathcond1desc']) && trim($incident['weathcond1desc']) != '') {
                    $weatherCondition = trim($incident['weathcond1desc']);
                    
                    // Check if this weather condition already exists
                    $exists = false;
                    foreach ($weatherConditions as $existing) {
                        if ($existing['name'] === $weatherCondition) {
                            $exists = true;
                            break;
                        }
                    }
                    
                    if (!$exists) {
                        $weatherConditions[] = [
                            'id' => $id++,
                            'name' => $weatherCondition
                        ];
                        
                        // Insert into database
                        DB::table('weather_conditions')->insertOrIgnore([
                            'id' => $id - 1,
                            'name' => $weatherCondition
                        ]);
                    }
                }
            }
            
            return $weatherConditions;
        } catch (\Exception $e) {
            Log::error('Error loading weather conditions: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Extract and load road surfaces from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadRoadSurfaces($incidents)
    {
        try {
            $roadSurfaces = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['roadsurfdesc']) && trim($incident['roadsurfdesc']) != '') {
                    $roadSurface = trim($incident['roadsurfdesc']);
                    
                    // Check if this road surface already exists
                    $exists = false;
                    foreach ($roadSurfaces as $existing) {
                        if ($existing['name'] === $roadSurface) {
                            $exists = true;
                            break;
                        }
                    }
                    
                    if (!$exists) {
                        $roadSurfaces[] = [
                            'id' => $id++,
                            'name' => $roadSurface
                        ];
                        
                        // Insert into database
                        DB::table('road_surface')->insertOrIgnore([
                            'id' => $id - 1,
                            'name' => $roadSurface
                        ]);
                    }
                }
            }
            
            return $roadSurfaces;
        } catch (\Exception $e) {
            Log::error('Error loading road surfaces: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Extract and load traffic control devices from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadTrafficControlDevices($incidents)
    {
        try {
            $trafficControlDevices = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['trafcntrltypedesc']) && trim($incident['trafcntrltypedesc']) != '') {
                    $deviceType = trim($incident['trafcntrltypedesc']);
                    
                    // Check if this traffic control device already exists
                    $exists = false;
                    foreach ($trafficControlDevices as $existing) {
                        if ($existing['name'] === $deviceType) {
                            $exists = true;
                            break;
                        }
                    }
                    
                    if (!$exists) {
                        $trafficControlDevices[] = [
                            'id' => $id++,
                            'name' => $deviceType
                        ];
                        
                        // Insert into database
                        DB::table('traffic_control_device')->insertOrIgnore([
                            'id' => $id - 1,
                            'name' => $deviceType
                        ]);
                    }
                }
            }
            
            return $trafficControlDevices;
        } catch (\Exception $e) {
            Log::error('Error loading traffic control devices: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Extract and load intersection types from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadIntersectionTypes($incidents)
    {
        try {
            $intersectionTypes = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['rdwyjuncdesc']) && trim($incident['rdwyjuncdesc']) != '') {
                    $intersectionType = trim($incident['rdwyjuncdesc']);
                    
                    // Check if this intersection type already exists
                    $exists = false;
                    foreach ($intersectionTypes as $existing) {
                        if ($existing['name'] === $intersectionType) {
                            $exists = true;
                            break;
                        }
                    }
                    
                    if (!$exists) {
                        $intersectionTypes[] = [
                            'id' => $id++,
                            'name' => $intersectionType
                        ];
                        
                        // Insert into database
                        DB::table('intersection_type')->insertOrIgnore([
                            'id' => $id - 1,
                            'name' => $intersectionType
                        ]);
                    }
                }
            }
            
            return $intersectionTypes;
        } catch (\Exception $e) {
            Log::error('Error loading intersection types: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Extract and load road types from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadRoadTypes($incidents)
    {
        try {
            $roadTypes = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['trafydescrdesc']) && trim($incident['trafydescrdesc']) != '') {
                    $roadType = trim($incident['trafydescrdesc']);
                    
                    // Check if this road type already exists
                    $exists = false;
                    foreach ($roadTypes as $existing) {
                        if ($existing['name'] === $roadType) {
                            $exists = true;
                            break;
                        }
                    }
                    
                    if (!$exists) {
                        $roadTypes[] = [
                            'id' => $id++,
                            'name' => $roadType
                        ];
                        
                        // Insert into database
                        DB::table('road_type')->insertOrIgnore([
                            'id' => $id - 1,
                            'name' => $roadType
                        ]);
                    }
                }
            }
            
            return $roadTypes;
        } catch (\Exception $e) {
            Log::error('Error loading road types: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Extract and load collision types from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadCollisionTypes($incidents)
    {
        try {
            $collisionTypes = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['manrcolldesc']) && trim($incident['manrcolldesc']) != '') {
                    $collisionType = trim($incident['manrcolldesc']);
                    
                    // Check if this collision type already exists
                    $exists = false;
                    foreach ($collisionTypes as $existing) {
                        if ($existing['name'] === $collisionType) {
                            $exists = true;
                            break;
                        }
                    }
                    
                    if (!$exists) {
                        $collisionTypes[] = [
                            'id' => $id++,
                            'name' => $collisionType
                        ];
                        
                        // Insert into database
                        DB::table('collision_type')->insertOrIgnore([
                            'id' => $id - 1,
                            'name' => $collisionType
                        ]);
                    }
                }
            }
            
            return $collisionTypes;
        } catch (\Exception $e) {
            Log::error('Error loading collision types: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Extract and load event locations from incidents.
     *
     * @param array $incidents
     * @return array
     */
    private function loadEventLocations($incidents)
    {
        try {
            $eventLocations = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                if (isset($incident['hrmfeventdesc1']) && trim($incident['hrmfeventdesc1']) != '') {
                    $location = trim($incident['hrmfeventdesc1']);
                    
                    // Check if this event location already exists
                    $exists = false;
                    foreach ($eventLocations as $existing) {
                        if ($existing['name'] === $location) {
                            $exists = true;
                            break;
                        }
                    }
                    
                    if (!$exists) {
                        $eventLocations[] = [
                            'id' => $id++,
                            'name' => $location
                        ];
                        
                        // Insert into database
                        DB::table('event_location')->insertOrIgnore([
                            'id' => $id - 1,
                            'name' => $location
                        ]);
                    }
                }
            }
            
            return $eventLocations;
        } catch (\Exception $e) {
            Log::error('Error loading event locations: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Load incidents from API data.
     *
     * @param array $incidents Raw incident data
     * @param array $categories Loaded categories
     * @return array Processed incidents
     */
    private function loadIncidents($incidents, $categories)
    {
        try {
            $processedIncidents = [];
            $id = 1;
            
            foreach ($incidents as $incident) {
                $lightConditionId = $this->getCategoryIdByValue(
                    $categories['light_conditions'], 
                    'name', 
                    isset($incident['ambntlightdesc']) ? trim($incident['ambntlightdesc']) : ''
                );
                
                $weatherConditionId = $this->getCategoryIdByValue(
                    $categories['weather_conditions'], 
                    'name', 
                    isset($incident['weathcond1desc']) ? trim($incident['weathcond1desc']) : ''
                );
                
                $roadSurfaceId = $this->getCategoryIdByValue(
                    $categories['road_surfaces'], 
                    'name', 
                    isset($incident['roadsurfdesc']) ? trim($incident['roadsurfdesc']) : ''
                );
                
                $trafficControlDeviceId = $this->getCategoryIdByValue(
                    $categories['traffic_control_devices'], 
                    'name', 
                    isset($incident['trafcntrltypedesc']) ? trim($incident['trafcntrltypedesc']) : ''
                );
                
                $intersectionTypeId = $this->getCategoryIdByValue(
                    $categories['intersection_types'], 
                    'name', 
                    isset($incident['rdwyjuncdesc']) ? trim($incident['rdwyjuncdesc']) : ''
                );
                
                $roadTypeId = $this->getCategoryIdByValue(
                    $categories['road_types'], 
                    'name', 
                    isset($incident['trafydescrdesc']) ? trim($incident['trafydescrdesc']) : ''
                );
                
                $collisionTypeId = $this->getCategoryIdByValue(
                    $categories['collision_types'], 
                    'name', 
                    isset($incident['manrcolldesc']) ? trim($incident['manrcolldesc']) : ''
                );
                
                $eventLocationId = $this->getCategoryIdByValue(
                    $categories['event_locations'], 
                    'name', 
                    isset($incident['hrmfeventdesc1']) ? trim($incident['hrmfeventdesc1']) : ''
                );
                
                $processedIncident = [
                    'id' => $id++,
                    'crash_num' => isset($incident['crashnum']) ? $incident['crashnum'] : null,
                    'incident_date' => isset($incident['dtcrash']) ? $incident['dtcrash'] : null,
                    'first_harmful_event' => isset($incident['hrmfeventdesc2']) ? trim($incident['hrmfeventdesc2']) : null,
                    'location_id' => 1, // Placeholder
                    'light_condition_id' => $lightConditionId,
                    'weather_condition_id' => $weatherConditionId,
                    'road_surface_id' => $roadSurfaceId,
                    'traffic_control_device_id' => $trafficControlDeviceId,
                    'intersection_type_id' => $intersectionTypeId,
                    'road_type_id' => $roadTypeId,
                    'collision_type_id' => $collisionTypeId,
                    'event_location_id' => $eventLocationId,
                    'is_work_zone' => isset($incident['workzonerelddesc']) ? $incident['workzonerelddesc'] : null,
                    'cnt_fatal_injury' => isset($incident['fatalinjury']) ? intval($incident['fatalinjury']) : 0,
                    'cnt_sus_serious_injury' => isset($incident['suspectedseriousinjury']) ? intval($incident['suspectedseriousinjury']) : 0,
                    'cnt_sus_minor_injury' => isset($incident['suspectedminorinjury']) ? intval($incident['suspectedminorinjury']) : 0,
                    'cnt_pedestrian' => isset($incident['nonmotoristpedestrian']) ? intval($incident['nonmotoristpedestrian']) : 0,
                    'cnt_cyclist' => isset($incident['nonmotoristcyclist']) ? intval($incident['nonmotoristcyclist']) : 0,
                    'is_hit_and_run' => isset($incident['hitrunflag']) ? $incident['hitrunflag'] : null,
                    'incident_location' => isset($incident['address']) ? $incident['address'] : null,
                    'latitude' => isset($incident['latitude']) ? $incident['latitude'] : null,
                    'longitude' => isset($incident['longitude']) ? $incident['longitude'] : null,
                ];
                
                $processedIncidents[] = $processedIncident;
                
                // Insert into database
                DB::table('incidents')->insertOrIgnore($processedIncident);
            }
            
            return $processedIncidents;
        } catch (\Exception $e) {
            Log::error('Error loading incidents: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Helper to get category ID by value.
     *
     * @param array $category
     * @param string $field
     * @param string $value
     * @return int
     */
    private function getCategoryIdByValue($category, $field, $value)
    {
        foreach ($category as $item) {
            if ($item[$field] === $value) {
                return $item['id'];
            }
        }
        
        // If not found, return 1 as default (or handle appropriately)
        return 1;
    }
}