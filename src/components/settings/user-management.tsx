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
import { Users, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
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
      body: JSON.stringify(form),
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
        {/* Create form */}
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
              <Input
                placeholder={t("users.passwordPlaceholder")}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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

        {/* Users table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.email")}</TableHead>
                <TableHead>{t("table.role")}</TableHead>
                <TableHead>{t("table.created")}</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) =>
                editingId === user.id ? (
                  <TableRow key={user.id} className="bg-blue-50">
                    <TableCell>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">{t("users.roleUser")}</SelectItem>
                          <SelectItem value="ADMIN">{t("users.roleAdmin")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder={t("users.editPasswordPlaceholder")}
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleUpdate} disabled={saving}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
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
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("nl-NL")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.id !== currentUserId && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(user.id, user.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                    {t("users.loading")}
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
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
