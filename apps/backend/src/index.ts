import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import { RequireAuthExcept } from './middleware/RequireAuthExcept';
import { AuthRouter } from './routes/AuthRoutes';
import { UserProfileRouter } from './routes/UserProfile';
import { EntityResolverRouter } from './routes/EntityResolver';
import { featureRoutes } from './lib/FeatureRoutes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(RequireAuthExcept as RequestHandler);

// Dynamically add feature routes
featureRoutes.forEach(({ path, router }: { path: string; router: express.Router }) => {
    app.use(path, router);
});

app.use('/api/auth', AuthRouter);
app.use('/api/user/profile', UserProfileRouter);
app.use('/api/entities', EntityResolverRouter);
app.get('/health', (req: Request, res: Response) => {
    res.send('OK');
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend listening on port ${port}`));
