import { z } from "zod";

/**
 * zod-Schemas sind die einzige Quelle der Wahrheit für das Datenmodell.
 * Die TypeScript-Typen in ./types.ts werden daraus abgeleitet.
 */

export const programIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Programm-ID: nur Kleinbuchstaben, Ziffern und Bindestriche");

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT");

/** Herkunft einer Katalogangabe. */
export const sourceInfoShape = {
  source: z.url().nullable(),
  asOf: isoDateSchema.nullable(),
  verified: z.boolean(),
};

export const programCategorySchema = z.enum(["bank", "retail", "airline", "hotel", "other"]);

export const programSchema = z
  .object({
    id: programIdSchema,
    name: z.string().min(1),
    unit: z.string().min(1),
    category: programCategorySchema,
    note: z.string().optional(),
    ...sourceInfoShape,
  })
  .superRefine(requireSourceWhenVerified);

export const ratioSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
});

export const transferRouteSchema = z
  .object({
    id: z.string().min(1),
    from: programIdSchema,
    to: programIdSchema,
    ratio: ratioSchema.nullable(),
    minAmount: z.number().int().positive().nullable(),
    step: z.number().int().positive().nullable(),
    note: z.string().optional(),
    ...sourceInfoShape,
  })
  .superRefine((route, ctx) => {
    requireSourceWhenVerified(route, ctx);
    if (route.from === route.to) {
      ctx.addIssue({ code: "custom", message: "Quelle und Ziel dürfen nicht gleich sein", path: ["to"] });
    }
    if (route.ratio !== null && (route.source === null || route.asOf === null)) {
      ctx.addIssue({
        code: "custom",
        message: "Ein eingetragenes Verhältnis braucht Quelle (source) und Stand-Datum (asOf)",
        path: ["ratio"],
      });
    }
  });

function requireSourceWhenVerified(
  value: { verified: boolean; source: string | null; asOf: string | null },
  ctx: z.RefinementCtx,
) {
  if (value.verified && (value.source === null || value.asOf === null)) {
    ctx.addIssue({
      code: "custom",
      message: "verified=true braucht Quelle (source) und Stand-Datum (asOf)",
      path: ["verified"],
    });
  }
}

export const programsFileSchema = z.object({
  _hinweis: z.string().optional(),
  programs: z.array(programSchema),
});

export const transfersFileSchema = z.object({
  _hinweis: z.string().optional(),
  routes: z.array(transferRouteSchema),
});

// ── Nutzerdaten ─────────────────────────────────────────────

export const transactionTypeSchema = z.enum(["earned", "transferred", "redeemed", "purchased", "correction"]);

export const transactionSchema = z.object({
  id: z.string().min(1),
  programId: programIdSchema,
  type: transactionTypeSchema,
  delta: z
    .number()
    .int("Punkte sind ganze Zahlen")
    .refine((d) => d !== 0, "Eine Buchung muss den Stand ändern"),
  occurredAt: z.iso.datetime({ offset: true }),
  note: z.string().max(500).optional(),
  counterpartProgramId: programIdSchema.optional(),
});

const centsValueSchema = z.number().finite().nonnegative().nullable();

export const programSettingsSchema = z.object({
  pointValueCents: centsValueSchema,
  minRedemptionCents: centsValueSchema,
});

export const settingsSchema = z.object({
  programs: z.record(programIdSchema, programSettingsSchema),
  borderlineTolerancePct: z.number().finite().min(0).max(100),
});

export const SCHEMA_VERSION = 1 as const;

export const appDataSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  transactions: z.array(transactionSchema),
  settings: settingsSchema,
});

export const backupFileSchema = z.object({
  app: z.literal("pointpilot"),
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.iso.datetime({ offset: true }),
  data: appDataSchema,
});
