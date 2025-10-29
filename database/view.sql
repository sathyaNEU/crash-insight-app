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
    i.latitute,
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
