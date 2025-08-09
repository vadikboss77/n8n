import { Router } from 'express';
import { AudienceAgent } from '../agent/AudienceAgent';
import { AppConfig } from '../config';

export function createIcpRouter(config: AppConfig) {
	const router = Router();
	const agent = new AudienceAgent(config);

	router.post('/', async (req, res) => {
		try {
			const body = req.body ?? {};
			const result = await agent.buildICP({
				product: String(body.product ?? ''),
				market: String(body.market ?? ''),
				pricePoint: body.pricePoint ? String(body.pricePoint) : undefined,
				geo: body.geo ? String(body.geo) : undefined,
				currentCustomersSample: body.currentCustomersSample
					? String(body.currentCustomersSample)
					: undefined,
				researchUrls: Array.isArray(body.researchUrls) ? body.researchUrls.map(String) : undefined,
			});
			res.json(result);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(error);
			res.status(500).json({ error: (error as Error).message });
		}
	});

	return router;
}
