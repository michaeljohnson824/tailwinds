import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  date,
  jsonb,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  defaultAircraftId: uuid("default_aircraft_id"),
  medicalClass: integer("medical_class"),
  medicalExpiration: date("medical_expiration"),
  flightReviewDate: date("flight_review_date"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aircraft = pgTable("aircraft", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => profiles.id)
    .notNull(),
  tailNumber: text("tail_number").notNull(),
  makeModel: text("make_model").notNull(),
  year: integer("year"),
  homeAirport: text("home_airport"),
  hobbsCurrent: decimal("hobbs_current", { precision: 10, scale: 1 }),
  tachCurrent: decimal("tach_current", { precision: 10, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flights = pgTable("flights", {
  id: uuid("id").defaultRandom().primaryKey(),
  aircraftId: uuid("aircraft_id")
    .references(() => aircraft.id)
    .notNull(),
  pilotId: uuid("pilot_id")
    .references(() => profiles.id)
    .notNull(),
  date: date("date").notNull(),
  routeFrom: text("route_from"),
  routeTo: text("route_to"),
  routeVia: text("route_via"),
  hobbsStart: decimal("hobbs_start", { precision: 10, scale: 1 }),
  hobbsEnd: decimal("hobbs_end", { precision: 10, scale: 1 }),
  tachStart: decimal("tach_start", { precision: 10, scale: 1 }),
  tachEnd: decimal("tach_end", { precision: 10, scale: 1 }),
  totalTime: decimal("total_time", { precision: 10, scale: 1 }),
  landingsDay: integer("landings_day").default(0).notNull(),
  landingsNight: integer("landings_night").default(0).notNull(),
  conditions: text("conditions").default("VFR").notNull(),
  nightTime: decimal("night_time", { precision: 10, scale: 1 }).default("0"),
  instrumentTime: decimal("instrument_time", { precision: 10, scale: 1 }).default("0"),
  instrumentApproaches: integer("instrument_approaches").default(0).notNull(),
  crossCountry: boolean("cross_country").default(false).notNull(),
  picTime: decimal("pic_time", { precision: 10, scale: 1 }).default("0"),
  sicTime: decimal("sic_time", { precision: 10, scale: 1 }).default("0"),
  dualGiven: decimal("dual_given", { precision: 10, scale: 1 }).default("0"),
  dualReceived: decimal("dual_received", { precision: 10, scale: 1 }).default("0"),
  fuelGallons: decimal("fuel_gallons", { precision: 10, scale: 1 }),
  fuelPricePerGallon: decimal("fuel_price_per_gallon", { precision: 10, scale: 2 }),
  fuelTotalCost: decimal("fuel_total_cost", { precision: 10, scale: 2 }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
