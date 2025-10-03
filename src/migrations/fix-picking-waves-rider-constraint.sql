-- Migration: Fix picking_waves table foreign key constraint for riderId
-- This changes the riderId constraint to reference 'riders' table instead of 'Users' table

-- Drop the existing foreign key constraint
ALTER TABLE picking_waves DROP FOREIGN KEY picking_waves_ibfk_2;

-- Add the new foreign key constraint referencing riders table
ALTER TABLE picking_waves 
ADD CONSTRAINT picking_waves_rider_id_fk 
FOREIGN KEY (riderId) REFERENCES riders(id);
