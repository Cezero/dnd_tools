import express from 'express';
import cors from 'cors';
import spellsRouter from '../routes/spells.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/spells', spellsRouter);
app.get('/health', (req, res) => res.send('OK'));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend listening on port ${port}`));
