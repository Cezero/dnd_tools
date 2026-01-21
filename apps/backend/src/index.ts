import cors from 'cors';
import express, { Request, Response, RequestHandler } from 'express';

import { config } from './config';
import { closeRedisClient } from './features/shared/session/redisClient';
import { WebSocketServer } from './features/shared/websocket/WebSocketServer';
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

const server = app.listen(config.port, () => console.log(`Backend listening on port ${config.port}`));

// Initialize WebSocket server
const wsServer = new WebSocketServer();
wsServer.initialize(server);

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await wsServer.close();
    await closeRedisClient();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
