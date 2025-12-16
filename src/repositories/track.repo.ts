import { Tables, TablesInsert, TablesUpdate } from "../database/supabase";

const tableName = "Track";
export type Track = Tables<"Track">;
export type TrackInsert = TablesInsert<"Track">;
export type TrackUpdate = TablesUpdate<"Track">;
