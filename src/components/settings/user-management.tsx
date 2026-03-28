"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, X, Check, MoreHorizontal, Pencil, Trash2, Mail, KeyRound, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const emptyForm: UserForm = { name: "", email: "", password: "", role: "USER" };

export function UserManagement() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const currentUserId = (session?.user as { id?: string })?.id;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function startEdit(user: User) {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setShowCreate(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowCreate(false);
    setForm(emptyForm);
  }

  async function handleCreate() {
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, role: form.role }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success(t("users.created"));
      setShowCreate(false);
      setForm(emptyForm);
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || t("users.createFailed"));
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    setSaving(true);

    const payload: Record<string, string> = {};
    if (form.name) payload.name = form.name;
    if (form.email) payload.email = form.email;
    if (form.role) payload.role = form.role;
    if (form.password) payload.password = form.password;

    const res = await fetch(`/api/users/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.ok) {
      toast.success(t("users.updated"));
      cancelEdit();
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || t("users.updateFailed"));
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t("users.deleteConfirm", { name }))) return;

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("users.deleted"));
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || t("users.deleteFailed"));
    }
  }

  async function handleResendActivation(id: string) {
    const res = await fetch(`/api/users/${id}/send-activation`, { method: "POST" });
    if (res.ok) {
      toast.success(t("users.activationSent"));
    } else {
      const data = await res.json();
      toast.error(data.error || t("users.activationFailed"));
    }
  }

  async function handleSendReset(id: string) {
    const res = await fetch(`/api/users/${id}/send-reset`, { method: "POST" });
    if (res.ok) {
      toast.success(t("users.resetSent"));
    } else {
      const data = await res.json();
      toast.error(data.error || t("users.resetFailed"));
    }
  }

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentlyActive }),
    });
    if (res.ok) {
      toast.success(currentlyActive ? t("users.deactivated") : t("users.activated"));
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || t("users.updateFailed"));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          {t("users.title")}
        </CardTitle>
        {!showCreate && !editingId && (
          <Button
            size="sm"
            onClick={() => {
              setShowCreate(true);
              setForm(emptyForm);
              setEditingId(null);
            }}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("users.addUser")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form — no password field, user sets via activation email */}
        {showCreate && (
          <div className="rounded-md border bg-gray-50 p-4 space-y-3">
            <h4 className="text-sm font-medium">{t("users.newUser")}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t("users.namePlaceholder")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder={t("users.emailPlaceholder")}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t("users.roleUser")}</SelectItem>
                  <SelectItem value="ADMIN">{t("users.roleAdmin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">{t("users.activationEmailNote")}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving} className="gap-1">
                <Check className="h-4 w-4" />
                {saving ? t("users.creating") : t("users.create")}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                <X className="h-4 w-4" />
                {t("users.cancel")}
              </Button>
            </div>
          </div>
        )}

        {/* Edit form (mobile + desktop) */}
        {editingId && (
          <div className="rounded-md border bg-blue-50 p-4 space-y-3">
            <h4 className="text-sm font-medium">{t("users.edit")}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("users.namePlaceholder")}
              />
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("users.emailPlaceholder")}
                type="email"
              />
              <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t("users.roleUser")}</SelectItem>
                  <SelectItem value="ADMIN">{t("users.roleAdmin")}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={t("users.editPasswordPlaceholder")}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate} disabled={saving} className="gap-1">
                <Check className="h-4 w-4" />
                {saving ? t("users.creating") : t("users.create")}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                <X className="h-4 w-4" />
                {t("users.cancel")}
              </Button>
            </div>
          </div>
        )}

        {/* Mobile card view */}
        <div className="space-y-2 md:hidden">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("users.edit")}
                      </DropdownMenuItem>
                      {!user.isActive && (
                        <DropdownMenuItem onClick={() => handleResendActivation(user.id)}>
                          <Mail className="mr-2 h-4 w-4" />
                          {t("users.resendActivation")}
                        </DropdownMenuItem>
                      )}
                      {user.isActive && (
                        <DropdownMenuItem onClick={() => handleSendReset(user.id)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          {t("users.resetPasswordAction")}
                        </DropdownMenuItem>
                      )}
                      {user.id !== currentUserId && (
                        <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.isActive)}>
                          {user.isActive ? (
                            <><UserX className="mr-2 h-4 w-4" />{t("users.deactivate")}</>
                          ) : (
                            <><UserCheck className="mr-2 h-4 w-4" />{t("users.activate")}</>
                          )}
                        </DropdownMenuItem>
                      )}
                      {user.id !== currentUserId && (
                        <DropdownMenuItem onClick={() => handleDelete(user.id, user.name)} className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("users.delete")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <Badge variant={user.isActive ? "default" : "secondary"} className="text-[10px]">
                  {user.isActive ? t("users.statusActive") : t("users.statusPending")}
                </Badge>
                <span className="text-gray-400">{new Date(user.createdAt).toLocaleDateString("nl-NL")}</span>
              </div>
            </div>
          ))}
          {loading && <div className="py-8 text-center text-gray-500">{t("users.loading")}</div>}
          {!loading && users.length === 0 && (
            <div className="py-8 text-center text-gray-500">{t("users.noUsers")}</div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.email")}</TableHead>
                <TableHead>{t("table.role")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.created")}</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? t("users.statusActive") : t("users.statusPending")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("nl-NL")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("users.edit")}
                          </DropdownMenuItem>
                          {!user.isActive && (
                            <DropdownMenuItem onClick={() => handleResendActivation(user.id)}>
                              <Mail className="mr-2 h-4 w-4" />
                              {t("users.resendActivation")}
                            </DropdownMenuItem>
                          )}
                          {user.isActive && (
                            <DropdownMenuItem onClick={() => handleSendReset(user.id)}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              {t("users.resetPasswordAction")}
                            </DropdownMenuItem>
                          )}
                          {user.id !== currentUserId && (
                            <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.isActive)}>
                              {user.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  {t("users.deactivate")}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  {t("users.activate")}
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {user.id !== currentUserId && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(user.id, user.name)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("users.delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
              ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                    {t("users.loading")}
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                    {t("users.noUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
