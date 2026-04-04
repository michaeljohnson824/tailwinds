import type { profiles, aircraft, flights } from "@/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

export type Aircraft = InferSelectModel<typeof aircraft>;
export type NewAircraft = InferInsertModel<typeof aircraft>;

export type Flight = InferSelectModel<typeof flights>;
export type NewFlight = InferInsertModel<typeof flights>;
