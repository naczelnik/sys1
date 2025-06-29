/*
  # Dodanie pola account_expires_at

  1. Nowe pole
    - account_expires_at w tabeli profiles
    - Indeks dla wydajności
*/

-- Dodaj pole account_expires_at do tabeli profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_expires_at timestamptz;
  END IF;
END $$;

-- Dodaj indeks dla wydajności
CREATE INDEX IF NOT EXISTS idx_profiles_account_expires_at ON profiles(account_expires_at);
