import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  aliasType: z.enum([
    "PA_RESIDENT",
    "COLLEGE_STUDENT",
    "POLI_SCI_WORKER",
    "GOVT_WORKER",
    "JOURNALIST",
    "EDUCATOR",
    "HEALTHCARE",
    "OTHER",
  ]),
  aliasYears: z.number().min(1).max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { aliasType, aliasYears } = profileSchema.parse(body);

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        aliasType,
        aliasYears: aliasType === "OTHER" ? null : aliasYears,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
