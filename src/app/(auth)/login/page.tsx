"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("auth.invalidCredentials"));
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: hero image */}
      <div className="relative hidden w-1/2 lg:block">
        <img
          src="/inspection-hero.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-8 left-8 right-8">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">
            {t("auth.title")}
          </h2>
          <p className="mt-1 text-sm text-white/80 drop-shadow">
            {t("auth.subtitle")}
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex w-full items-center justify-center bg-gray-50 lg:w-1/2">
        <div className="w-full max-w-md mx-6 space-y-6">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Coloriginz" className="h-12 w-auto" />
          </div>
        <Card>
          <CardHeader className="space-y-1 text-center lg:text-left">
            <CardTitle className="text-2xl font-bold">{t("auth.title")}</CardTitle>
            <p className="text-sm text-gray-500 lg:hidden">
              {t("auth.subtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t("auth.email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {t("auth.password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </form>
            {process.env.NEXT_PUBLIC_TEST_MODE === "true" && (
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@coloriginz.nl");
                  setPassword("KcbInspect!2026");
                }}
                className="mt-4 w-full rounded-md border border-dashed border-red-300 bg-red-50 p-3 text-left text-sm text-red-600 transition-colors hover:bg-red-100"
              >
                <span className="font-medium">{t("auth.testCredentials")}</span>
                <br />
                admin@coloriginz.nl / KcbInspect!2026
              </button>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
