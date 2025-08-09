import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AppConfig } from '../config';

export const IcpSchema = z.object({
	segmentName: z.string().describe('Название сегмента ЦА'),
	demographics: z.object({
		region: z.array(z.string()).describe('Страны/города'),
		companySize: z.string().describe('Размер компании или доход'),
		decisionMakers: z.array(z.string()).describe('Должности лиц, принимающих решения'),
		budgetRange: z.string().optional(),
	}),
	behaviors: z.array(z.string()).describe('Поведенческие паттерны и триггеры'),
	pains: z.array(z.string()).describe('Ключевые боли и потребности'),
	gains: z.array(z.string()).describe('Ожидаемые результаты/ценность'),
	channels: z.array(z.string()).describe('Каналы коммуникации и где искать аудиторию'),
	keywords: z.array(z.string()).describe('Ключевые слова/темы для поиска и контента'),
	examplePersonas: z
		.array(
			z.object({
				name: z.string(),
				role: z.string(),
				description: z.string(),
			}),
		)
		.min(2),
	objections: z.array(z.string()).describe('Типовые возражения'),
	metrics: z.array(z.string()).describe('Метрики для проверки гипотез (MVP/маркетинг)'),
});

export type IcpProfile = z.infer<typeof IcpSchema>;

export class AudienceAgent {
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

	async buildICP(input: {
		product: string;
		market: string;
		pricePoint?: string;
		geo?: string;
		currentCustomersSample?: string;
		researchUrls?: string[];
	}): Promise<IcpProfile> {
		const system = [
			'Ты маркетинговый стратег. Отвечай кратко, по делу, на русском.',
			'Сформируй идеальный профиль клиента (ICP) по JSON-схеме строго, без лишнего текста.',
		].join(' ');

		const userParts = [
			`Бизнес: ${this.config.businessName}`,
			`Контекст: ${this.config.businessContext}`,
			`Продукт/услуга: ${input.product}`,
			`Рынок/нишa: ${input.market}`,
			input.pricePoint ? `Цена/чек: ${input.pricePoint}` : '',
			input.geo ? `Гео: ${input.geo}` : '',
			input.currentCustomersSample
				? `Нынешние клиенты (пример): ${input.currentCustomersSample}`
				: '',
		].filter(Boolean);

		if (input.researchUrls?.length) {
			try {
				const { fetchMany } = await import('../utils/web');
				const research = await fetchMany(input.researchUrls, 12000);
				userParts.push(`Исследование веб-источников:\n${research}`);
			} catch (e) {
				userParts.push(`[Исследование пропущено: ${(e as Error).message}]`);
			}
		}

		userParts.push('Верни только JSON.');

		const user = userParts.join('\n');

		const structured = RunnableLambda.from(async () => [
			new SystemMessage(system),
			new HumanMessage(user),
		]).pipe(this.llm.withStructuredOutput(IcpSchema, { name: 'icp_profile' }));

		const result = await structured.invoke([] as any);
		return result as IcpProfile;
	}
}
