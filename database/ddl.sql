-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema app_db
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `app_db` ;

-- -----------------------------------------------------
-- Schema app_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `app_db` DEFAULT CHARACTER SET utf8 ;
USE `app_db` ;

-- -----------------------------------------------------
-- Table `app_db`.`light_conditions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`light_conditions` ;

CREATE TABLE IF NOT EXISTS `app_db`.`light_conditions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `light_condition` VARCHAR(50) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`weather_conditions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`weather_conditions` ;

CREATE TABLE IF NOT EXISTS `app_db`.`weather_conditions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `weather_condition` VARCHAR(50) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`road_surface`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`road_surface` ;

CREATE TABLE IF NOT EXISTS `app_db`.`road_surface` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `road_surface` VARCHAR(50) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`traffic_control_device_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`traffic_control_device_type` ;

CREATE TABLE IF NOT EXISTS `app_db`.`traffic_control_device_type` (
  `id` INT NOT NULL,
  `tcd_type` VARCHAR(50) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`roadway_intersection_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`roadway_intersection_type` ;

CREATE TABLE IF NOT EXISTS `app_db`.`roadway_intersection_type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rwi_type` VARCHAR(50) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`trafficway`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`trafficway` ;

CREATE TABLE IF NOT EXISTS `app_db`.`trafficway` (
  `id` INT NOT NULL,
  `trafficway` VARCHAR(50) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`collision_manner`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`collision_manner` ;

CREATE TABLE IF NOT EXISTS `app_db`.`collision_manner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cm_type` VARCHAR(50) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`harmful_event_location`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`harmful_event_location` ;

CREATE TABLE IF NOT EXISTS `app_db`.`harmful_event_location` (
  `id` INT NOT NULL,
  `he_location` VARCHAR(255) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `app_db`.`incidents`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `app_db`.`incidents` ;

CREATE TABLE IF NOT EXISTS `app_db`.`incidents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `crash_num` INT NULL,
  `incident_date` DATETIME NULL,
  `first_harmful_event` VARCHAR(255) NULL,
  `dim_location_id` INT NOT NULL,
  `light_conditions_id` INT NOT NULL,
  `weather_conditions_id` INT NOT NULL,
  `road_surface_id` INT NOT NULL,
  `traffic_control_device_type_id` INT NOT NULL,
  `roadway_intersection_type_id` INT NOT NULL,
  `trafficway_id` INT NOT NULL,
  `collision_manner_id` INT NOT NULL,
  `harmful_event_location_id` INT NOT NULL,
  `is_work_zone` VARCHAR(1) NULL,
  `cnt_fatal_injury` INT NULL,
  `cnt_sus_serious_injury` INT NULL,
  `cnt_sus_minor_injury` INT NULL,
  `cnt_pedestrian` INT NULL,
  `cnt_cyclist` INT NULL,
  `is_hit_and_run` VARCHAR(1) NULL,
  `incident_location` VARCHAR(255) NULL,
  `latitute` DECIMAL NULL,
  `longitude` DECIMAL NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_fact_incident_dim_light_conditions1_idx` (`light_conditions_id` ASC) VISIBLE,
  INDEX `fk_fact_incident_dim_weather_conditions1_idx` (`weather_conditions_id` ASC) VISIBLE,
  INDEX `fk_fact_incident_dim_road_surface1_idx` (`road_surface_id` ASC) VISIBLE,
  INDEX `fk_fact_incident_dim_traffic_control_device_type1_idx` (`traffic_control_device_type_id` ASC) VISIBLE,
  INDEX `fk_fact_incident_dim_roadway_intersection_type1_idx` (`roadway_intersection_type_id` ASC) VISIBLE,
  INDEX `fk_fact_incident_dim_trafficway1_idx` (`trafficway_id` ASC) VISIBLE,
  INDEX `fk_fact_incident_dim_collision_manner1_idx` (`collision_manner_id` ASC) VISIBLE,
  INDEX `fk_fact_incident_dim_harmful_event_location1_idx` (`harmful_event_location_id` ASC) VISIBLE,
  CONSTRAINT `fk_fact_incident_dim_light_conditions1`
    FOREIGN KEY (`light_conditions_id`)
    REFERENCES `app_db`.`light_conditions` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fact_incident_dim_weather_conditions1`
    FOREIGN KEY (`weather_conditions_id`)
    REFERENCES `app_db`.`weather_conditions` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fact_incident_dim_road_surface1`
    FOREIGN KEY (`road_surface_id`)
    REFERENCES `app_db`.`road_surface` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fact_incident_dim_traffic_control_device_type1`
    FOREIGN KEY (`traffic_control_device_type_id`)
    REFERENCES `app_db`.`traffic_control_device_type` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fact_incident_dim_roadway_intersection_type1`
    FOREIGN KEY (`roadway_intersection_type_id`)
    REFERENCES `app_db`.`roadway_intersection_type` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fact_incident_dim_trafficway1`
    FOREIGN KEY (`trafficway_id`)
    REFERENCES `app_db`.`trafficway` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fact_incident_dim_collision_manner1`
    FOREIGN KEY (`collision_manner_id`)
    REFERENCES `app_db`.`collision_manner` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fact_incident_dim_harmful_event_location1`
    FOREIGN KEY (`harmful_event_location_id`)
    REFERENCES `app_db`.`harmful_event_location` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
