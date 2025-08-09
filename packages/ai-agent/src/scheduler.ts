import { CronJob } from 'cron';
import { BusinessAgent } from './agent/BusinessAgent';

export function startDailyScheduler(options: {
  agent: BusinessAgent;
  cronExpression: string;
  timezone: string;
  onRun?: (result: unknown) => void;
}): CronJob {
  const job = new CronJob(
    options.cronExpression,
    async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { plan } = await options.agent.runDaily(today);
      options.onRun?.({ plan });
      // For now, log the plan to stdout; could be sent to email/Slack in future.
      // eslint-disable-next-line no-console
      console.log(`[AI-AGENT] Daily plan for ${today}:\n${JSON.stringify(plan, null, 2)}`);
    },
    null,
    true,
    options.timezone,
  );

  return job;
}