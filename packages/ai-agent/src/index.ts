import express from 'express';
import bodyParser from 'body-parser';
import { loadConfig } from './config';
import { BusinessAgent } from './agent/BusinessAgent';
import { startDailyScheduler } from './scheduler';

async function main() {
  const config = loadConfig();
  const agent = new BusinessAgent(config);

  startDailyScheduler({
    agent,
    cronExpression: config.dailyCron,
    timezone: config.timezone,
  });

  const app = express();
  app.use(bodyParser.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/config', (_req, res) => {
    res.json({
      model: config.model,
      timezone: config.timezone,
      dailyCron: config.dailyCron,
      businessName: config.businessName,
    });
  });

  app.post('/run', async (req, res) => {
    try {
      const date = typeof req.body?.date === 'string' ? req.body.date : new Date().toISOString().slice(0, 10);
      const result = await agent.runDaily(date);
      res.json(result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`AI Agent listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting AI Agent', err);
  process.exit(1);
});