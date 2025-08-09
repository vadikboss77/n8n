import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
	port: z.coerce.number().default(3030),
	openAiApiKey: z.string().min(10, 'OPENAI_API_KEY is required').describe('OpenAI API Key'),
	model: z.string().default('gpt-4o-mini'),
	dailyCron: z.string().default('0 9 * * 1-5'),
	timezone: z.string().default('Europe/Moscow'),
	language: z.string().default('ru'),
	businessName: z.string().default('My Business'),
	businessContext: z
		.string()
		.default('General assistant helping with planning, summaries, communications, and reporting.'),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(): AppConfig {
	const parsed = ConfigSchema.safeParse({
		port: process.env.PORT,
		openAiApiKey: process.env.OPENAI_API_KEY,
		model: process.env.MODEL,
		dailyCron: process.env.AGENT_DAILY_CRON,
		timezone: process.env.AGENT_TIMEZONE,
		language: process.env.AGENT_LANG,
		businessName: process.env.AGENT_BUSINESS_NAME,
		businessContext: process.env.AGENT_BUSINESS_CONTEXT,
	});

	if (!parsed.success) {
		const messages = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
		throw new Error(`Invalid configuration:\n${messages.join('\n')}`);
	}

	return parsed.data;
}
