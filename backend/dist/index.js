import express from 'express';
import cors from 'cors';
import { ensureUsersTable } from './db/users.js';
import authRoutes from './routes/auth.js';
const app = express();
const PORT = process.env['PORT'] ?? 3001;
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
async function start() {
    try {
        await ensureUsersTable();
        console.log('Users table ready');
    }
    catch (err) {
        console.error('Failed to ensure users table:', err);
        process.exitCode = 1;
    }
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
}
start();
//# sourceMappingURL=index.js.map