/*
  # Create Game Rule Evaluations Table

  1. New Tables
    - `game_rule_evaluations`
      - `id` (uuid, primary key)
      - `user_id` (text, foreign key to users)
      - `game_type` (text)
      - `currency_code` (text)
      - `balance` (numeric)
      - `bet_amount` (numeric)
      - `usd_threshold` (numeric)
      - `local_threshold` (numeric)
      - `balance_in_usd` (numeric)
      - `exchange_rate` (numeric)
      - `rule_mode` (text - UNDER_THRESHOLD or FORCED_LOSS)
      - `win_probability` (numeric)
      - `result` (boolean - true for win, false for loss)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `game_rule_evaluations` table
    - Add policy for authenticated users to read their own evaluations
    - Add policy for admin to read all evaluations
*/

CREATE TABLE IF NOT EXISTS game_rule_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  game_type text NOT NULL,
  currency_code text NOT NULL,
  balance numeric NOT NULL,
  bet_amount numeric NOT NULL,
  usd_threshold numeric NOT NULL,
  local_threshold numeric NOT NULL,
  balance_in_usd numeric NOT NULL,
  exchange_rate numeric NOT NULL,
  rule_mode text NOT NULL CHECK (rule_mode IN ('UNDER_THRESHOLD', 'FORCED_LOSS')),
  win_probability numeric NOT NULL,
  result boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_rule_evaluations_user_id ON game_rule_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rule_evaluations_game_type ON game_rule_evaluations(game_type);
CREATE INDEX IF NOT EXISTS idx_game_rule_evaluations_rule_mode ON game_rule_evaluations(rule_mode);
CREATE INDEX IF NOT EXISTS idx_game_rule_evaluations_created_at ON game_rule_evaluations(created_at DESC);

ALTER TABLE game_rule_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations"
  ON game_rule_evaluations FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Admin can view all evaluations"
  ON game_rule_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "System can insert evaluations"
  ON game_rule_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (true);
