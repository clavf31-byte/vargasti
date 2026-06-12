import { processEmailPipeline } from "./emailAgent.functions";

/**
 * Email Polling Service
 *
 * Checks for unread emails and processes them:
 * - Fetches emails from Gmail
 * - Interprets with Claude
 * - Creates tickets in Helpdesk
 * - Marks as read
 */

let pollingInterval: ReturnType<typeof setInterval> | null = null;
let pollingPromise: Promise<void> | null = null;

interface PollingConfig {
  intervalMs?: number; // Default: 5 minutes (300000ms)
  maxEmailsPerPoll?: number; // Default: 5
}

const DEFAULT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_EMAILS = 5;

/**
 * Start polling for emails with atomic Promise-based locking
 */
export async function startEmailPolling(config?: PollingConfig) {
  if (pollingPromise) {
    console.warn("[email-polling] Already polling, skipping start");
    return;
  }

  const interval = config?.intervalMs ?? DEFAULT_INTERVAL;
  const maxEmails = config?.maxEmailsPerPoll ?? DEFAULT_MAX_EMAILS;

  console.log(`[email-polling] Starting with interval: ${interval}ms, max emails: ${maxEmails}`);

  pollingPromise = (async () => {
    try {
      // Run immediately on start
      await runEmailPollingCycle(maxEmails);

      // Then run at intervals
      pollingInterval = setInterval(async () => {
        await runEmailPollingCycle(maxEmails);
      }, interval);
    } catch (err) {
      console.error("[email-polling] Fatal error in polling loop:", err);
    } finally {
      pollingPromise = null;
    }
  })();
}

/**
 * Stop polling for emails
 */
export function stopEmailPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  pollingPromise = null;
  console.log("[email-polling] Stopped");
}

/**
 * Check if currently polling
 */
export function isEmailPollingActive(): boolean {
  return pollingPromise !== null;
}

/**
 * Run one polling cycle
 */
async function runEmailPollingCycle(maxEmails: number) {
  try {
    console.log(`[email-polling] Running cycle at ${new Date().toISOString()}`);

    const result = await processEmailPipeline({ data: { maxEmails } });

    console.log("[email-polling] Cycle result:", result);

    return result;
  } catch (err) {
    console.error("[email-polling] Cycle error:", err);
  }
}

/**
 * Manually trigger one polling cycle (for buttons/UI)
 */
export async function triggerEmailPolling(maxEmails: number = DEFAULT_MAX_EMAILS) {
  console.log("[email-polling] Manual trigger");
  return await runEmailPollingCycle(maxEmails);
}
