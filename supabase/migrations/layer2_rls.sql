-- Enable RLS on all new tables
ALTER TABLE engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_profiles ENABLE ROW LEVEL SECURITY;

-- engines: access via aircraft ownership (owner_id on aircraft table)
CREATE POLICY "Users can view engines for own aircraft"
  ON engines FOR SELECT
  USING (aircraft_id IN (SELECT id FROM aircraft WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert engines for own aircraft"
  ON engines FOR INSERT
  WITH CHECK (aircraft_id IN (SELECT id FROM aircraft WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update engines for own aircraft"
  ON engines FOR UPDATE
  USING (aircraft_id IN (SELECT id FROM aircraft WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete engines for own aircraft"
  ON engines FOR DELETE
  USING (aircraft_id IN (SELECT id FROM aircraft WHERE owner_id = auth.uid()));

-- expenses: users can manage expenses they recorded
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (recorded_by = auth.uid());

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (recorded_by = auth.uid());

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (recorded_by = auth.uid());

-- cost_profiles: users can manage cost profiles they own
CREATE POLICY "Users can view own cost profiles"
  ON cost_profiles FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own cost profiles"
  ON cost_profiles FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own cost profiles"
  ON cost_profiles FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own cost profiles"
  ON cost_profiles FOR DELETE
  USING (owner_id = auth.uid());
