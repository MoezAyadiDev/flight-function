export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      Aeroport: {
        Row: {
          id: number;
          nom: string;
          code: string;
          icao: string;
          api_url: string;
          operateur: Database["public"]["Enums"]["operator"] | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          nom: string;
          code: string;
          icao: string;
          api_url: string;
          operateur: Database["public"]["Enums"]["operator"] | null;
          created_at?: string;
        };
        Update: {
          api_url?: string | null;
          code?: string | null;
          created_at?: string;
          icao?: string | null;
          id?: number;
          nom?: string | null;
          operateur?: Database["public"]["Enums"]["operator"] | null;
        };
        Relationships: [];
      };
      Airline: {
        Row: {
          id: number;
          airline_name: string;
          code: string;
          icao: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          airline_name: string;
          code: string;
          icao: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          airline_name?: string | null;
          code?: string | null;
          icao?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      Airport: {
        Row: {
          id: number;
          airport_name: string;
          alt: number;
          country: string;
          iata: string;
          icao: string;
          lat: number;
          lon: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          airport_name: string;
          alt: number;
          country: string;
          iata: string;
          icao: string;
          lat: number;
          lon: number;
          created_at?: string;
        };
        Update: {
          airport_name?: string | null;
          alt?: number | null;
          country?: string | null;
          created_at?: string;
          iata?: string | null;
          icao?: string | null;
          id?: number;
          lat?: number | null;
          lon?: number | null;
        };
        Relationships: [];
      };
      ApiTime: {
        Row: {
          id: number;
          info_time: number;
          created_at: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          info_time: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          info_time?: number;
        };
        Relationships: [];
      };
      Flight: {
        Row: {
          id: number;
          flight_num: string;
          flight_icao: string;
          flight_time: string;
          from_code_airport: string;
          from_airport: string;
          to_code_airport: string;
          to_airport: string;
          departure_time: string;
          arrival_time: string;
          airline: string;
          duration: number;
          local_name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          flight_num: string;
          flight_icao: string;
          flight_time: string;
          from_code_airport: string;
          from_airport: string;
          to_code_airport: string;
          to_airport: string;
          departure_time: string;
          arrival_time: string;
          airline: string;
          duration: number;
          local_name: string;
          created_at?: string;
        };
        Update: {
          airline?: string | null;
          arrival_time?: string | null;
          created_at?: string;
          departure_time?: string | null;
          duration?: number | null;
          flight_icao?: string | null;
          flight_num?: string | null;
          flight_time?: string | null;
          from_airport?: string | null;
          from_code_airport?: string | null;
          id?: number;
          local_name?: string | null;
          to_airport?: string | null;
          to_code_airport?: string | null;
        };
        Relationships: [];
      };
      Observation: {
        Row: {
          id: number;
          observation: string;
          provenance: string;
          trafic_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          observation: string;
          provenance: string;
          trafic_id: number;
          created_at?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          observation?: string | null;
          provenance?: string | null;
          trafic_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "observation_trafic_id_fkey";
            columns: ["trafic_id"];
            isOneToOne: false;
            referencedRelation: "Traffic";
            referencedColumns: ["id"];
          }
        ];
      };
      Subscription: {
        Row: {
          id: number;
          airport: string;
          date_traffic: number;
          flight_num: string;
          subscription_status: number;
          trafic_id: number;
          type_traffic: Database["public"]["Enums"]["traffic_type"];
          created_at: string;
        };
        Insert: {
          id?: number;
          airport: string;
          date_traffic: number;
          flight_num: string;
          subscription_status: number;
          trafic_id: number;
          type_traffic: Database["public"]["Enums"]["traffic_type"];
          created_at?: string;
        };
        Update: {
          airport?: string | null;
          created_at?: string;
          date_traffic?: number;
          flight_num?: string | null;
          id?: number;
          subscription_status?: number;
          trafic_id?: number;
          type_traffic?: Database["public"]["Enums"]["traffic_type"];
        };
        Relationships: [
          {
            foreignKeyName: "subscription_trafic_id_fkey";
            columns: ["trafic_id"];
            isOneToOne: false;
            referencedRelation: "Traffic";
            referencedColumns: ["id"];
          }
        ];
      };
      Track: {
        Row: {
          id: number;
          alt: number;
          lat: number;
          lon: number;
          speed: number;
          time_stamp: number;
          trafic_id: number;
          vertical_speed: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          alt: number;
          lat: number;
          lon: number;
          speed: number;
          time_stamp: number;
          trafic_id: number;
          vertical_speed: number;
          created_at?: string;
        };
        Update: {
          alt?: number | null;
          created_at?: string;
          id?: number;
          lat?: number | null;
          lon?: number | null;
          speed?: number | null;
          time_stamp?: number | null;
          trafic_id?: number;
          vertical_speed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "track_trafic_id_fkey";
            columns: ["trafic_id"];
            isOneToOne: false;
            referencedRelation: "Traffic";
            referencedColumns: ["id"];
          }
        ];
      };
      Traffic: {
        Row: {
          id: number;
          act_arrival_time: string;
          act_departure_time: string;
          arrival_date: number;
          departure_date: number;
          est_arrival_time: string;
          est_departure_time: string;
          flight_id: number;
          flight_num: string;
          flight_status: Database["public"]["Enums"]["flight_status"];
          fr_num: string;
          from_airport: string;
          from_code_airport: string;
          sch_arrival_time: string;
          sch_departure_time: string;
          to_airport: string;
          to_code_airport: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          act_arrival_time: string;
          act_departure_time: string;
          arrival_date: number;
          departure_date: number;
          est_arrival_time: string;
          est_departure_time: string;
          flight_id: number;
          flight_num: string;
          flight_status: Database["public"]["Enums"]["flight_status"];
          fr_num: string;
          from_airport: string;
          from_code_airport: string;
          sch_arrival_time: string;
          sch_departure_time: string;
          to_airport: string;
          to_code_airport: string;
          created_at?: string;
        };
        Update: {
          act_arrival_time?: string | null;
          act_departure_time?: string | null;
          arrival_date?: number;
          created_at?: string;
          departure_date?: number;
          est_arrival_time?: string | null;
          est_departure_time?: string | null;
          flight_id?: number;
          flight_num?: string | null;
          flight_status?: Database["public"]["Enums"]["flight_status"] | null;
          fr_num?: string | null;
          from_airport?: string | null;
          from_code_airport?: string | null;
          id?: number;
          sch_arrival_time?: string | null;
          sch_departure_time?: string | null;
          to_airport?: string | null;
          to_code_airport?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trafic_flight_id_fkey";
            columns: ["flight_id"];
            isOneToOne: false;
            referencedRelation: "Flight";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      flight_status: "Scheduled" | "onAir" | "Landed";
      operator: "OACA" | "TAV";
      traffic_type: "Arrival" | "Departure";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      flight_status: ["Scheduled", "onAir", "Landed"],
      operator: ["OACA", "TAV"],
      traffic_type: ["Arrival", "Departure"],
    },
  },
} as const;

export type TrafficType = Enums<"traffic_type">;
export type Operator = Enums<"operator">;
export type FlightStatus = Enums<"flight_status">;
