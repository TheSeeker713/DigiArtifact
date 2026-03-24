CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_checked INTEGER NOT NULL DEFAULT 0 CHECK (is_checked IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO checklist_items (id, section, label, sort_order)
VALUES
  ('bathroom_wall_paper', 'Bathroom', 'wall paper', 1),
  ('bathroom_shelf', 'Bathroom', 'shelf', 2),
  ('bathroom_bathtub', 'Bathroom', 'bathtub', 3),
  ('bathroom_shower_curtain', 'Bathroom', 'shower curtain', 4),
  ('bathroom_sweep_and_mop', 'Bathroom', 'sweep and mop', 5),
  ('bathroom_hang_picture', 'Bathroom', 'hang picture', 6),
  ('kitchen_clean_fan_thingy', 'Kitchen', 'clean fan thingy', 1),
  ('kitchen_water_removed_from_top_of_fridge', 'Kitchen', 'water removed from top of fridge', 2),
  ('kitchen_sweep_and_mop', 'Kitchen', 'sweep and mop', 3),
  ('kitchen_bake_a_cake', 'Kitchen', 'bake a cake', 4),
  ('living_room_charging_extension_cord', 'Living Room', 'charging extension cord', 1),
  ('living_room_desk_area_cleaned', 'Living Room', 'desk area cleaned', 2),
  ('living_room_weights_moved_to_desk_area', 'Living Room', 'weights moved to desk area', 3),
  ('living_room_dust', 'Living Room', 'dust', 4),
  ('living_room_put_away_jackets', 'Living Room', 'put away jackets', 5),
  ('living_room_fix_rack', 'Living Room', 'fix rack', 6),
  ('living_room_add_hat_pegs', 'Living Room', 'add hat pegs', 7),
  ('main_bedroom_move_things_to_bathroom', 'Main Bedroom', 'move things to bathroom', 1),
  ('main_bedroom_sweep', 'Main Bedroom', 'sweep', 2),
  ('main_bedroom_vacuum', 'Main Bedroom', 'vacuum', 3),
  ('main_bedroom_mop', 'Main Bedroom', 'mop', 4),
  ('main_bedroom_dust', 'Main Bedroom', 'dust', 5),
  ('main_bedroom_wash_bedding', 'Main Bedroom', 'wash bedding', 6);
