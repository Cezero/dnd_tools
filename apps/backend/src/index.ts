import cors from 'cors';
import express, { Request, Response, RequestHandler } from 'express';

import { config } from './config';
import { errorHandler } from './middleware/errorMiddleware';
import { RequireAuthExcept } from './middleware/requireAuthExcept';
import { routes } from './routes';

const app = express();
app.use(cors(config.cors));
app.use(express.json());
app.use(RequireAuthExcept as RequestHandler);

// Register all routes
app.use('/api', routes);

app.get('/health', (req: Request, res: Response) => {
    res.send('OK');
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(config.port, () => console.log(`Backend listening on port ${config.port}`));
