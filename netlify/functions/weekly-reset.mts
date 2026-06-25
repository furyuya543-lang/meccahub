import { schedule } from "@netlify/functions";

// Runs every Monday at 00:00 UTC
const handler = async () => {
  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/weekly-reset`, {
    method: "POST",
    headers: {
      "x-cron-secret": process.env.CRON_SECRET ?? "",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("Weekly reset failed:", res.status, data);
    return { statusCode: res.status };
  }

  console.log("Weekly reset complete:", data);
  return { statusCode: 200 };
};

export default schedule("0 0 * * 1", handler);
