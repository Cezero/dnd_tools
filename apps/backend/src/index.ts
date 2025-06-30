import cors from 'cors';
import express, { Request, Response, RequestHandler } from 'express';

import { RequireAuthExcept } from './middleware/requireAuthExcept';
import { routes } from './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(RequireAuthExcept as RequestHandler);

// Register all routes
app.use('/api', routes);

app.get('/health', (req: Request, res: Response) => {
    res.send('OK');
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend listening on port ${port}`));
