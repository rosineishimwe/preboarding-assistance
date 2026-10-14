import app from './app.js';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/db.js';

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
