ALTER TABLE channels ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'All';

-- Assign categories based on name keywords
UPDATE channels SET category = 'News' WHERE name ILIKE '%news%' OR name ILIKE '%bloomberg%' OR name ILIKE '%cbs%' OR name ILIKE '%abc%';
UPDATE channels SET category = 'Kids' WHERE name ILIKE '%kids%' OR name ILIKE '%cartoon%' OR name ILIKE '%pokemon%' OR name ILIKE '%lego%';
UPDATE channels SET category = 'Movies' WHERE name ILIKE '%movie%' OR name ILIKE '%cinema%' OR name ILIKE '%film%';
UPDATE channels SET category = 'Sports' WHERE name ILIKE '%sport%' OR name ILIKE '%golf%' OR name ILIKE '%billiard%' OR name ILIKE '%acc%';
UPDATE channels SET category = 'Music' WHERE name ILIKE '%music%' OR name ILIKE '%mtv%' OR name ILIKE '%vevo%' OR name ILIKE '%revolt%';

-- Everything else into Entertainment
UPDATE channels SET category = 'Entertainment' WHERE category = 'All' AND name != 'All';

-- Explicit overrides
UPDATE channels SET category = 'Movies' WHERE name = 'Black Cinema Classics';
UPDATE channels SET category = 'Entertainment' WHERE name = 'J-Tube Originals';
