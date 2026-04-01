import { z } from "zod";
import { router, developerProcedure } from "./_core/trpc";
import { decryptSecret, encryptSecret, maskValue } from "./configCrypto";
import {
  deleteStalePendingOrdersOlderThan,
  getAdminLogs,
  getOrderCountsByStatus,
  getProductCountsActive,
  getTableRowCounts,
  getTotalRevenuePaid,
  getUsersCountByRole,
  listApiConfigs,
  listFeatureFlags,
  listSystemConfigRows,
  upsertApiConfigRow,
  upsertFeatureFlagRow,
  upsertSystemConfigRow,
} from "./db";
import { logAdminAction } from "./adminLogHelper";

const API_ROW_DEFS: Array<{ service: string; keyName: string; description: string }> = [
  { service: "Stripe", keyName: "stripe_public_key", description: "Publishable key" },
  { service: "Stripe", keyName: "stripe_secret_key", description: "Secret key" },
  { service: "Stripe", keyName: "stripe_webhook_secret", description: "Webhook signing secret" },
  { service: "LLM / OpenAI", keyName: "llm_api_key", description: "API key" },
  { service: "LLM / OpenAI", keyName: "llm_model_name", description: "Model name" },
  { service: "OAuth", keyName: "oauth_google_client_id", description: "Google Client ID" },
  { service: "OAuth", keyName: "oauth_google_client_secret", description: "Google Client Secret" },
  { service: "OAuth", keyName: "oauth_github_client_id", description: "GitHub Client ID" },
  { service: "OAuth", keyName: "oauth_github_client_secret", description: "GitHub Client Secret" },
  { service: "SMTP / Email", keyName: "smtp_host", description: "SMTP host" },
  { service: "SMTP / Email", keyName: "smtp_port", description: "SMTP port" },
  { service: "SMTP / Email", keyName: "smtp_username", description: "SMTP username" },
  { service: "SMTP / Email", keyName: "smtp_password", description: "SMTP password" },
];

export const devConsoleRouter = router({
  apiConfigTable: developerProcedure.query(async () => {
    const rows = await listApiConfigs();
    const byKey = new Map(rows.map((r) => [r.keyName, r]));
    return API_ROW_DEFS.map((def) => {
      const row = byKey.get(def.keyName);
      let masked = "—";
      let status: "configured" | "missing" = "missing";
      if (row?.encryptedValue) {
        try {
          const plain = decryptSecret(row.encryptedValue);
          masked = maskValue(plain);
          status = "configured";
        } catch {
          masked = "****";
          status = "configured";
        }
      }
      return {
        service: def.service,
        keyName: def.keyName,
        description: def.description,
        maskedValue: masked,
        status,
        lastUsedAt: row?.lastUsedAt ?? null,
        id: row?.id ?? null,
      };
    });
  }),

  updateApiConfig: developerProcedure
    .input(
      z.object({
        keyName: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const enc = encryptSecret(input.value);
      await upsertApiConfigRow({
        service: API_ROW_DEFS.find((d) => d.keyName === input.keyName)?.service ?? "Other",
        keyName: input.keyName,
        encryptedValue: enc,
        isActive: true,
        updatedBy: ctx.user.id,
      });
      await logAdminAction(ctx, "api_config.update", { keyName: input.keyName });
      return { success: true as const };
    }),

  featureFlags: developerProcedure.query(async () => {
    const rows = await listFeatureFlags();
    return rows;
  }),

  updateFeatureFlag: developerProcedure
    .input(
      z.object({
        name: z.string(),
        value: z.boolean(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertFeatureFlagRow({
        name: input.name,
        value: input.value,
        description: input.description,
        updatedBy: ctx.user.id,
      });
      await logAdminAction(ctx, "feature_flag.update", { name: input.name, value: input.value });
      return { success: true as const };
    }),

  systemConfig: developerProcedure.query(async () => {
    return listSystemConfigRows();
  }),

  upsertSystemConfig: developerProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        category: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertSystemConfigRow({
        key: input.key,
        value: input.value,
        category: input.category,
        description: input.description,
        updatedBy: ctx.user.id,
      });
      await logAdminAction(ctx, "system_config.upsert", { key: input.key });
      return { success: true as const };
    }),

  adminLogs: developerProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      return getAdminLogs(input.limit, input.offset);
    }),

  databaseStats: developerProcedure.query(async () => {
    const [usersByRole, products, ordersByStatus, revenue, tableCounts] = await Promise.all([
      getUsersCountByRole(),
      getProductCountsActive(),
      getOrderCountsByStatus(),
      getTotalRevenuePaid(),
      getTableRowCounts(),
    ]);
    return {
      usersByRole,
      products,
      ordersByStatus,
      revenuePaid: revenue,
      tableCounts,
    };
  }),

  clearStalePendingOrders: developerProcedure.mutation(async ({ ctx }) => {
    const result = await deleteStalePendingOrdersOlderThan(24);
    await logAdminAction(ctx, "orders.clear_stale_pending", { deleted: result.deleted });
    return result;
  }),
});
