import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Code2, Database, Flag, KeyRound, ScrollText, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function DevConsole() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (user?.role !== "developer") {
      toast.error("Developer access required");
      navigate("/");
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading || !isAuthenticated || user?.role !== "developer") {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#ccff00] border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Developer Console</h1>
            <p className="text-sm text-white/50">API keys, flags, config, logs, and DB stats</p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-[#ff00b3] hover:underline"
          >
            ← Admin
          </Link>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 bg-[#111] border border-white/10">
            <TabsTrigger value="keys" className="data-[state=active]:bg-[rgba(204,255,0,0.12)] data-[state=active]:text-[#ccff00]">
              <KeyRound className="mr-1 h-4 w-4" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="flags" className="data-[state=active]:bg-[rgba(204,255,0,0.12)] data-[state=active]:text-[#ccff00]">
              <Flag className="mr-1 h-4 w-4" /> Feature Flags
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-[rgba(204,255,0,0.12)] data-[state=active]:text-[#ccff00]">
              <Settings2 className="mr-1 h-4 w-4" /> System Config
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-[rgba(204,255,0,0.12)] data-[state=active]:text-[#ccff00]">
              <ScrollText className="mr-1 h-4 w-4" /> Activity Log
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-[rgba(204,255,0,0.12)] data-[state=active]:text-[#ccff00]">
              <Database className="mr-1 h-4 w-4" /> DB Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <ApiKeysTab />
          </TabsContent>
          <TabsContent value="flags">
            <FeatureFlagsTab />
          </TabsContent>
          <TabsContent value="config">
            <SystemConfigTab />
          </TabsContent>
          <TabsContent value="logs">
            <ActivityLogTab />
          </TabsContent>
          <TabsContent value="stats">
            <DatabaseStatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function ApiKeysTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.devConsole.apiConfigTable.useQuery();
  const update = trpc.devConsole.updateApiConfig.useMutation({
    onSuccess: () => {
      utils.devConsole.apiConfigTable.invalidate();
      toast.success("Saved");
    },
    onError: (e) => toast.error(e.message),
  });
  const [edit, setEdit] = useState<{ keyName: string; label: string } | null>(null);
  const [val, setVal] = useState("");

  return (
    <div className="cyber-card overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-[#ccff00]">Service</TableHead>
            <TableHead className="text-[#ccff00]">Key</TableHead>
            <TableHead className="text-[#ccff00]">Masked</TableHead>
            <TableHead className="text-[#ccff00]">Status</TableHead>
            <TableHead className="text-right text-[#ccff00]">Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-white/40">
                Loading…
              </TableCell>
            </TableRow>
          ) : (
            data?.map((row) => (
              <TableRow key={row.keyName} className="border-white/10">
                <TableCell className="text-white/80">{row.service}</TableCell>
                <TableCell className="text-sm text-white/60">{row.keyName}</TableCell>
                <TableCell className="font-mono text-xs text-[#ff00b3]">{row.maskedValue}</TableCell>
                <TableCell className="text-xs uppercase text-white/50">{row.status}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#ccff00]/40 text-[#ccff00]"
                    onClick={() => {
                      setEdit({ keyName: row.keyName, label: row.keyName });
                      setVal("");
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="border-white/10 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Update {edit?.label}</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="New value"
            className="border-white/10 bg-black/40"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#ccff00] text-black"
              onClick={() => {
                if (!edit) return;
                update.mutate({ keyName: edit.keyName, value: val });
                setEdit(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureFlagsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.devConsole.featureFlags.useQuery();
  const update = trpc.devConsole.updateFeatureFlag.useMutation({
    onSuccess: () => utils.devConsole.featureFlags.invalidate(),
  });

  const names = [
    "ai_bot_enabled",
    "stripe_live_mode",
    "promptpay_enabled",
    "crypto_payments_enabled",
    "maintenance_mode",
    "registration_open",
    "reviews_enabled",
  ] as const;

  const desc: Record<(typeof names)[number], string> = {
    ai_bot_enabled: "Floating AI assistant widget",
    stripe_live_mode: "Use Stripe live mode",
    promptpay_enabled: "PromptPay QR via Stripe (THB)",
    crypto_payments_enabled: "Show cryptocurrency payment instructions",
    maintenance_mode: "Put storefront in maintenance",
    registration_open: "Allow new user registration",
    reviews_enabled: "Product reviews visible",
  };

  const byName = new Map(data?.map((f) => [f.name, f]));

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-white/40">Loading…</p>}
      {names.map((name) => {
        const row = byName.get(name);
        return (
          <div
            key={name}
            className="cyber-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-mono text-sm text-[#ccff00]">{name}</p>
              <p className="text-xs text-white/50">{row?.description ?? desc[name]}</p>
              <p className="text-[10px] text-white/30">Last change: user #{row?.updatedBy ?? "—"}</p>
            </div>
            <Switch
              checked={row?.value ?? false}
              onCheckedChange={(v) =>
                update.mutate({ name, value: v, description: row?.description ?? desc[name] })
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function SystemConfigTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.devConsole.systemConfig.useQuery();
  const upsert = trpc.devConsole.upsertSystemConfig.useMutation({
    onSuccess: () => utils.devConsole.systemConfig.invalidate(),
  });

  const defaults: Array<{ key: string; category: string; description: string; value: string }> = [
    { key: "shop_name", category: "shop", description: "Display name", value: "NEOXP Store" },
    { key: "shop_url", category: "shop", description: "Public site URL", value: "" },
    { key: "support_email", category: "shop", description: "Support email", value: "" },
    { key: "max_download_attempts", category: "orders", description: "Max downloads per item", value: "5" },
    { key: "download_link_expiry_days", category: "orders", description: "Days until link expires", value: "365" },
    { key: "default_currency", category: "orders", description: "Default currency code", value: "THB" },
    { key: "min_order_amount", category: "orders", description: "Minimum order amount", value: "0" },
    { key: "stripe_currency", category: "orders", description: "thb or usd", value: "thb" },
    { key: "ai_model_name", category: "ai", description: "Model id", value: "gpt-4o" },
    { key: "ai_max_tokens", category: "ai", description: "Max tokens", value: "2048" },
    { key: "ai_temperature", category: "ai", description: "Temperature", value: "0.7" },
  ];

  const merged = defaults.map((d) => {
    const row = data?.find((r) => r.key === d.key);
    return { ...d, value: row?.value ?? d.value };
  });

  if (isLoading) return <p className="text-white/40">Loading…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {merged.map((row) => (
        <div key={row.key} className="cyber-card space-y-2 p-4">
          <Label className="font-mono text-xs text-[#ccff00]" htmlFor={`cfg-${row.key}`}>
            {row.key}
          </Label>
          <p className="text-[10px] text-white/40">{row.description}</p>
          <Input
            id={`cfg-${row.key}`}
            defaultValue={row.value}
            className="border-white/10 bg-black/40 text-white"
            onBlur={(e) => {
              const v = e.target.value;
              upsert.mutate({
                key: row.key,
                value: v,
                category: row.category,
                description: row.description,
              });
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ActivityLogTab() {
  const { data, isLoading } = trpc.devConsole.adminLogs.useQuery({ limit: 50, offset: 0 });
  return (
    <div className="cyber-card overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead className="text-[#ccff00]">Time</TableHead>
            <TableHead className="text-[#ccff00]">User</TableHead>
            <TableHead className="text-[#ccff00]">Action</TableHead>
            <TableHead className="text-[#ccff00]">Details</TableHead>
            <TableHead className="text-[#ccff00]">IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-white/40">
                Loading…
              </TableCell>
            </TableRow>
          ) : (
            data?.map(({ log, userName }) => (
              <TableRow key={log.id} className="border-white/10">
                <TableCell className="whitespace-nowrap text-xs text-white/60">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-xs">{userName ?? log.userId}</TableCell>
                <TableCell className="font-mono text-xs text-[#ff00b3]">{log.action}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-white/50">
                  {JSON.stringify(log.details ?? {})}
                </TableCell>
                <TableCell className="text-xs text-white/40">{log.ipAddress ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DatabaseStatsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.devConsole.databaseStats.useQuery();
  const clear = trpc.devConsole.clearStalePendingOrders.useMutation({
    onSuccess: (r) => {
      utils.devConsole.databaseStats.invalidate();
      toast.success(`Deleted ${r.deleted} stale orders`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <p className="text-white/40">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="cyber-card p-4">
          <h3 className="mb-2 text-sm font-bold text-[#ccff00]">Users by role</h3>
          <ul className="space-y-1 text-sm text-white/70">
            {data.usersByRole.map((r) => (
              <li key={r.role}>
                {r.role}: <span className="text-white">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cyber-card p-4">
          <h3 className="mb-2 text-sm font-bold text-[#ccff00]">Products</h3>
          <p className="text-sm text-white/70">
            Active: {data.products.active} / Inactive: {data.products.inactive}
          </p>
        </div>
        <div className="cyber-card p-4">
          <h3 className="mb-2 text-sm font-bold text-[#ccff00]">Orders by status</h3>
          <ul className="space-y-1 text-sm text-white/70">
            {data.ordersByStatus.map((r) => (
              <li key={r.status}>
                {r.status}: <span className="text-white">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cyber-card p-4">
          <h3 className="mb-2 text-sm font-bold text-[#ccff00]">Revenue (paid)</h3>
          <p className="text-2xl font-black text-[#ff00b3]">฿{data.revenuePaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="cyber-card p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#ccff00]">
          <Code2 className="h-4 w-4" /> Table row counts
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
          {Object.entries(data.tableCounts).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-white/5 py-1 text-white/60">
              <span>{k}</span>
              <span className="text-white">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="bg-red-950/80 text-red-200">
            Clear stale pending orders (&gt;24h)
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-white/10 bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stale pending orders?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Permanently removes pending orders older than 24 hours (and their line items).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600"
              onClick={() => clear.mutate()}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
