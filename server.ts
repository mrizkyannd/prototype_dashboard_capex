import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  getControl, 
  getProjects, 
  getFinancials, 
  getProcurement, 
  getVowd, 
  getFinancialGroups,
  getFinancialProjectGroups,
  getProcurementValueGroups,
  getProcurementLineGroups,
  getVowdGroups,
  getVowdProjectGroups,
  getValidationData,
  getAllData
} from './src/server/sheetsService.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Combined endpoint for fast initial load and cache sync
  app.get('/api/sheets/all', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getAllData(forceRefresh);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching all sheets data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Endpoints for Google Sheets Data Service
  app.get('/api/sheets/control', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getControl(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching control data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/projects', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getProjects(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching project data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/financials', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getFinancials(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching financial data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/procurement', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getProcurement(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching procurement data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/vowd', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getVowd(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching vowd data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/financial-groups', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getFinancialGroups(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching financial groups data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/financial-project-groups', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getFinancialProjectGroups(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching financial project groups data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/procurement-value-groups', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getProcurementValueGroups(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching procurement value groups data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/procurement-line-groups', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getProcurementLineGroups(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching procurement line groups data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/vowd-groups', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getVowdGroups(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching vowd groups data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/vowd-project-groups', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const data = await getVowdProjectGroups(forceRefresh);
      res.json({ success: true, count: data.length, data });
    } catch (err: any) {
      console.error('Error fetching vowd project groups data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sheets/validation', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const validation = await getValidationData(forceRefresh);
      res.json({ success: true, data: validation });
    } catch (err: any) {
      console.error('Error fetching validation data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
