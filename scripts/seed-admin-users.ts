import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

type SeedUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "admin" | "admissions_officer";
};

const users: SeedUser[] = [
  {
    email: "info.tcoefs@gmail.com",
    password: "super_admin@12345",
    firstName: "Super",
    lastName: "Admin",
    role: "super_admin",
  },
  {
    email: "bawa04john@gmail.com",
    password: "admin@12345",
    firstName: "Portal",
    lastName: "Admin",
    role: "admin",
  },
  {
    email: "link.jaybee@yahoo.com",
    password: "admission_officer@12345",
    firstName: "Admissions",
    lastName: "Officer",
    role: "admissions_officer",
  },
];

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function upsertUser(supabaseAdmin: any, user: SeedUser) {
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw new Error(`Unable to list auth users: ${listError.message}`);

  const existingAuthUser = listData.users.find((entry: any) => entry.email?.toLowerCase() === user.email.toLowerCase());
  const passwordHash = await bcrypt.hash(user.password, 10);

  let userId = existingAuthUser?.id;
  if (!userId) {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      password_hash: passwordHash,
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
      },
    });
    if (createError || !created.user?.id) {
      throw new Error(`Unable to create auth user for ${user.email}: ${createError?.message || "Unknown error"}`);
    }
    userId = created.user.id;
  } else {
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
      password_hash: passwordHash,
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
      },
    });
    if (updateAuthError) {
      throw new Error(`Unable to update auth user for ${user.email}: ${updateAuthError.message}`);
    }
  }

  const { data: profile, error: profileFetchError } = await ((supabaseAdmin as any)
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle() as any);
  if (profileFetchError) {
    throw new Error(`Unable to load profile for ${user.email}: ${profileFetchError.message}`);
  }

  const profilePayload = {
    user_id: userId,
    first_name: user.firstName,
    last_name: user.lastName,
    phone: null,
    role: user.role,
    verification_status: "approved",
  };

  if (profile?.id) {
    const { error: updateProfileError } = await ((supabaseAdmin as any)
      .from("profiles")
      .update(profilePayload)
      .eq("user_id", userId) as any);
    if (updateProfileError) {
      throw new Error(`Unable to update profile for ${user.email}: ${updateProfileError.message}`);
    }
  } else {
    const { error: insertProfileError } = await ((supabaseAdmin as any)
      .from("profiles")
      .insert(profilePayload) as any);
    if (insertProfileError) {
      throw new Error(`Unable to insert profile for ${user.email}: ${insertProfileError.message}`);
    }
  }

  return userId;
}

async function main() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  for (const user of users) {
    const userId = await upsertUser(supabaseAdmin, user);
    console.log(`[seed-admin-users] upserted ${user.email} (${user.role}) -> ${userId}`);
  }

  console.log("[seed-admin-users] completed");
}

main().catch((error) => {
  console.error("[seed-admin-users] failed", error);
  process.exit(1);
});
