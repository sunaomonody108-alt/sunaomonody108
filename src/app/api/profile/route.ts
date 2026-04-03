export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  preferredName: z.string().optional(),
  occupation: z.string().optional(),
  birthdate: z.string().datetime().optional().nullable(),
  locationEstimate: z.string().optional(),
  interests: z.array(z.string()).optional(),
  customInstructions: z.record(z.unknown()).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    ...profile,
    interests: profile.interests ? JSON.parse(profile.interests) : [],
    customInstructions: profile.customInstructions
      ? JSON.parse(profile.customInstructions)
      : {},
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = UpdateProfileSchema.parse(body);

  const profileData = {
    ...(data.preferredName !== undefined && { preferredName: data.preferredName }),
    ...(data.occupation !== undefined && { occupation: data.occupation }),
    ...(data.birthdate !== undefined && {
      birthdate: data.birthdate ? new Date(data.birthdate) : null,
    }),
    ...(data.locationEstimate !== undefined && { locationEstimate: data.locationEstimate }),
    ...(data.interests !== undefined && { interests: JSON.stringify(data.interests) }),
    ...(data.customInstructions !== undefined && {
      customInstructions: JSON.stringify(data.customInstructions),
    }),
  };

  const profile = await db.userProfile.upsert({
    where: { userId: session.user.id },
    update: profileData,
    create: { userId: session.user.id, ...profileData },
  });

  return NextResponse.json({
    ...profile,
    interests: profile.interests ? JSON.parse(profile.interests) : [],
    customInstructions: profile.customInstructions
      ? JSON.parse(profile.customInstructions)
      : {},
  });
}
