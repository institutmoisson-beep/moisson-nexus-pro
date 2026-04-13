export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      career_bonuses: {
        Row: {
          bonus_amount: number
          career_level: Database["public"]["Enums"]["career_profile"]
          created_at: string
          id: string
          monthly_bonus: number
          requirements: string | null
        }
        Insert: {
          bonus_amount?: number
          career_level: Database["public"]["Enums"]["career_profile"]
          created_at?: string
          id?: string
          monthly_bonus?: number
          requirements?: string | null
        }
        Update: {
          bonus_amount?: number
          career_level?: Database["public"]["Enums"]["career_profile"]
          created_at?: string
          id?: string
          monthly_bonus?: number
          requirements?: string | null
        }
        Relationships: []
      }
      commission_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level_number: number
          percentage: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level_number: number
          percentage: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level_number?: number
          percentage?: number
        }
        Relationships: []
      }
      mlm_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      pack_commissions: {
        Row: {
          created_at: string
          id: string
          level_number: number
          pack_id: string
          percentage: number
        }
        Insert: {
          created_at?: string
          id?: string
          level_number: number
          pack_id: string
          percentage: number
        }
        Update: {
          created_at?: string
          id?: string
          level_number?: number
          pack_id?: string
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "pack_commissions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_orders: {
        Row: {
          amount_paid: number
          created_at: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_country: string | null
          delivery_phone: string | null
          delivery_street: string | null
          geolocation: Json | null
          id: string
          pack_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_phone?: string | null
          delivery_street?: string | null
          geolocation?: Json | null
          id?: string
          pack_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_phone?: string | null
          delivery_street?: string | null
          geolocation?: Json | null
          id?: string
          pack_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_orders_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_sectors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      packs: {
        Row: {
          commission_percentage: number
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_mlm_pack: boolean
          name: string
          partner_company_id: string | null
          physical_prizes: string | null
          price: number
          sector_id: string | null
          updated_at: string
        }
        Insert: {
          commission_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_mlm_pack?: boolean
          name: string
          partner_company_id?: string | null
          physical_prizes?: string | null
          price: number
          sector_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_mlm_pack?: boolean
          name?: string
          partner_company_id?: string | null
          physical_prizes?: string | null
          price?: number
          sector_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packs_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "pack_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_companies: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          id: string
          image1_url: string | null
          image2_url: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          partner_since: string
          phone: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          image1_url?: string | null
          image2_url?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          partner_since?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          image1_url?: string | null
          image2_url?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          partner_since?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      partner_products: {
        Row: {
          allow_cod: boolean
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          name: string
          partner_company_id: string
          price: number
          updated_at: string
        }
        Insert: {
          allow_cod?: boolean
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          name: string
          partner_company_id: string
          price?: number
          updated_at?: string
        }
        Update: {
          allow_cod?: boolean
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          name?: string
          partner_company_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_products_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          details: Json
          id: string
          is_active: boolean
          name: string
          payment_link: string | null
          type: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          is_active?: boolean
          name: string
          payment_link?: string | null
          type: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          is_active?: boolean
          name?: string
          payment_link?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          career_level: Database["public"]["Enums"]["career_profile"]
          city: string | null
          country: string | null
          created_at: string
          email: string
          first_name: string
          geolocation: Json | null
          id: string
          is_mlm_active: boolean
          is_pro_visible: boolean
          is_suspended: boolean
          last_name: string
          phone: string | null
          preferred_currency: string
          referral_code: string
          referred_by: string | null
          street: string | null
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          career_level?: Database["public"]["Enums"]["career_profile"]
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_name: string
          geolocation?: Json | null
          id?: string
          is_mlm_active?: boolean
          is_pro_visible?: boolean
          is_suspended?: boolean
          last_name: string
          phone?: string | null
          preferred_currency?: string
          referral_code: string
          referred_by?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          career_level?: Database["public"]["Enums"]["career_profile"]
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string
          geolocation?: Json | null
          id?: string
          is_mlm_active?: boolean
          is_pro_visible?: boolean
          is_suspended?: boolean
          last_name?: string
          phone?: string | null
          preferred_currency?: string
          referral_code?: string
          referred_by?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          payment_method_id: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_contact: string | null
          transaction_id_external: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_contact?: string | null
          transaction_id_external?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_contact?: string | null
          transaction_id_external?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      career_profile:
        | "semeur"
        | "cultivateur"
        | "moissonneur"
        | "guide_de_champ"
        | "maitre_moissonneur"
        | "grand_moissonneur"
        | "ambassadeur_moisson"
        | "stratege_moisson"
        | "elite_moisson"
        | "guide_moissonneur"
      transaction_status: "pending" | "approved" | "rejected"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "pack_purchase"
        | "commission"
        | "bonus"
        | "admin_credit"
        | "admin_debit"
        | "transfer"
        | "product_purchase"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      career_profile: [
        "semeur",
        "cultivateur",
        "moissonneur",
        "guide_de_champ",
        "maitre_moissonneur",
        "grand_moissonneur",
        "ambassadeur_moisson",
        "stratege_moisson",
        "elite_moisson",
        "guide_moissonneur",
      ],
      transaction_status: ["pending", "approved", "rejected"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "pack_purchase",
        "commission",
        "bonus",
        "admin_credit",
        "admin_debit",
        "transfer",
        "product_purchase",
      ],
    },
  },
} as const
