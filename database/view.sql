CREATE OR REPLACE VIEW incidents_view AS
SELECT 
    i.id AS incident_id,
    i.crash_num,
    i.incident_date,
    i.first_harmful_event,
    i.is_work_zone,
    i.cnt_fatal_injury,
    i.cnt_sus_serious_injury,
    i.cnt_sus_minor_injury,
    i.cnt_pedestrian,
    i.cnt_cyclist,
    i.is_hit_and_run,
    i.incident_location,
    i.latitude,
    i.longitude,

    -- Dimension lookups
    lc.light_condition,
    wc.weather_condition,
    rs.road_surface,
    tcd.tcd_type AS traffic_control_device_type,
    rwi.rwi_type AS roadway_intersection_type,
    tw.trafficway AS trafficway_type,
    cm.cm_type AS collision_manner,
    he.he_location AS harmful_event_location

FROM incidents i
LEFT JOIN light_conditions lc 
    ON i.light_conditions_id = lc.id
LEFT JOIN weather_conditions wc 
    ON i.weather_conditions_id = wc.id
LEFT JOIN road_surface rs 
    ON i.road_surface_id = rs.id
LEFT JOIN traffic_control_device_type tcd 
    ON i.traffic_control_device_type_id = tcd.id
LEFT JOIN roadway_intersection_type rwi 
    ON i.roadway_intersection_type_id = rwi.id
LEFT JOIN trafficway tw 
    ON i.trafficway_id = tw.id
LEFT JOIN collision_manner cm 
    ON i.collision_manner_id = cm.id
LEFT JOIN harmful_event_location he 
    ON i.harmful_event_location_id = he.id;


-- Report 1: Identify incidents with fatalities or serious injuries 
-- that occurred under ideal conditions (clear weather, daylight, dry roads, no work zone)
CREATE OR REPLACE VIEW report_1 AS 
SELECT *
FROM incidents_view
WHERE light_condition = 'DAYLIGHT'
  AND weather_condition = 'CLEAR'
  AND road_surface = 'DRY'
  AND is_work_zone = 'N'
  AND (cnt_fatal_injury + cnt_sus_serious_injury) > 0;


-- Report 2: Retrieve sample crash records that occurred inside work zones
CREATE OR REPLACE VIEW report_2 AS
SELECT *
FROM incidents_view
WHERE is_work_zone = 'Y'
LIMIT 10;


-- Report 3: List hit-and-run incidents involving collisions with parked motor vehicles
CREATE OR REPLACE VIEW report_3 AS
SELECT *
FROM incidents_view
WHERE first_harmful_event = 'COLLISION WITH PARKED MOTOR VEHICLE'
  AND is_hit_and_run = 'Y';
