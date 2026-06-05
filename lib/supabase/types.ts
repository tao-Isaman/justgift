export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Plan = "free" | "pro" | "elite";
export type AlertAnimation = "slide" | "zoom" | "flip" | "glitch";
export type AlertPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center";
export type DonationStatus = "pending" | "verified" | "rejected" | "shown";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          receiver_name: string | null;
          promptpay_id: string | null;
          bank_name: string | null;
          bank_account: string | null;
          overlay_token: string;
          plan: Plan;
          onboarded: boolean;
          plan_expires_at: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          receiver_name?: string | null;
          promptpay_id?: string | null;
          bank_name?: string | null;
          bank_account?: string | null;
          overlay_token?: string;
          plan?: Plan;
          onboarded?: boolean;
          plan_expires_at?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          receiver_name?: string | null;
          promptpay_id?: string | null;
          bank_name?: string | null;
          bank_account?: string | null;
          overlay_token?: string;
          plan?: Plan;
          onboarded?: boolean;
          plan_expires_at?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alert_settings: {
        Row: {
          profile_id: string;
          min_amount: number;
          duration_ms: number;
          sound_url: string | null;
          image_url: string | null;
          animation: AlertAnimation;
          accent_color: string;
          text_color: string;
          font: string;
          tts_enabled: boolean;
          tts_voice: string | null;
          position: AlertPosition;
          sound_volume: number;
          tts_rate: number;
          tts_volume: number;
          big_threshold: number;
          big_effect: boolean;
          goal_enabled: boolean;
          goal_amount: number;
          goal_title: string | null;
          media_enabled: boolean;
          media_min_amount: number;
          media_max_seconds: number;
          variants: Json;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          min_amount?: number;
          duration_ms?: number;
          sound_url?: string | null;
          image_url?: string | null;
          animation?: AlertAnimation;
          accent_color?: string;
          text_color?: string;
          font?: string;
          tts_enabled?: boolean;
          tts_voice?: string | null;
          position?: AlertPosition;
          sound_volume?: number;
          tts_rate?: number;
          tts_volume?: number;
          big_threshold?: number;
          big_effect?: boolean;
          goal_enabled?: boolean;
          goal_amount?: number;
          goal_title?: string | null;
          media_enabled?: boolean;
          media_min_amount?: number;
          media_max_seconds?: number;
          variants?: Json;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          min_amount?: number;
          duration_ms?: number;
          sound_url?: string | null;
          image_url?: string | null;
          animation?: AlertAnimation;
          accent_color?: string;
          text_color?: string;
          font?: string;
          tts_enabled?: boolean;
          tts_voice?: string | null;
          position?: AlertPosition;
          sound_volume?: number;
          tts_rate?: number;
          tts_volume?: number;
          big_threshold?: number;
          big_effect?: boolean;
          goal_enabled?: boolean;
          goal_amount?: number;
          goal_title?: string | null;
          media_enabled?: boolean;
          media_min_amount?: number;
          media_max_seconds?: number;
          variants?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          id: string;
          profile_id: string;
          donor_name: string;
          message: string | null;
          amount: number;
          verified_amount: number | null;
          currency: string;
          status: DonationStatus;
          slip_trans_ref: string | null;
          sender_name: string | null;
          sender_bank: string | null;
          receiver_account: string | null;
          slip_image_path: string | null;
          slip_data: Json | null;
          reject_reason: string | null;
          created_at: string;
          shown_at: string | null;
          media_url: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          donor_name: string;
          message?: string | null;
          amount: number;
          verified_amount?: number | null;
          currency?: string;
          status?: DonationStatus;
          slip_trans_ref?: string | null;
          sender_name?: string | null;
          sender_bank?: string | null;
          receiver_account?: string | null;
          slip_image_path?: string | null;
          slip_data?: Json | null;
          reject_reason?: string | null;
          created_at?: string;
          shown_at?: string | null;
          media_url?: string | null;
        };
        Update: {
          status?: DonationStatus;
          shown_at?: string | null;
          reject_reason?: string | null;
        };
        Relationships: [];
      };
      subscription_payments: {
        Row: {
          id: string;
          profile_id: string;
          package_id: string;
          tier: "pro" | "elite";
          days: number;
          amount: number;
          currency: string;
          method: string;
          status: string;
          stripe_session_id: string | null;
          stripe_payment_intent: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          package_id: string;
          tier: "pro" | "elite";
          days: number;
          amount: number;
          currency?: string;
          method?: string;
          status?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          period_start?: string | null;
          period_end?: string | null;
          stripe_payment_intent?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          promptpay_id: string | null;
          bank_name: string | null;
          bank_account: string | null;
          plan: Plan;
          media_enabled: boolean;
          media_min_amount: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      my_donation_stats: {
        Args: Record<string, never>;
        Returns: {
          total: number;
          donation_count: number;
          month_total: number;
          month_count: number;
        }[];
      };
      my_top_donors: {
        Args: { p_limit?: number };
        Returns: { donor_name: string; total: number; donations: number }[];
      };
      apply_subscription: {
        Args: { p_profile: string; p_tier: string; p_days: number };
        Returns: string;
      };
      expire_subscriptions: {
        Args: Record<string, never>;
        Returns: number;
      };
      admin_overview: {
        Args: Record<string, never>;
        Returns: {
          streamers: number;
          onboarded: number;
          pro_active: number;
          elite_active: number;
          donations_count: number;
          donations_total: number;
          month_donations_count: number;
          month_donations_total: number;
          sub_revenue: number;
          month_sub_revenue: number;
        }[];
      };
      admin_users: {
        Args: { p_search?: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          username: string | null;
          display_name: string | null;
          plan: Plan;
          plan_expires_at: string | null;
          created_at: string;
          is_admin: boolean;
          donations_count: number;
          total_raised: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type AlertSettings =
  Database["public"]["Tables"]["alert_settings"]["Row"];
export type AlertSettingsUpdate =
  Database["public"]["Tables"]["alert_settings"]["Update"];

/** Amount-tier alert variant (stored as JSON on alert_settings.variants). */
export type AlertVariant = {
  minAmount: number;
  accentColor: string;
  imageUrl: string;
  animation: AlertAnimation;
};
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
export type SubscriptionPayment =
  Database["public"]["Tables"]["subscription_payments"]["Row"];
export type PublicProfile =
  Database["public"]["Views"]["public_profiles"]["Row"];

/** Payload broadcast to the OBS overlay channel `overlay:<token>`. */
export type OverlayAlertPayload = {
  id: string;
  donorName: string;
  amount: number;
  message: string | null;
  accentColor?: string;
  textColor?: string;
  imageUrl?: string | null;
  durationMs?: number;
  ttsEnabled?: boolean;
  ttsVoice?: string | null;
  animation?: AlertAnimation;
  position?: AlertPosition;
  soundUrl?: string | null;
  mediaUrl?: string | null;
  mediaSeconds?: number;
  test?: boolean;
};
