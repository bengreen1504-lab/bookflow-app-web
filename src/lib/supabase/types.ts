// Hand-written to match supabase/migrations/0001_init.sql.
// Once the real Supabase project is live, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts

export type UserRole = "customer" | "business_owner";
export type BusinessCategory = "barbers" | "salons" | "cleaners" | "car_detailing";
export type BookingStatus = "upcoming" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type PosMethod = "tap" | "reader" | "cash";
export type MessageSender = "customer" | "business";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          push_notifications: boolean;
          email_reminders: boolean;
          promotional_offers: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          category: BusinessCategory;
          address: string;
          hours: string;
          photo_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["businesses"]["Row"]> & {
          owner_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          duration_minutes: number;
          price_cents: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          business_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      staff: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          role: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & {
          business_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "staff_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          booking_date: string;
          booking_time: string;
          status: BookingStatus;
          payment_status: PaymentStatus;
          total_price_cents: number;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]> & {
          business_id: string;
          customer_id: string;
          booking_date: string;
          booking_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      booking_services: {
        Row: {
          id: string;
          booking_id: string;
          service_id: string | null;
          name_snapshot: string;
          price_cents_snapshot: number;
          duration_minutes_snapshot: number;
        };
        Insert: Partial<Database["public"]["Tables"]["booking_services"]["Row"]> & {
          booking_id: string;
          name_snapshot: string;
          price_cents_snapshot: number;
          duration_minutes_snapshot: number;
        };
        Update: Partial<Database["public"]["Tables"]["booking_services"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      pos_sales: {
        Row: {
          id: string;
          business_id: string;
          method: PosMethod;
          total_cents: number;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pos_sales"]["Row"]> & {
          business_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["pos_sales"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pos_sales_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      pos_sale_items: {
        Row: {
          id: string;
          pos_sale_id: string;
          service_id: string | null;
          name_snapshot: string;
          price_cents_snapshot: number;
          qty: number;
        };
        Insert: Partial<Database["public"]["Tables"]["pos_sale_items"]["Row"]> & {
          pos_sale_id: string;
          name_snapshot: string;
          price_cents_snapshot: number;
        };
        Update: Partial<Database["public"]["Tables"]["pos_sale_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_pos_sale_id_fkey";
            columns: ["pos_sale_id"];
            isOneToOne: false;
            referencedRelation: "pos_sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pos_sale_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          booking_id: string | null;
          rating: number;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & {
          business_id: string;
          customer_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          sender: MessageSender;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          business_id: string;
          customer_id: string;
          sender: MessageSender;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          target_type: string | null;
          target_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      device_push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["device_push_tokens"]["Row"]> & {
          user_id: string;
          token: string;
        };
        Update: Partial<Database["public"]["Tables"]["device_push_tokens"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "device_push_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      business_clients: {
        Row: {
          business_id: string;
          customer_id: string;
          full_name: string;
          email: string;
          marketing_opt_in: boolean;
          visits: number;
          lifetime_spend_cents: number;
          last_visit: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      business_category: BusinessCategory;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      pos_method: PosMethod;
      message_sender: MessageSender;
    };
    CompositeTypes: Record<string, never>;
  };
}
