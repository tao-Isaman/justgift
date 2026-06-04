export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Plan = "free" | "pro" | "elite";
export type AlertAnimation = "slide" | "zoom" | "flip" | "glitch";
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
        };
        Update: {
          status?: DonationStatus;
          shown_at?: string | null;
          reject_reason?: string | null;
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
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
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
  test?: boolean;
};
