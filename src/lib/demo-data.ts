// Stub temporaire — les vraies données viennent désormais de Supabase.
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  wallet_balance?: number;
}

export interface Pack {
  id: string;
  name: string;
  description?: string;
  price: number;
  benefit: number;
  level1_commission_percent: number;
  decay_factor: number;
  min_commission: number;
  is_active: boolean;
  partner_companies?: { name: string } | null;
}

export interface Commission {
  id: string;
  user_id: string;
  amount: number;
  status: string;
}

export const getPacks = (): Pack[] => [];
export const getCommissions = (): Commission[] => [];
export const createPack = (_: Partial<Pack>) => {};
export const updatePack = (_id: string, _: Partial<Pack>) => {};
export const deletePack = (_id: string) => {};
