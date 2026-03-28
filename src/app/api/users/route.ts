import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createUserSchema } from "@/lib/validations";
import { generateToken, tokenExpiry } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { activationEmailTemplate } from "@/lib/email/templates";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // Store a random placeholder password hash — user will set real password via activation
  const placeholderHash = await bcrypt.hash(generateToken(), 12);
  const activationToken = generateToken();

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: placeholderHash,
      role,
      isActive: false,
      activationToken,
      activationExpires: tokenExpiry(24),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Send activation email
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const activationUrl = `${appUrl}/activate/${activationToken}`;

  try {
    await sendEmail(email, "Set your password — KCB Portal", activationEmailTemplate(name, activationUrl));
  } catch (err) {
    console.error("Failed to send activation email:", err);
  }

  return NextResponse.json(user, { status: 201 });
}
