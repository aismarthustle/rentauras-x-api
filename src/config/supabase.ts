import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client with anon key for user operations
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];
if (!supabaseAnonKey) {
  logger.error('Missing Supabase anon key. Please check your environment variables.');
  process.exit(1);
}

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone: string;
          full_name: string;
          role: 'passenger' | 'driver' | 'admin';
          status: 'active' | 'inactive' | 'suspended';
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone: string;
          full_name: string;
          role?: 'passenger' | 'driver' | 'admin';
          status?: 'active' | 'inactive' | 'suspended';
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          full_name?: string;
          role?: 'passenger' | 'driver' | 'admin';
          status?: 'active' | 'inactive' | 'suspended';
          avatar_url?: string;
          updated_at?: string;
        };
      };
      rides: {
        Row: {
          id: string;
          passenger_id: string;
          driver_id?: string;
          status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          category: 'classic_ev' | 'comfort_ev' | 'express_ev';
          pickup_latitude: number;
          pickup_longitude: number;
          pickup_address: string;
          dropoff_latitude: number;
          dropoff_longitude: number;
          dropoff_address: string;
          estimated_price: number;
          final_price?: number;
          distance_km: number;
          duration_minutes?: number;
          scheduled_at?: string;
          women_only: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passenger_id: string;
          driver_id?: string;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          category: 'classic_ev' | 'comfort_ev' | 'express_ev';
          pickup_latitude: number;
          pickup_longitude: number;
          pickup_address: string;
          dropoff_latitude: number;
          dropoff_longitude: number;
          dropoff_address: string;
          estimated_price: number;
          final_price?: number;
          distance_km: number;
          duration_minutes?: number;
          scheduled_at?: string;
          women_only?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          driver_id?: string;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          final_price?: number;
          duration_minutes?: number;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          driver_id: string;
          make: string;
          model: string;
          year: number;
          color: string;
          license_plate: string;
          category: 'classic_ev' | 'comfort_ev' | 'express_ev';
          is_electric: boolean;
          is_hybrid: boolean;
          status: 'active' | 'inactive' | 'maintenance';
          photos: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          make: string;
          model: string;
          year: number;
          color: string;
          license_plate: string;
          category: 'classic_ev' | 'comfort_ev' | 'express_ev';
          is_electric?: boolean;
          is_hybrid?: boolean;
          status?: 'active' | 'inactive' | 'maintenance';
          photos?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          make?: string;
          model?: string;
          year?: number;
          color?: string;
          license_plate?: string;
          category?: 'classic_ev' | 'comfort_ev' | 'express_ev';
          is_electric?: boolean;
          is_hybrid?: boolean;
          status?: 'active' | 'inactive' | 'maintenance';
          photos?: string[];
          updated_at?: string;
        };
      };
    };
  };
}
