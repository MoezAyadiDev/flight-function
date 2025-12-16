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
          api_url: string;
          code: string;
          icao: string;
          nom: string;
          operateur: Database["public"]["Enums"]["operator"] | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          api_url: string;
          code: string;
          icao: string;
          nom: string;
          operateur: Database["public"]["Enums"]["operator"] | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          api_url?: string;
          code?: string;
          icao?: string;
          nom?: string;
          operateur?: Database["public"]["Enums"]["operator"] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      Airline: {
        Row: {
          id: number;
          code: string;
          icao: string;
          airline_name: string;
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
          airline_name?: string;
          code?: string;
          icao?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      Airport: {
        Row: {
          id: number;
          iata: string;
          icao: string;
          airport_name: string;
          country: string;
          alt: number | null;
          lon: number | null;
          lat: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          iata: string;
          icao: string;
          country: string;
          airport_name: string;
          alt?: number | null;
          lat?: number | null;
          lon?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          airport_name?: string;
          alt?: number | null;
          country?: string;
          iata?: string;
          icao?: string;
          lat?: number | null;
          lon?: number | null;
          created_at?: string;
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
          id?: number;
          info_time: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          info_time?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      Flight: {
        Row: {
          id: number;
          airline_id: number;
          arrival_time: string;
          departure_time: string;
          duration: number | null;
          flight_icao: string;
          flight_num: string;
          flight_time: string;
          from_airport: number;
          local_name: string[];
          to_airport: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          airline_id: number;
          arrival_time: string;
          departure_time: string;
          duration?: number | null;
          flight_icao: string;
          flight_num: string;
          flight_time: string;
          from_airport: number;
          local_name: string[];
          to_airport: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          airline_id?: number;
          arrival_time?: string;
          departure_time?: string;
          duration?: number | null;
          flight_icao?: string;
          flight_num?: string;
          flight_time?: string;
          from_airport?: number;
          local_name?: string[];
          to_airport?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flight_airline_id_fkey";
            columns: ["airline_id"];
            isOneToOne: false;
            referencedRelation: "Airline";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flight_airport_from_id_fkey";
            columns: ["from_airport"];
            isOneToOne: false;
            referencedRelation: "Airport";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flight_airport_to_id_fkey";
            columns: ["to_airport"];
            isOneToOne: false;
            referencedRelation: "Airport";
            referencedColumns: ["id"];
          }
        ];
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
          id?: number;
          observation?: string;
          provenance?: string;
          trafic_id?: number;
          created_at?: string;
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
      Track: {
        Row: {
          id: number;
          alt: number | null;
          lat: number | null;
          lon: number | null;
          speed: number | null;
          time_stamp: number | null;
          trafic_id: number;
          vertical_speed: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          alt?: number | null;
          lat?: number | null;
          lon?: number | null;
          speed?: number | null;
          time_stamp?: number | null;
          trafic_id: number;
          vertical_speed?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          alt?: number | null;
          lat?: number | null;
          lon?: number | null;
          speed?: number | null;
          time_stamp?: number | null;
          trafic_id?: number;
          vertical_speed?: number | null;
          created_at?: string;
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
          flight_num: string;
          traffic_date: number;
          traffic_airport: string;
          id_centre: number[];
          type_traffic: Database["public"]["Enums"]["traffic_type"];
          local_num: string[];
          fr_num: string;
          departure_date: number;
          arrival_date: number;
          traffic_diverted_to: string;
          sch_departure_time: string;
          sch_arrival_time: string;
          est_arrival_time: string;
          est_departure_time: string;
          act_departure_time: string;
          act_arrival_time: string;
          flight_status: Database["public"]["Enums"]["flight_status"];
          flight_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          flight_num: string;
          traffic_date: number;
          traffic_airport: string;
          id_centre: number[];
          type_traffic?: Database["public"]["Enums"]["traffic_type"];
          local_num: string[];
          fr_num: string;
          departure_date?: number;
          arrival_date?: number;
          traffic_diverted_to?: string;
          sch_departure_time?: string;
          sch_arrival_time?: string;
          est_departure_time?: string;
          est_arrival_time?: string;
          act_departure_time?: string;
          act_arrival_time?: string;
          flight_status?: Database["public"]["Enums"]["flight_status"] | null;
          flight_id: number;
          created_at?: string;
        };
        Update: {
          act_arrival_time?: string;
          act_departure_time?: string;
          traffic_date?: number;
          arrival_date?: number;
          created_at?: string;
          departure_date?: number;
          est_arrival_time?: string;
          est_departure_time?: string;
          flight_id?: number;
          flight_num?: string;
          flight_status?: Database["public"]["Enums"]["flight_status"] | null;
          fr_num?: string;
          id?: number;
          id_centre?: number[];
          local_num?: string[];
          sch_arrival_time?: string;
          sch_departure_time?: string;
          traffic_airport?: string;
          traffic_diverted_to?: string;
          type_traffic?: Database["public"]["Enums"]["traffic_type"];
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
      UnknownFlight: {
        Row: {
          id: number;
          airport: string;
          flight_num: string;
          date_traffic: number;
          type_traffic: Database["public"]["Enums"]["traffic_type"];
          created_at: string;
        };
        Insert: {
          id?: number;
          airport: string;
          date_traffic?: number;
          flight_num: string;
          type_traffic?: Database["public"]["Enums"]["traffic_type"];
          created_at?: string;
        };
        Update: {
          airport?: string;
          created_at?: string;
          date_traffic?: number;
          flight_num?: string;
          id?: number;
          type_traffic?: Database["public"]["Enums"]["traffic_type"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      flight_status: "Scheduled" | "onAir" | "Landed" | "Canceled";
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
      flight_status: ["Scheduled", "onAir", "Landed", "Canceled"],
      operator: ["OACA", "TAV"],
      traffic_type: ["Arrival", "Departure"],
    },
  },
} as const;

export type TrafficType = Enums<"traffic_type">;
export type Operator = Enums<"operator">;
export type FlightStatus = Enums<"flight_status">;
