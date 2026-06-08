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
      business_orders: {
        Row: {
          bonus_amount: number
          bonus_paid: boolean
          bonus_percent: number
          completed_at: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          id: string
          notes: string | null
          pack_id: string | null
          processed_by: string | null
          product_description: string
          quantity: number
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_amount?: number
          bonus_paid?: boolean
          bonus_percent?: number
          completed_at?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          id?: string
          notes?: string | null
          pack_id?: string | null
          processed_by?: string | null
          product_description: string
          quantity?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_amount?: number
          bonus_paid?: boolean
          bonus_percent?: number
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          id?: string
          notes?: string | null
          pack_id?: string | null
          processed_by?: string | null
          product_description?: string
          quantity?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_orders_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      commissions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          level: number | null
          paid_at: string | null
          source_id: string | null
          source_name: string | null
          source_table: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          level?: number | null
          paid_at?: string | null
          source_id?: string | null
          source_name?: string | null
          source_table?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          level?: number | null
          paid_at?: string | null
          source_id?: string | null
          source_name?: string | null
          source_table?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_fund: {
        Row: {
          balance: number
          id: number
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      distribution_orders: {
        Row: {
          commission_amount: number | null
          created_at: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_phone: string | null
          id: string
          product_id: string
          quantity: number
          status: string | null
          total_amount: number
          unit_price: number
          user_id: string
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_phone?: string | null
          id?: string
          product_id: string
          quantity?: number
          status?: string | null
          total_amount?: number
          unit_price?: number
          user_id: string
        }
        Update: {
          commission_amount?: number | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_phone?: string | null
          id?: string
          product_id?: string
          quantity?: number
          status?: string | null
          total_amount?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "distribution_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_products: {
        Row: {
          category: string | null
          commission_percent: number | null
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          name: string
          price: number
          stock: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          name: string
          price?: number
          stock?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          name?: string
          price?: number
          stock?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fund_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          reason: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          reason?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          reason?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      mandate_packs: {
        Row: {
          commission_every_3_days: number
          created_at: string
          description: string | null
          duration_days: number
          id: string
          images: string[] | null
          is_active: boolean
          name: string
          price_fcfa: number
          price_msn_coins: number | null
          stock_available: number | null
          updated_at: string
        }
        Insert: {
          commission_every_3_days?: number
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          images?: string[] | null
          is_active?: boolean
          name: string
          price_fcfa?: number
          price_msn_coins?: number | null
          stock_available?: number | null
          updated_at?: string
        }
        Update: {
          commission_every_3_days?: number
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          images?: string[] | null
          is_active?: boolean
          name?: string
          price_fcfa?: number
          price_msn_coins?: number | null
          stock_available?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      mandate_subscriptions: {
        Row: {
          amount_paid: number
          coins_used: number | null
          created_at: string
          end_date: string
          id: string
          last_commission_date: string | null
          last_commission_paid_at: string | null
          mandate_pack_id: string
          next_commission_date: string | null
          payment_method: string
          status: string
          total_commissions_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          coins_used?: number | null
          created_at?: string
          end_date: string
          id?: string
          last_commission_date?: string | null
          last_commission_paid_at?: string | null
          mandate_pack_id: string
          next_commission_date?: string | null
          payment_method?: string
          status?: string
          total_commissions_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          coins_used?: number | null
          created_at?: string
          end_date?: string
          id?: string
          last_commission_date?: string | null
          last_commission_paid_at?: string | null
          mandate_pack_id?: string
          next_commission_date?: string | null
          payment_method?: string
          status?: string
          total_commissions_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandate_subscriptions_mandate_pack_id_fkey"
            columns: ["mandate_pack_id"]
            isOneToOne: false
            referencedRelation: "mandate_packs"
            referencedColumns: ["id"]
          },
        ]
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
      mlm_nodes: {
        Row: {
          accumulated_pv_left: number | null
          accumulated_pv_right: number | null
          created_at: string | null
          current_rank: string | null
          id: string
          parent_id: string | null
          position: string | null
          profile_id: string
          sponsor_id: string | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          accumulated_pv_left?: number | null
          accumulated_pv_right?: number | null
          created_at?: string | null
          current_rank?: string | null
          id?: string
          parent_id?: string | null
          position?: string | null
          profile_id: string
          sponsor_id?: string | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          accumulated_pv_left?: number | null
          accumulated_pv_right?: number | null
          created_at?: string | null
          current_rank?: string | null
          id?: string
          parent_id?: string | null
          position?: string | null
          profile_id?: string
          sponsor_id?: string | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mlm_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mlm_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mlm_nodes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mlm_nodes_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      msn_coins: {
        Row: {
          coins: number
          created_at: string
          id: string
          is_converted: boolean
          source_order_id: string | null
          source_type: string
          source_user_id: string | null
          user_id: string
        }
        Insert: {
          coins?: number
          created_at?: string
          id?: string
          is_converted?: boolean
          source_order_id?: string | null
          source_type?: string
          source_user_id?: string | null
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          is_converted?: boolean
          source_order_id?: string | null
          source_type?: string
          source_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      msn_config: {
        Row: {
          id: string
          key: string
          label: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          label?: string | null
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          label?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      msn_conversions: {
        Row: {
          coins_used: number
          created_at: string
          dollar_amount: number
          id: string
          status: string
          user_id: string
        }
        Insert: {
          coins_used: number
          created_at?: string
          dollar_amount: number
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          coins_used?: number
          created_at?: string
          dollar_amount?: number
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      msn_withdrawals: {
        Row: {
          admin_note: string | null
          coins_amount: number
          created_at: string
          currency_amount: number
          currency_code: string
          id: string
          payment_contact: string
          payment_service: string
          processed_at: string | null
          processed_by: string | null
          status: string
          usd_rate: number
          user_id: string
          xof_rate: number
        }
        Insert: {
          admin_note?: string | null
          coins_amount: number
          created_at?: string
          currency_amount?: number
          currency_code?: string
          id?: string
          payment_contact: string
          payment_service: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          usd_rate?: number
          user_id: string
          xof_rate?: number
        }
        Update: {
          admin_note?: string | null
          coins_amount?: number
          created_at?: string
          currency_amount?: number
          currency_code?: string
          id?: string
          payment_contact?: string
          payment_service?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          usd_rate?: number
          user_id?: string
          xof_rate?: number
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
          user_note: string | null
          user_rating: number | null
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
          user_note?: string | null
          user_rating?: number | null
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
          user_note?: string | null
          user_rating?: number | null
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
          benefit: number | null
          commission_percentage: number
          created_at: string
          decay_factor: number | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_mlm_pack: boolean
          level1_commission_percent: number | null
          min_commission: number | null
          name: string
          partner_company_id: string | null
          physical_prizes: string | null
          price: number
          pv_value: number | null
          sector_id: string | null
          updated_at: string
        }
        Insert: {
          benefit?: number | null
          commission_percentage?: number
          created_at?: string
          decay_factor?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_mlm_pack?: boolean
          level1_commission_percent?: number | null
          min_commission?: number | null
          name: string
          partner_company_id?: string | null
          physical_prizes?: string | null
          price: number
          pv_value?: number | null
          sector_id?: string | null
          updated_at?: string
        }
        Update: {
          benefit?: number | null
          commission_percentage?: number
          created_at?: string
          decay_factor?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_mlm_pack?: boolean
          level1_commission_percent?: number | null
          min_commission?: number | null
          name?: string
          partner_company_id?: string | null
          physical_prizes?: string | null
          price?: number
          pv_value?: number | null
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
          digital_content: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_digital: boolean
          name: string
          partner_company_id: string
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          allow_cod?: boolean
          created_at?: string
          description?: string | null
          digital_content?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_digital?: boolean
          name: string
          partner_company_id: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          allow_cod?: boolean
          created_at?: string
          description?: string | null
          digital_content?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_digital?: boolean
          name?: string
          partner_company_id?: string
          price?: number
          stock?: number | null
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
      product_purchases: {
        Row: {
          amount_paid: number
          created_at: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_country: string | null
          delivery_phone: string | null
          digital_content: string | null
          id: string
          is_digital: boolean
          partner_company_id: string
          product_id: string
          product_name: string
          status: string
          updated_at: string
          user_id: string
          user_note: string | null
          user_rating: number | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_phone?: string | null
          digital_content?: string | null
          id?: string
          is_digital?: boolean
          partner_company_id: string
          product_id: string
          product_name: string
          status?: string
          updated_at?: string
          user_id: string
          user_note?: string | null
          user_rating?: number | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_phone?: string | null
          digital_content?: string | null
          id?: string
          is_digital?: boolean
          partner_company_id?: string
          product_id?: string
          product_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          user_note?: string | null
          user_rating?: number | null
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
          est_souverain: boolean
          first_name: string
          geolocation: Json | null
          id: string
          id_card_back_url: string | null
          id_card_front_url: string | null
          id_moissonneur: string | null
          is_mlm_active: boolean
          is_pro_visible: boolean
          is_suspended: boolean
          is_verified: boolean
          last_name: string
          phone: string | null
          preferred_currency: string
          referral_code: string
          referred_by: string | null
          street: string | null
          updated_at: string
          user_id: string
          verification_token: string
          verified_at: string | null
          verified_by: string | null
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
          est_souverain?: boolean
          first_name: string
          geolocation?: Json | null
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          id_moissonneur?: string | null
          is_mlm_active?: boolean
          is_pro_visible?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          last_name: string
          phone?: string | null
          preferred_currency?: string
          referral_code: string
          referred_by?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
          verification_token?: string
          verified_at?: string | null
          verified_by?: string | null
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
          est_souverain?: boolean
          first_name?: string
          geolocation?: Json | null
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          id_moissonneur?: string | null
          is_mlm_active?: boolean
          is_pro_visible?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          last_name?: string
          phone?: string | null
          preferred_currency?: string
          referral_code?: string
          referred_by?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
          verification_token?: string
          verified_at?: string | null
          verified_by?: string | null
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
      regional_moderation_log: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string
          moderator_role: string
          moderator_user_id: string
          motif: string | null
          reason: string | null
          scope: string
          scope_value: string
          target_user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id: string
          moderator_role: string
          moderator_user_id: string
          motif?: string | null
          reason?: string | null
          scope?: string
          scope_value: string
          target_user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string
          moderator_role?: string
          moderator_user_id?: string
          motif?: string | null
          reason?: string | null
          scope?: string
          scope_value?: string
          target_user_id?: string
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          assigned_city: string | null
          assigned_country: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_city?: string | null
          assigned_country?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_city?: string | null
          assigned_country?: string | null
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
      urgent_case_responses: {
        Row: {
          case_id: string
          created_at: string
          id: string
          images: string[] | null
          message: string
          responder_id: string
          responder_role: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          images?: string[] | null
          message: string
          responder_id: string
          responder_role?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          images?: string[] | null
          message?: string
          responder_id?: string
          responder_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "urgent_case_responses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "urgent_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      urgent_cases: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          phone: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          phone?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          phone?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_agreements: {
        Row: {
          accepted_at: string
          agreement_type: string
          created_at: string
          id: string
          ip_hint: string | null
          signature_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          agreement_type: string
          created_at?: string
          id?: string
          ip_hint?: string | null
          signature_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          agreement_type?: string
          created_at?: string
          id?: string
          ip_hint?: string | null
          signature_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      wholesale_orders: {
        Row: {
          agent_id: string | null
          commission_amount: number | null
          created_at: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_phone: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          status: string | null
          total_amount: number
          unit_price: number
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_phone?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          status?: string | null
          total_amount?: number
          unit_price?: number
          user_id: string
        }
        Update: {
          agent_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_phone?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          status?: string | null
          total_amount?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wholesale_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "wholesale_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wholesale_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wholesale_products: {
        Row: {
          bulk_price: number
          category: string | null
          commission_percent: number | null
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          min_quantity: number
          name: string
          partner_id: string | null
          partner_name: string | null
          stock: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          bulk_price?: number
          category?: string | null
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          min_quantity?: number
          name: string
          partner_id?: string | null
          partner_name?: string | null
          stock?: number
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          bulk_price?: number
          category?: string | null
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          min_quantity?: number
          name?: string
          partner_id?: string | null
          partner_name?: string | null
          stock?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_products_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      business_agent_leaderboard: {
        Row: {
          agent_name: string | null
          career_level: Database["public"]["Enums"]["career_profile"] | null
          completed_orders: number | null
          total_bonus_earned: number | null
          total_orders: number | null
          user_id: string | null
        }
        Relationships: []
      }
      partner_products_public: {
        Row: {
          allow_cod: boolean | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          is_digital: boolean | null
          name: string | null
          partner_company_id: string | null
          price: number | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          allow_cod?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_digital?: boolean | null
          name?: string | null
          partner_company_id?: string | null
          price?: number | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_cod?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_digital?: boolean | null
          name?: string | null
          partner_company_id?: string | null
          price?: number | null
          stock?: number | null
          updated_at?: string | null
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
      regional_staff_view: {
        Row: {
          assigned_city: string | null
          assigned_country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_partner_product: {
        Args: { _id: string }
        Returns: {
          allow_cod: boolean
          created_at: string
          description: string | null
          digital_content: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_digital: boolean
          name: string
          partner_company_id: string
          price: number
          stock: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_withdraw_from_fund: {
        Args: { _amount: number; _reason: string }
        Returns: Json
      }
      award_msn_coins: {
        Args: { _buyer_user_id: string; _order_id: string }
        Returns: undefined
      }
      calculate_pack_commissions: {
        Args: {
          p_benefit: number
          p_decay_factor: number
          p_level1_percent: number
          p_min_commission: number
        }
        Returns: {
          amount: number
          level: number
          percentage: number
        }[]
      }
      can_access_urgent_case: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      check_binary_pairs: { Args: { p_node_id: string }; Returns: undefined }
      contribute_to_fund: { Args: { _amount: number }; Returns: Json }
      distribute_binary_pv: {
        Args: { p_purchaser_profile_id: string; p_pv_amount: number }
        Returns: undefined
      }
      distribute_commissions:
        | {
            Args: {
              _buyer_user_id: string
              _pack_id: string
              _pack_name: string
              _pack_price: number
            }
            Returns: undefined
          }
        | {
            Args: {
              _buyer_user_id: string
              _pack_id: string
              _pack_name: string
              _pack_price: number
            }
            Returns: undefined
          }
      distribute_matching_bonus: {
        Args: { p_earned_amount: number; p_earner_id: string }
        Returns: undefined
      }
      distribute_mlm_commissions: {
        Args: { p_order_id: string; p_pack_id: string; p_purchaser_id: string }
        Returns: {
          amount: number
          level: number
          recipient_id: string
          status: string
        }[]
      }
      generate_referral_code: { Args: never; Returns: string }
      get_sponsor_at_level: {
        Args: { p_profile_id: string; p_target_level: number }
        Returns: string
      }
      get_user_network: {
        Args: { p_user_id: string }
        Returns: {
          career_level: string
          email: string
          full_name: string
          is_mlm_active: boolean
          level: number
          position: string
          profile_id: string
          referral_code: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_referral_code: { Args: { _code: string }; Returns: string }
      process_mandate_commissions: { Args: never; Returns: number }
      process_pack_purchase: {
        Args: { p_pack_id: string; p_user_id: string }
        Returns: Json
      }
      purchase_partner_product: {
        Args: { _delivery?: Json; _product_id: string }
        Returns: Json
      }
      regional_set_suspension: {
        Args: { _reason?: string; _suspend: boolean; _target_user_id: string }
        Returns: undefined
      }
      verify_moissonneur: {
        Args: { _token: string }
        Returns: {
          avatar_url: string
          career_level: string
          est_souverain: boolean
          full_name: string
          id_moissonneur: string
          is_mlm_active: boolean
          is_suspended: boolean
        }[]
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
        | "fund_contribution"
        | "fund_withdrawal"
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
        "fund_contribution",
        "fund_withdrawal",
      ],
    },
  },
} as const
