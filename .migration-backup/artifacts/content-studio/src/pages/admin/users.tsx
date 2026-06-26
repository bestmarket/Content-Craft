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
import { Search, Trash2, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const params = search ? { search } : {};
  const { data, isLoading } = useListUsers(params, { query: { queryKey: getListUsersQueryKey(params) } });
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleToggle = (id: number, isActive: boolean) => {
    updateUser.mutate({ id, data: { isActive: !isActive } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }),
    });
  };

  const handleMakeAdmin = (id: number, role: string) => {
    updateUser.mutate({ id, data: { role: role === "admin" ? "user" : "admin" } }, {
      onSuccess: () => {
        toast({ title: role === "admin" ? "Role set to user" : "Role set to admin" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "User deleted" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm">{data?.total ?? 0} total users</p>
        </div>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            data-testid="input-search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Content</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : !data?.users?.length ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No users found</td></tr>
              ) : data.users.map((user: any) => (
                <tr key={user.id} data-testid={`user-row-${user.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.contentCount}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
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
                        {user.role === "admin" ? <ShieldOff className="w-4 h-4 text-orange-500" /> : <ShieldCheck className="w-4 h-4 text-purple-500" />}
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
    </div>
  );
}
