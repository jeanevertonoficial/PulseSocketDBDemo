import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Rota Proxy para comunicação transparente com PulseSocketDB
app.post('/api/pulsesocket-proxy/db/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const targetUrl = req.headers['x-target-url'] || 'http://localhost:3001';
    const apiKey = req.headers['x-api-key'] || 'pk_dev_4dbb07976f2f4466b50ca314ca0e9c59';

    const response = await axios.post(`${targetUrl}/api/db/${collection}`, req.body, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json(err.response?.data || { error: err.message });
  }
});

app.get('/api/pulsesocket-proxy/db/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const targetUrl = req.headers['x-target-url'] || 'http://localhost:3001';
    const apiKey = req.headers['x-api-key'] || 'pk_dev_4dbb07976f2f4466b50ca314ca0e9c59';

    const response = await axios.get(`${targetUrl}/api/db/${collection}`, {
      headers: {
        'x-api-key': apiKey
      },
      timeout: 5000
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json(err.response?.data || { error: err.message });
  }
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 PulseSocketDB Standalone Demo Rodando na Porta ${PORT}:`);
  console.log(`👉 Modelo 1 (Socket.io Direto): http://localhost:${PORT}/realtime.html`);
  console.log(`👉 Modelo 2 (Versão CDN JS):    http://localhost:${PORT}/realtime_cdn.html`);
  console.log(`==================================================`);
});
