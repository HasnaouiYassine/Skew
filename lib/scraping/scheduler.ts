/**
 * Oxylabs Scheduler API client (AGENTS.md section 18).
 * Server-only — handles large 64-bit integers as strings.
 */

const OXYLABS_SCHEDULER_BASE = "https://data.oxylabs.io/v1";

/* ─── Types ──────────────────────────────────────────────── */

export interface OxylabsJobInfo {
  id: string;
  result_status: "done" | "failed" | "pending";
}

export interface OxylabsRun {
  run_id: string;
  jobs: OxylabsJobInfo[];
  success_rate: number;
}

/* ─── Helpers ────────────────────────────────────────────── */

function getCredentials(): { username: string; password: string } {
  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "Missing Oxylabs credentials: OXY_WSA_USERNAME / OXY_WSA_PASSWORD"
    );
  }
  return { username, password };
}

function getAuthHeader(): string {
  const { username, password } = getCredentials();
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

/**
 * Make an authenticated request to the Oxylabs Scheduler API.
 * Returns the raw response text so callers can extract large integers safely.
 */
async function oxyApiFetch(
  method: string,
  path: string,
  body?: unknown
): Promise<{ rawText: string; ok: boolean; status: number }> {
  const auth = getAuthHeader();
  const response = await fetch(`${OXYLABS_SCHEDULER_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const rawText = await response.text();
  return { rawText, ok: response.ok, status: response.status };
}

/* ─── Schedule CRUD ──────────────────────────────────────── */

/**
 * Create a new schedule on Oxylabs.
 * Returns the schedule_id as a string to preserve bigint precision.
 */
export async function createSchedule(
  sourceUrl: string,
  cron = "0 6 * * *",
  endTime = "2035-12-31 23:59:59"
): Promise<{ scheduleId: string }> {
  console.log(`  [scheduler] Creating schedule for: ${sourceUrl}`);

  const { rawText, ok, status } = await oxyApiFetch("POST", "/schedules", {
    cron,
    items: [{ source: "universal", url: sourceUrl }],
    end_time: endTime,
  });

  if (!ok) {
    throw new Error(
      `Oxylabs createSchedule failed (${status}): ${rawText.slice(0, 300)}`
    );
  }

  // Extract schedule_id from raw text to preserve bigint precision
  const match = rawText.match(/"schedule_id"\s*:\s*(\d+)/);
  if (!match) {
    throw new Error(
      `Oxylabs createSchedule: no schedule_id in response: ${rawText.slice(0, 200)}`
    );
  }

  console.log(`  [scheduler] Created schedule: ${match[1]}`);
  return { scheduleId: match[1] };
}

/**
 * List all schedule IDs from Oxylabs.
 * Returns IDs as strings to preserve bigint precision.
 */
export async function listSchedules(): Promise<string[]> {
  console.log("  [scheduler] Listing all schedules...");

  const { rawText, ok, status } = await oxyApiFetch("GET", "/schedules");

  if (!ok) {
    throw new Error(
      `Oxylabs listSchedules failed (${status}): ${rawText.slice(0, 300)}`
    );
  }

  // Extract the "schedules" array and grab all digit sequences
  const ids: string[] = [];
  const arrayMatch = rawText.match(/"schedules"\s*:\s*\[(.*?)\]/);
  if (arrayMatch) {
    const digitRegex = /\d+/g;
    let m;
    while ((m = digitRegex.exec(arrayMatch[1])) !== null) {
      ids.push(m[0]);
    }
  }

  console.log(`  [scheduler] Found ${ids.length} schedule(s) on Oxylabs`);
  return ids;
}

/**
 * Get runs for a schedule. Uses /runs endpoint which includes result_status
 * per job (AGENTS.md section 18 — use /runs not /jobs).
 */
export async function getScheduleRuns(
  scheduleId: string
): Promise<OxylabsRun[]> {
  console.log(`  [scheduler] Fetching runs for schedule: ${scheduleId}`);

  const { rawText, ok, status } = await oxyApiFetch(
    "GET",
    `/schedules/${scheduleId}/runs`
  );

  if (!ok) {
    throw new Error(
      `Oxylabs getScheduleRuns failed (${status}): ${rawText.slice(0, 300)}`
    );
  }

  // Parse runs but protect large integers by extracting them first
  const data = JSON.parse(rawText);

  if (!data.runs || !Array.isArray(data.runs)) {
    return [];
  }

  return data.runs.map((run: Record<string, unknown>) => {
    const runIdRaw = JSON.stringify(run.run_id);
    const runId = runIdRaw.replace(/^"|"$/g, "");

    const jobs = ((run.jobs as Record<string, unknown>[]) ?? []).map(
      (job: Record<string, unknown>) => {
        const jobIdRaw = JSON.stringify(job.id);
        return {
          id: jobIdRaw.replace(/^"|"$/g, ""),
          result_status: job.result_status as OxylabsJobInfo["result_status"],
        };
      }
    );

    return {
      run_id: runId,
      jobs,
      success_rate: run.success_rate as number,
    };
  });
}

/**
 * Fetch the result content for a completed Oxylabs job.
 * Uses the Push-Pull query endpoint.
 */
export async function getJobResult(jobId: string): Promise<string> {
  console.log(`  [scheduler] Fetching job result: ${jobId}`);

  const auth = getAuthHeader();
  const response = await fetch(
    `${OXYLABS_SCHEDULER_BASE}/queries/${jobId}`,
    {
      method: "GET",
      headers: {
        Authorization: auth,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Oxylabs getJobResult failed (${response.status}) for job ${jobId}: ${body.slice(0, 300)}`
    );
  }

  const data = await response.json();

  if (!data.results?.[0]?.content) {
    throw new Error(`Oxylabs job ${jobId} returned no content`);
  }

  return data.results[0].content;
}

/**
 * Deactivate a schedule on Oxylabs (stops it from running further).
 */
export async function deactivateSchedule(
  scheduleId: string
): Promise<void> {
  console.log(`  [scheduler] Deactivating schedule: ${scheduleId}`);

  const { rawText, ok, status } = await oxyApiFetch(
    "PUT",
    `/schedules/${scheduleId}/state`,
    { active: false }
  );

  if (!ok) {
    throw new Error(
      `Oxylabs deactivateSchedule failed (${status}) for ${scheduleId}: ${rawText.slice(0, 300)}`
    );
  }

  console.log(`  [scheduler] Deactivated schedule: ${scheduleId}`);
}
