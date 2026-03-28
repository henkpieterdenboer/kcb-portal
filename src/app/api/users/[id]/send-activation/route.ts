import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateToken, tokenExpiry } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { activationEmailTemplate } from "@/lib/email/templates";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const activationToken = generateToken();

  await prisma.user.update({
    where: { id },
    data: {
      activationToken,
      activationExpires: tokenExpiry(24),
      isActive: false,
    },
  });

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const activationUrl = `${appUrl}/activate/${activationToken}`;

  try {
    await sendEmail(user.email, "Set your password — KCB Portal", activationEmailTemplate(user.name, activationUrl));
  } catch (err) {
    console.error("Failed to send activation email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
