
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, phone, country, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'country', NULL),
    public.generate_referral_code(),
    CASE 
      WHEN NEW.raw_user_meta_data->>'referred_by' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'referred_by' != '' 
      THEN (NEW.raw_user_meta_data->>'referred_by')::uuid 
      ELSE NULL 
    END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;
