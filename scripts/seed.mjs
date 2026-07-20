// Seeds demo accounts + data into a real Supabase project so the app isn't
// empty the first time you log in. Uses the Admin API (not raw SQL) because
// creating a login-able user requires Supabase Auth to hash the password.
//
// Run with:  node --env-file=.env.local scripts/seed.mjs
//
// Demo logins created (password for all: demo123456):
//   owner@fademastersdemo.com     — business owner, Fade Masters Barbershop
//   customer@fademastersdemo.com  — customer with booking history

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run this with: node --env-file=.env.local scripts/seed.mjs"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const PASSWORD = "demo123456";

async function getOrCreateUser(email, fullName, role) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  if (found) return found;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  console.log("Creating demo users...");
  const owner = await getOrCreateUser("owner@fademastersdemo.com", "Alex Rivera", "business_owner");
  const customer = await getOrCreateUser("customer@fademastersdemo.com", "Jordan Lee", "customer");

  console.log("Creating business...");
  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", owner.id)
    .maybeSingle();

  let businessId = existingBiz?.id;
  if (!businessId) {
    const { data: biz, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: owner.id,
        name: "Fade Masters Barbershop",
        category: "barbers",
        address: "214 Elm St, Austin, TX",
        hours: "Mon–Sat · 9:00 AM–7:00 PM",
      })
      .select()
      .single();
    if (error) throw error;
    businessId = biz.id;
  }

  console.log("Adding services...");
  const serviceDefs = [
    { name: "Classic Haircut", duration_minutes: 30, price_cents: 3500 },
    { name: "Fade + Beard Trim", duration_minutes: 45, price_cents: 5000 },
    { name: "Hot Towel Shave", duration_minutes: 25, price_cents: 3000 },
    { name: "Kids Cut", duration_minutes: 20, price_cents: 2200 },
  ];
  const { data: existingServices } = await supabase
    .from("services")
    .select("id, name")
    .eq("business_id", businessId);

  const services = [...(existingServices ?? [])];
  for (const def of serviceDefs) {
    if (services.some((s) => s.name === def.name)) continue;
    const { data, error } = await supabase
      .from("services")
      .insert({ business_id: businessId, ...def })
      .select()
      .single();
    if (error) throw error;
    services.push(data);
  }

  console.log("Adding staff...");
  const staffDefs = [
    { name: "Marcus Diallo", role: "Senior Barber" },
    { name: "Ray Chen", role: "Barber" },
    { name: "Jasmine Cole", role: "Barber" },
  ];
  const { data: existingStaff } = await supabase.from("staff").select("name").eq("business_id", businessId);
  for (const def of staffDefs) {
    if ((existingStaff ?? []).some((s) => s.name === def.name)) continue;
    const { error } = await supabase.from("staff").insert({ business_id: businessId, ...def });
    if (error) throw error;
  }

  console.log("Adding sample booking history for the demo customer...");
  const classicCut = services.find((s) => s.name === "Classic Haircut");
  const fadeTrim = services.find((s) => s.name === "Fade + Beard Trim");

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("customer_id", customer.id)
    .eq("business_id", businessId);

  if (!existingBookings?.length) {
    const past = new Date();
    past.setDate(past.getDate() - 14);
    const { data: completedBooking, error: b1Error } = await supabase
      .from("bookings")
      .insert({
        business_id: businessId,
        customer_id: customer.id,
        booking_date: past.toISOString().slice(0, 10),
        booking_time: "2:00 PM",
        status: "completed",
        payment_status: "paid",
        total_price_cents: classicCut.price_cents,
      })
      .select()
      .single();
    if (b1Error) throw b1Error;
    await supabase.from("booking_services").insert({
      booking_id: completedBooking.id,
      service_id: classicCut.id,
      name_snapshot: classicCut.name,
      price_cents_snapshot: classicCut.price_cents,
      duration_minutes_snapshot: classicCut.duration_minutes,
    });
    await supabase.from("reviews").insert({
      business_id: businessId,
      customer_id: customer.id,
      booking_id: completedBooking.id,
      rating: 5,
      body: "Great cut, quick and friendly!",
    });

    const upcoming = new Date();
    upcoming.setDate(upcoming.getDate() + 3);
    const { data: upcomingBooking, error: b2Error } = await supabase
      .from("bookings")
      .insert({
        business_id: businessId,
        customer_id: customer.id,
        booking_date: upcoming.toISOString().slice(0, 10),
        booking_time: "10:00 AM",
        total_price_cents: fadeTrim.price_cents,
      })
      .select()
      .single();
    if (b2Error) throw b2Error;
    await supabase.from("booking_services").insert({
      booking_id: upcomingBooking.id,
      service_id: fadeTrim.id,
      name_snapshot: fadeTrim.name,
      price_cents_snapshot: fadeTrim.price_cents,
      duration_minutes_snapshot: fadeTrim.duration_minutes,
    });
  }

  console.log("\nDone. Log in with:");
  console.log("  Business owner: owner@fademastersdemo.com / demo123456");
  console.log("  Customer:       customer@fademastersdemo.com / demo123456");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
