import express from 'express';
import cors from 'cors';
import { requireAuthExcept } from './middleware/requireAuthExcept.js';
import spellsRouter from './features/spells/routes/spells.js';
import characterRouter from './features/characters/routes/characterRoutes.js';
import lookupsRouter from './routes/lookups.js';
import authRouter from './routes/authRoutes.js';
import userProfileRouter from './routes/userProfile.js';
import referenceTablesRouter from './features/reference_tables/routes/referenceTables.js';
import entityResolverRouter from './routes/entityResolver.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(requireAuthExcept);

app.use('/api/spells', spellsRouter);
app.use('/api/characters', characterRouter);
app.use('/api/lookups', lookupsRouter);
app.use('/api/auth', authRouter);
app.use('/api/user/profile', userProfileRouter);
app.use('/api/reference-tables', referenceTablesRouter);
app.use('/api/entities', entityResolverRouter);
app.get('/health', (req, res) => res.send('OK'));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend listening on port ${port}`));
