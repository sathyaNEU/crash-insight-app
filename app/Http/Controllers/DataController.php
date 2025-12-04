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
            $response = Http::withoutVerifying()->get('https://data.somervillema.gov/resource/mtik-28va.json');
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

                    // Check if this light condition already exists
                    $exists = false;
                    foreach ($lightConditions as $existing) {
                        if ($existing['light_condition'] === $lightCondition) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $lightConditions[] = [
                            'id' => $id++,
                            'light_condition' => $lightCondition
                        ];

                        // Insert into database
                        DB::table('light_conditions')->insertOrIgnore([
                            'id' => $id - 1,
                            'light_condition' => $lightCondition
                        ]);
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
                        if ($existing['weather_condition'] === $weatherCondition) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $weatherConditions[] = [
                            'id' => $id++,
                            'weather_condition' => $weatherCondition
                        ];

                        // Insert into database
                        DB::table('weather_conditions')->insertOrIgnore([
                            'id' => $id - 1,
                            'weather_condition' => $weatherCondition
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
                        if ($existing['road_surface'] === $roadSurface) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $roadSurfaces[] = [
                            'id' => $id++,
                            'road_surface' => $roadSurface
                        ];

                        // Insert into database
                        DB::table('road_surface')->insertOrIgnore([
                            'id' => $id - 1,
                            'road_surface' => $roadSurface
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
                        if ($existing['tcd_type'] === $deviceType) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $trafficControlDevices[] = [
                            'id' => $id++,
                            'tcd_type' => $deviceType
                        ];

                        // Insert into database
                        DB::table('traffic_control_device_type')->insertOrIgnore([
                            'id' => $id - 1,
                            'tcd_type' => $deviceType
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
                        if ($existing['rwi_type'] === $intersectionType) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $intersectionTypes[] = [
                            'id' => $id++,
                            'rwi_type' => $intersectionType
                        ];

                        // Insert into database
                        DB::table('roadway_intersection_type')->insertOrIgnore([
                            'id' => $id - 1,
                            'rwi_type' => $intersectionType
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
                        if ($existing['trafficway'] === $roadType) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $roadTypes[] = [
                            'id' => $id++,
                            'trafficway' => $roadType
                        ];

                        // Insert into database
                        DB::table('trafficway')->insertOrIgnore([
                            'id' => $id - 1,
                            'trafficway' => $roadType
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
                        if ($existing['cm_type'] === $collisionType) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $collisionTypes[] = [
                            'id' => $id++,
                            'cm_type' => $collisionType
                        ];

                        // Insert into database
                        DB::table('collision_manner')->insertOrIgnore([
                            'id' => $id - 1,
                            'cm_type' => $collisionType
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
                        if ($existing['he_location'] === $location) {
                            $exists = true;
                            break;
                        }
                    }

                    if (!$exists) {
                        $eventLocations[] = [
                            'id' => $id++,
                            'he_location' => $location
                        ];

                        // Insert into database
                        DB::table('harmful_event_location')->insertOrIgnore([
                            'id' => $id - 1,
                            'he_location' => $location
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
                    'light_condition',
                    isset($incident['ambntlightdesc']) ? trim($incident['ambntlightdesc']) : ''
                );

                $weatherConditionId = $this->getCategoryIdByValue(
                    $categories['weather_conditions'],
                    'weather_condition',
                    isset($incident['weathcond1desc']) ? trim($incident['weathcond1desc']) : ''
                );

                $roadSurfaceId = $this->getCategoryIdByValue(
                    $categories['road_surfaces'],
                    'road_surface',
                    isset($incident['roadsurfdesc']) ? trim($incident['roadsurfdesc']) : ''
                );

                $trafficControlDeviceId = $this->getCategoryIdByValue(
                    $categories['traffic_control_devices'],
                    'tcd_type',
                    isset($incident['trafcntrltypedesc']) ? trim($incident['trafcntrltypedesc']) : ''
                );

                $intersectionTypeId = $this->getCategoryIdByValue(
                    $categories['intersection_types'],
                    'rwi_type',
                    isset($incident['rdwyjuncdesc']) ? trim($incident['rdwyjuncdesc']) : ''
                );

                $roadTypeId = $this->getCategoryIdByValue(
                    $categories['road_types'],
                    'trafficway',
                    isset($incident['trafydescrdesc']) ? trim($incident['trafydescrdesc']) : ''
                );

                $collisionTypeId = $this->getCategoryIdByValue(
                    $categories['collision_types'],
                    'cm_type',
                    isset($incident['manrcolldesc']) ? trim($incident['manrcolldesc']) : ''
                );

                $eventLocationId = $this->getCategoryIdByValue(
                    $categories['event_locations'],
                    'he_location',
                    isset($incident['hrmfeventdesc1']) ? trim($incident['hrmfeventdesc1']) : ''
                );

                $processedIncident = [
                    'id' => $id++,
                    'crash_num' => isset($incident['crashnum']) ? $incident['crashnum'] : null,
                    'incident_date' => isset($incident['dtcrash']) ? $incident['dtcrash'] : null,
                    'first_harmful_event' => isset($incident['hrmfeventdesc2']) ? trim($incident['hrmfeventdesc2']) : null,
                    'light_conditions_id' => $lightConditionId,
                    'weather_conditions_id' => $weatherConditionId,
                    'road_surface_id' => $roadSurfaceId,
                    'traffic_control_device_type_id' => $trafficControlDeviceId,
                    'roadway_intersection_type_id' => $intersectionTypeId,
                    'trafficway_id' => $roadTypeId,
                    'collision_manner_id' => $collisionTypeId,
                    'harmful_event_location_id' => $eventLocationId,
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

public function getDashboardMetrics()
{
    try {
        $base = DB::table('incidents_view');

        $insights = [
            'summary' => [
                'fatal_injuries' => DB::table('incidents_view')->sum('cnt_fatal_injury') ?? 0,
                'serious_injuries' => DB::table('incidents_view')->sum('cnt_sus_serious_injury') ?? 0,
                'minor_injuries' => DB::table('incidents_view')->sum('cnt_sus_minor_injury') ?? 0,
                'total_incidents' => DB::table('incidents_view')->count(),
            ],

            'by_weather' => DB::table('incidents_view')
                ->select('weather_condition', DB::raw('count(*) as total'))
                ->whereNotNull('weather_condition')
                ->groupBy('weather_condition')
                ->get(),

            'by_light' => DB::table('incidents_view')
                ->select('light_condition', DB::raw('count(*) as total'))
                ->whereNotNull('light_condition')
                ->groupBy('light_condition')
                ->get(),

            'by_collision' => DB::table('incidents_view')
                ->select('collision_manner', DB::raw('count(*) as total'))
                ->whereNotNull('collision_manner')
                ->groupBy('collision_manner')
                ->get(),

            'by_workzone' => DB::table('incidents_view')
                ->select('is_work_zone', DB::raw('count(*) as total'))
                ->groupBy('is_work_zone')
                ->get(),

            'monthly_trends' => DB::table('incidents_view')
                ->select(DB::raw("DATE_FORMAT(incident_date, '%Y-%m') as month"), DB::raw('count(*) as total'))
                ->whereNotNull('incident_date')
                ->groupBy('month')
                ->orderBy('month')
                ->get(),

            'geo_points' => DB::table('incidents_view')
                ->select('incident_id', 'incident_location', 'latitude', 'longitude', 'cnt_fatal_injury', 'cnt_sus_serious_injury')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->limit(2000)
                ->get(),
        ];

        // Log each data set
        Log::info('Summary:', $insights['summary']);
        Log::info('By Weather:', $insights['by_weather']->toArray());
        Log::info('By Light:', $insights['by_light']->toArray());
        Log::info('By Collision:', $insights['by_collision']->toArray());
        Log::info('By Workzone:', $insights['by_workzone']->toArray());
        Log::info('Monthly Trends:', $insights['monthly_trends']->toArray());
        Log::info('Geo Points Count:', ['count' => $insights['geo_points']->count()]);
        
        return response()->json([
            'success' => true,
            'data' => $insights
        ]);

    } catch (\Exception $e) {
        Log::error('Dashboard error: ' . $e->getMessage());
        Log::error('Line: ' . $e->getLine());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch dashboard metrics',
            'error' => $e->getMessage()
        ], 500);
    }
}
}
