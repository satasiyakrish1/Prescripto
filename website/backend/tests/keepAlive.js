import axios from 'axios';
import cron from 'node-cron';

// ✅ Replace this with your deployed backend URL
const URL = 'https://krishsatasiya-prescripto.onrender.com/ping';

// Schedule a GET request every 5 minutes to keep the server alive
cron.schedule('*/5 * * * *', async () => {
  try {
    const res = await axios.get(URL);
    console.log(`[KeepAlive] Ping sent at ${new Date().toLocaleTimeString()} - Status: ${res.status}`);
  } catch (err) {
    console.error('[KeepAlive] Ping failed:', err.message);
  }
});

console.log('[KeepAlive] Auto-ping scheduler initialized - pinging every 5 minutes');
