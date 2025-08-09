import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AppConfig } from '../config';

const DailyPlanSchema = z.object({
	date: z.string().describe('ISO date for the plan'),
	priorities: z.array(z.string()).describe('Top priorities for the day'),
	tasks: z
		.array(
			z.object({
				title: z.string(),
				description: z.string().optional(),
				suggestedTools: z.array(z.string()).optional(),
				expectedOutcome: z.string().optional(),
			}),
		)
		.describe('Actionable tasks for today'),
	communications: z
		.array(
			z.object({
				audience: z.string(),
				message: z.string(),
				channel: z.enum(['email', 'chat', 'doc', 'meeting']).default('email'),
			}),
		)
		.default([]),
	risks: z.array(z.string()).default([]),
	notes: z.string().optional(),
});

export type DailyPlan = z.infer<typeof DailyPlanSchema>;

export class BusinessAgent {
	private readonly llm: ChatOpenAI;
	private readonly config: AppConfig;

	constructor(config: AppConfig) {
		this.config = config;
		this.llm = new ChatOpenAI({
			apiKey: config.openAiApiKey,
			model: config.model,
			temperature: 0.2,
		});
	}

	async planDay(dateIso: string): Promise<DailyPlan> {
		const system = [
			`You are a proactive executive assistant for a business called "${this.config.businessName}".`,
			'Your job is to generate a concise, actionable plan for the day, focusing on revenue, customers, product, and operations.',
			'Follow the JSON schema strictly. Be practical and prioritize high leverage actions.',
			'Consider the business context provided below.',
		].join(' ');

		const user = [
			`Date: ${dateIso}`,
			`Business context: ${this.config.businessContext}`,
			'Output JSON only, no extra text.',
		].join('\n');

		const structured = RunnableLambda.from(async () => [
			new SystemMessage(system),
			new HumanMessage(user),
		]).pipe(this.llm.withStructuredOutput(DailyPlanSchema, { name: 'daily_plan' }));

		const result = await structured.invoke([] as any);
		return result as DailyPlan;
	}

	async runDaily(dateIso: string): Promise<{ plan: DailyPlan }> {
		const plan = await this.planDay(dateIso);
		return { plan };
	}
}
