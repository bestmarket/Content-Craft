import { useState } from "react";
import { useListUsers, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { getListUsersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, Trash2, ShieldCheck, ShieldOff, UserCheck, UserX,
  Crown, MinusCircle, Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [upgradeUser, setUpgradeUser] = useState<{ id: number; name: string } | null>(null);
  const [expiryDays, setExpiryDays] = useState("30");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${BASE}/api/users/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viralcraft-users-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Users exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const params = search ? { search } : {};
  const { data, isLoading } = useListUsers(params, { query: { queryKey: getListUsersQueryKey(params) } });
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const handleToggle = (id: number, isActive: boolean) => {
    updateUser.mutate({ id, data: { isActive: !isActive } }, { onSuccess: invalidate });
  };

  const handleMakeAdmin = (id: number, role: string) => {
    updateUser.mutate({ id, data: { role: role === "admin" ? "user" : "admin" } }, {
      onSuccess: () => {
        toast({ title: role === "admin" ? "Role set to user" : "Role set to admin" });
        invalidate();
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => { toast({ title: "User deleted" }); invalidate(); },
    });
  };

  const handleUpgrade = () => {
    if (!upgradeUser) return;
    const days = parseInt(expiryDays) || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    updateUser.mutate(
      { id: upgradeUser.id, data: { subscriptionTier: "pro", subscriptionExpiresAt: expiresAt.toISOString() } },
      {
        onSuccess: () => {
          toast({ title: `${upgradeUser.name} upgraded to Pro (${days} days)` });
          setUpgradeUser(null);
          invalidate();
        },
      }
    );
  };

  const handleDowngrade = (id: number, name: string) => {
    updateUser.mutate(
      { id, data: { subscriptionTier: "free", subscriptionExpiresAt: null } },
      {
        onSuccess: () => {
          toast({ title: `${name} moved to Free` });
          invalidate();
        },
      }
    );
  };

  const users = data?.users ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} total users</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>
          ))
        ) : !users.length ? (
          <Card className="p-8 text-center text-muted-foreground">No users found</Card>
        ) : users.map((user: any) => (
          <Card key={user.id} className="p-4 space-y-3">
            {/* User info row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                  {" · "}{user.contentCount} pieces
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize text-xs">
                  {user.role}
                </Badge>
                <Badge className={user.isActive ? "bg-green-50 text-green-700 text-xs" : "bg-red-50 text-red-700 text-xs"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Plan row */}
            <div className="flex items-center justify-between">
              <div>
                {user.subscriptionTier === "pro" ? (
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1 text-xs">
                      <Crown className="w-3 h-3" /> Pro
                    </Badge>
                    {user.subscriptionExpiresAt && (
                      <span className="text-xs text-muted-foreground">
                        until {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">Free</Badge>
                )}
              </div>
            </div>

            {/* Actions row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border">
              {user.subscriptionTier === "pro" ? (
                <Button
                  variant="outline" size="sm" className="h-8 text-xs text-muted-foreground border flex-1"
                  onClick={() => handleDowngrade(user.id, user.name)}
                >
                  <MinusCircle className="w-3 h-3 mr-1" /> Downgrade
                </Button>
              ) : (
                <Button
                  size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white flex-1"
                  onClick={() => { setExpiryDays("30"); setUpgradeUser({ id: user.id, name: user.name }); }}
                >
                  <Crown className="w-3 h-3 mr-1" /> Upgrade to Pro
                </Button>
              )}
              <Button
                variant="outline" size="sm" className="h-8 text-xs flex-1"
                onClick={() => handleToggle(user.id, user.isActive)}
              >
                {user.isActive
                  ? <><UserX className="w-3 h-3 mr-1 text-amber-500" /> Deactivate</>
                  : <><UserCheck className="w-3 h-3 mr-1 text-green-500" /> Activate</>}
              </Button>
              <Button
                variant="outline" size="sm" className="h-8 text-xs flex-1"
                onClick={() => handleMakeAdmin(user.id, user.role)}
              >
                {user.role === "admin"
                  ? <><ShieldOff className="w-3 h-3 mr-1 text-orange-500" /> Demote</>
                  : <><ShieldCheck className="w-3 h-3 mr-1 text-primary" /> Make Admin</>}
              </Button>
              <Button
                variant="outline" size="sm" className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50"
                onClick={() => handleDelete(user.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <Card className="border overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Content</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : !users.length ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No users found</td></tr>
              ) : users.map((user: any) => (
                <tr key={user.id} data-testid={`user-row-${user.id}`} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.subscriptionTier === "pro" ? (
                      <div>
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1">
                          <Crown className="w-3 h-3" /> Pro
                        </Badge>
                        {user.subscriptionExpiresAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Exp: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Free</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.contentCount}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {user.subscriptionTier === "pro" ? (
                        <Button
                          variant="outline" size="sm" className="h-7 text-xs text-muted-foreground border"
                          onClick={() => handleDowngrade(user.id, user.name)}
                        >
                          <MinusCircle className="w-3 h-3 mr-1" /> Downgrade
                        </Button>
                      ) : (
                        <Button
                          size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => { setExpiryDays("30"); setUpgradeUser({ id: user.id, name: user.name }); }}
                        >
                          <Crown className="w-3 h-3 mr-1" /> Upgrade
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title={user.isActive ? "Deactivate" : "Activate"}
                        onClick={() => handleToggle(user.id, user.isActive)}
                      >
                        {user.isActive ? <UserX className="w-4 h-4 text-amber-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title={user.role === "admin" ? "Demote to user" : "Make admin"}
                        onClick={() => handleMakeAdmin(user.id, user.role)}
                      >
                        {user.role === "admin" ? <ShieldOff className="w-4 h-4 text-orange-500" /> : <ShieldCheck className="w-4 h-4 text-primary" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upgrade dialog */}
      <Dialog open={!!upgradeUser} onOpenChange={(open) => !open && setUpgradeUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Upgrade to Pro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Granting <span className="font-semibold">{upgradeUser?.name}</span> a Pro subscription.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="expiry-days">Duration (days)</Label>
              <Input
                id="expiry-days"
                type="number"
                min={1}
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Expires: {(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + (parseInt(expiryDays) || 30));
                  return d.toLocaleDateString();
                })()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeUser(null)}>Cancel</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleUpgrade}
              disabled={updateUser.isPending}
            >
              <Crown className="w-4 h-4 mr-1.5" />
              {updateUser.isPending ? "Upgrading..." : "Upgrade to Pro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
