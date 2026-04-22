// Hand-written DB types for Zenzo schema.
// Replace this file by running: supabase gen types typescript --local > packages/database/src/types/database.gen.ts
//
// IMPORTANT: Each table must have a `Relationships` array — required by supabase-js v2.x.

import type {
  StaffRole,
  MembershipStatus,
  BillingCycle,
  PaymentMethod,
  ClubCategory,
  VerificationStatus,
  DayOfWeek,
  AttendanceStatus,
  InterestSlug,
  PriceRange,
} from "../enums";

export type {
  StaffRole,
  MembershipStatus,
  BillingCycle,
  PaymentMethod,
  ClubCategory,
  VerificationStatus,
  DayOfWeek,
  AttendanceStatus,
  InterestSlug,
  PriceRange,
} from "../enums";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;           // equals auth.users.id
          full_name: string;
          phone: string;
          email: string;
          auth_provider: string;
          is_admin: boolean;
          bio: string | null;
          avatar_url: string | null;
          username: string | null;
          city: string | null;
          onboarding_step: "interests_done" | "interests_skipped" | null;
          // Coach discovery columns (SD1.3) — null for non-coaches
          specializations: string[] | null;
          certifications: string[] | null;
          experience_years: number | null;
          languages: string[] | null;
          is_freelance: boolean;
          session_price_paise: number | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          auth_provider?: string;
          is_admin?: boolean;
          bio?: string | null;
          avatar_url?: string | null;
          username?: string | null;
          city?: string | null;
          onboarding_step?: "interests_done" | "interests_skipped" | null;
          specializations?: string[] | null;
          certifications?: string[] | null;
          experience_years?: number | null;
          languages?: string[] | null;
          is_freelance?: boolean;
          session_price_paise?: number | null;
          is_available?: boolean;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["users"]["Insert"], "id">>;
        Relationships: [];
      };
      user_interests: {
        Row: {
          user_id: string;
          slug: InterestSlug;
          created_at: string;
        };
        Insert: {
          user_id: string;
          slug: InterestSlug;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_interests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      clubs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          business_type: ClubCategory;
          city: string | null;
          phone: string | null;
          logo_url: string | null;
          terminology: Json;
          owner_id: string;
          verification_status: VerificationStatus;
          description: string | null;
          listed: boolean;
          avg_rating: number | null;
          // Search & discovery columns (SD1.2)
          tagline: string | null;
          cover_image_url: string | null;
          gallery: string[] | null;
          subcategories: string[] | null;
          amenities: string[] | null;
          operating_hours: Json | null;
          area: string | null;
          full_address: string | null;
          google_maps_url: string | null;
          social_links: Json | null;
          location: string | null;  // PostGIS geography serialised as WKT/GeoJSON by supabase-js
          featured: boolean;
          review_count: number;
          member_count: number;
          price_range: PriceRange | null;
          starting_price_paise: number | null;
          established_year: number | null;
          search_vector: string | null; // TSVECTOR — only used server-side
          created_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          business_type: ClubCategory;
          owner_id: string;
          verification_status?: VerificationStatus;
          listed?: boolean;
          featured?: boolean;
          city?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          terminology?: Json;
          description?: string | null;
          tagline?: string | null;
          cover_image_url?: string | null;
          gallery?: string[] | null;
          subcategories?: string[] | null;
          amenities?: string[] | null;
          operating_hours?: Json | null;
          area?: string | null;
          full_address?: string | null;
          google_maps_url?: string | null;
          social_links?: Json | null;
          location?: string | null;
          price_range?: PriceRange | null;
          starting_price_paise?: number | null;
          established_year?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      club_staff: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: StaffRole;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["club_staff"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["club_staff"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "club_staff_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_staff_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      club_memberships: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          plan_id: string | null;
          status: MembershipStatus;
          joined_at: string;
          next_due_date: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["club_memberships"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["club_memberships"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_memberships_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "fee_plans";
            referencedColumns: ["id"];
          }
        ];
      };
      member_batches: {
        Row: {
          id: string;
          membership_id: string;
          batch_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["member_batches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["member_batches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "member_batches_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "club_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_batches_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          }
        ];
      };
      batches: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          start_time: string;
          end_time: string;
          days: DayOfWeek[];
          coach_id: string | null;
          max_capacity: number | null;
          description: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["batches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["batches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "batches_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batches_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      fee_plans: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          amount_paise: number;
          billing_cycle: BillingCycle;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fee_plans"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["fee_plans"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "fee_plans_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance_records: {
        Row: {
          id: string;
          membership_id: string;
          batch_id: string;
          date: string;
          status: AttendanceStatus;
          marked_by: string | null;
          is_drop_in: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["attendance_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_records_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "club_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          }
        ];
      };
      club_invites: {
        Row: {
          id: string;
          club_id: string;
          email: string | null;
          phone: string | null;
          token: string;
          plan_id: string | null;
          batch_id: string | null;
          invited_by: string | null;
          status: "pending" | "accepted" | "expired";
          created_at: string;
          expires_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["club_invites"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["club_invites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "club_invites_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_invites_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "fee_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_invites_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_invites_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          membership_id: string;
          amount_paise: number;
          method: PaymentMethod;
          payment_date: string;
          reference: string | null;
          note: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "club_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      club_reviews: {
        Row: {
          id: string;
          club_id: string;
          reviewer_user_id: string;
          rating: number;
          review_text: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          club_id: string;
          reviewer_user_id: string;
          rating: number;
          review_text?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          rating?: number;
          review_text?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "club_reviews_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_reviews_reviewer_user_id_fkey";
            columns: ["reviewer_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      member_achievements: {
        Row: {
          id: string;
          user_id: string;
          club_id: string;
          title: string;
          description: string | null;
          badge_icon: string | null;
          awarded_by: string | null;
          awarded_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          club_id: string;
          title: string;
          description?: string | null;
          badge_icon?: string | null;
          awarded_by?: string | null;
          awarded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["member_achievements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "member_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_achievements_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_achievements_awarded_by_fkey";
            columns: ["awarded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      coach_ratings: {
        Row: {
          id: string;
          coach_user_id: string;
          club_id: string;
          reviewer_user_id: string;
          rating: number;
          review_text: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          coach_user_id: string;
          club_id: string;
          reviewer_user_id: string;
          rating: number;
          review_text?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          rating?: number;
          review_text?: string | null;
          club_id?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "coach_ratings_coach_user_id_fkey";
            columns: ["coach_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coach_ratings_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coach_ratings_reviewer_user_id_fkey";
            columns: ["reviewer_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      staff_role: StaffRole;
      membership_status: MembershipStatus;
      billing_cycle: BillingCycle;
      payment_method: PaymentMethod;
      club_category: ClubCategory;
      verification_status: VerificationStatus;
      day_of_week: DayOfWeek;
      attendance_status: AttendanceStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
