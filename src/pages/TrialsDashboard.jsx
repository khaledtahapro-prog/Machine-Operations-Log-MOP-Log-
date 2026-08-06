const express = require('express');
const path = require('path');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const rawUrl = process.env.TURSO_DATABASE_URL || 'libsql://pwp-db-khaled0.aws-ap-south-1.turso.io';
const tursoUrl = rawUrl.replace(/^libsql:\/\//, 'https://');
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYwMzU1MjksImlkIjoiMDE5ZmQyZTAtNGMwMS03YzY2LWIyYjMtNGFiNjM4ZTQzMmRiIiwia2lkIjoiaUVvUkhyUUFYMHg5blMzZzJJdkRqTlNHR0pjTS1Bcm1ZUHVFaXptMF9WMCIsInJpZCI6IjQ0OTk4NWI5LTc1YjQtNDQxMi04ZjM5LWI2NzBkMzQyZTA2ZCJ9.rlQPrLBARMf4NFuXu28WDa9sBJtGh4bM3wuZOZldPLn3gws-WsmzXS_5ceT3lBVM0UTsIy-MUgt8TwjM6ylNCQ';

let db;
try {
  db = createClient({
    url: tursoUrl,
    authToken: authToken
  });
} catch (e) {
  console.error('Database client error:', e);
}

let memorySettings = { companyBaseline: 20, currentExternal: 35, dailyCostPerWorker: 150 };
let memoryMachines = [
  { id: 'L-01', name: 'Kabra 90', type: 'HDPE Single Wall Pipe', status: 'Active', required: 6, assigned: 'Company Staff', productMode: 'Coiled Product', shiftsCount: 2, operatingDays: 7 },
  { id: 'L-02', name: 'Beier 2', type: 'PPR Extrusion Line', status: 'Active', required: 6, assigned: 'Mixed (Company + Agency)', productMode: 'Coiled Product', shiftsCount: 2, operatingDays: 7 },
  { id: 'L-03', name: 'Wend 2', type: 'HDPE Telecom Pipe', status: 'Stopped', required: 6, assigned: 'Mixed (Company + Agency)', productMode: 'Coiled Product', shiftsCount: 2, operatingDays: 0 },
  { id: 'L-04', name: 'Wend 1', type: 'HDPE Telecom Pipe', status: 'Active', required: 6, assigned: 'Mixed (Company + Agency)', productMode: 'Coiled Product', shiftsCount: 2, operatingDays: 5 },
  { id: 'L-05', name: 'Beier 1', type: 'PPR Extrusion Line', status: 'Active', required: 6, assigned: 'Agency Staff', productMode: 'Coiled Product', shiftsCount: 2, operatingDays: 7 },
  { id: 'L-06', name: 'Duct 1', type: 'PVC Duct Line', status: 'Active', required: 4, assigned: 'Company Staff', productMode: 'Straight Pipe', shiftsCount: 2, operatingDays: 7 },
  { id: 'L-07', name: 'Sheeting 1', type: 'Sheet Extrusion Line', status: 'Active', required: 4, assigned: 'Company Staff', productMode: 'Straight Pipe', shiftsCount: 2, operatingDays: 6 },
  { id: 'L-08', name: 'Duct 2', type: 'PVC Duct Line', status: 'Stopped', required: 4, assigned: 'None', productMode: 'Straight Pipe', shiftsCount: 2, operatingDays: 0 },
  { id: 'L-09', name: 'Sheeting 2', type: 'Sheet Extrusion Line', status: 'Active', required: 4, assigned: 'Agency Staff', productMode: 'Straight Pipe', shiftsCount: 2, operatingDays: 7 },
  { id: 'L-10', name: 'COD', type: 'Corrugated Duct Line', status: 'Active', required: 6, assigned: 'Mixed (Company + Agency)', productMode: 'Coiled Product', shiftsCount: 2, operatingDays: 7 },
  { id: 'L-11', name: 'Tongda', type: 'PVC Pipe Line', status: 'Active', required: 4, assigned: 'Company Staff', productMode: 'Straight Pipe', shiftsCount: 2, operatingDays: 4 },
  { id: 'L-12', name: 'DWC', type: 'Double Wall Corrugated Pipe', status: 'Active', required: 6, assigned: 'Mixed (Company + Agency)', productMode: 'Coiled Product', shiftsCount: 2, operatingDays: 7 }
];
let memoryLogs = [];

async function logAudit(lineId, action, details, savings = 0) {
  const timestamp = new Date().toISOString();
  memoryLogs.unshift({ timestamp, line_id: lineId, action, details, savings_impact: savings });
  if (db) {
    try {
      await db.execute({
        sql: 'INSERT INTO audit_logs (timestamp, line_id, action, details, savings_impact) VALUES (?, ?, ?, ?, ?)',
        args: [timestamp, lineId, action, details, savings]
      });
    } catch (err) {}
  }
}

async function initDb() {
  if (!db) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value INTEGER
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        status TEXT,
        required INTEGER,
        assigned TEXT,
        product_mode TEXT,
        shifts_count INTEGER DEFAULT 2,
        operating_days INTEGER DEFAULT 7,
        sort_order INTEGER
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        line_id TEXT,
        action TEXT,
        details TEXT,
        savings_impact INTEGER DEFAULT 0
      );
    `);

    try { await db.execute('ALTER TABLE machines ADD COLUMN operating_days INTEGER DEFAULT 7'); } catch (e) {}

    const checkSettings = await db.execute('SELECT COUNT(*) as count FROM settings');
    if (checkSettings.rows[0].count === 0) {
      await db.execute({ sql: "INSERT INTO settings VALUES ('companyBaseline', 20)", args: [] });
      await db.execute({ sql: "INSERT INTO settings VALUES ('currentExternal', 35)", args: [] });
      await db.execute({ sql: "INSERT INTO settings VALUES ('dailyCostPerWorker', 150)", args: [] });
    }

    const checkMachines = await db.execute('SELECT COUNT(*) as count FROM machines');
    if (checkMachines.rows[0].count === 0) {
      for (let i = 0; i < memoryMachines.length; i++) {
        const m = memoryMachines[i];
        await db.execute({
          sql: 'INSERT INTO machines (id, name, type, status, required, assigned, product_mode, shifts_count, operating_days, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [m.id, m.name, m.type, m.status, m.required, m.assigned, m.productMode, m.shiftsCount, m.operatingDays, i + 1]
        });
      }
      await logAudit('SYSTEM', 'SYSTEM_INIT', 'PWP Dynamic Workflow Engine Ready', 0);
    }
  } catch (err) {
    console.error('Error initializing DB:', err.message);
  }
}

initDb();

async function readFactoryData() {
  if (db) {
    try {
      const settingsRes = await db.execute('SELECT * FROM settings');
      const settings = {};
      settingsRes.rows.forEach(r => settings[r.key] = Number(r.value));

      const machinesRes = await db.execute('SELECT * FROM machines ORDER BY sort_order ASC');
      const machines = machinesRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        status: r.status,
        required: Number(r.required),
        assigned: r.assigned,
        productMode: r.product_mode || 'Coiled Product',
        shiftsCount: Number(r.shifts_count) || 2,
        operatingDays: r.operating_days !== undefined && r.operating_days !== null ? Number(r.operating_days) : 7
      }));

      if (machines.length > 0) {
        return {
          companyBaseline: settings.companyBaseline !== undefined ? settings.companyBaseline : memorySettings.companyBaseline,
          currentExternal: settings.currentExternal !== undefined ? settings.currentExternal : memorySettings.currentExternal,
          dailyCostPerWorker: settings.dailyCostPerWorker !== undefined ? settings.dailyCostPerWorker : memorySettings.dailyCostPerWorker,
          machines
        };
      }
    } catch (err) {}
  }
  return { ...memorySettings, machines: memoryMachines };
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/dashboard/kpis', async (req, res) => {
  const data = await readFactoryData();
  const activeMachines = data.machines.filter(m => m.status === 'Active' && m.operatingDays > 0).length;
  
  const dailyRequiredHeadcount = data.machines
    .filter(m => m.status === 'Active' && m.operatingDays > 0)
    .reduce((sum, m) => sum + m.required, 0);

  const totalWorkforce = data.companyBaseline + data.currentExternal;
  const variance = totalWorkforce - dailyRequiredHeadcount;
  const wasteCostDaily = variance > 0 ? variance * data.dailyCostPerWorker : 0;

  res.json({
    activeMachines,
    companyBaseline: data.companyBaseline,
    currentExternal: data.currentExternal,
    totalWorkforce,
    requiredHeadcount: dailyRequiredHeadcount,
    dailyCost: data.dailyCostPerWorker,
    variance,
    wasteCostDaily
  });
});

app.get('/api/machines', async (req, res) => {
  const data = await readFactoryData();
  res.json(data.machines);
});

app.get('/api/audit-logs', async (req, res) => {
  if (db) {
    try {
      const logsRes = await db.execute('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50');
      if (logsRes.rows.length > 0) return res.json(logsRes.rows);
    } catch (err) {}
  }
  res.json(memoryLogs);
});

app.post('/api/machines/add', async (req, res) => {
  const { id, name, type, productMode, shiftsCount, assigned, operatingDays } = req.body;
  if (!id || !type) return res.status(400).json({ error: 'ID and Type are required' });

  const shifts = Number(shiftsCount) || 2;
  const basePerShift = productMode === 'Coiled Product' ? 3 : 2;
  const reqWorkers = basePerShift * shifts;
  const days = operatingDays !== undefined ? Number(operatingDays) : 7;
  const status = days === 0 ? 'Stopped' : 'Active';

  const newMachine = {
    id, name: name || type, type, status, required: reqWorkers, assigned: assigned || 'Company Staff', productMode: productMode || 'Coiled Product', shiftsCount: shifts, operatingDays: days
  };
  memoryMachines.push(newMachine);

  if (db) {
    try {
      const maxOrderRes = await db.execute('SELECT MAX(sort_order) as max_order FROM machines');
      const nextOrder = (Number(maxOrderRes.rows[0].max_order) || 0) + 1;
      await db.execute({
        sql: 'INSERT INTO machines (id, name, type, status, required, assigned, product_mode, shifts_count, operating_days, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [id, name || type, type, status, reqWorkers, assigned || 'Company Staff', productMode || 'Coiled Product', shifts, days, nextOrder]
      });
    } catch (err) {}
  }

  await logAudit(id, 'ADD_LINE', `Added machine line: ${name || type} (${days} Days, ${reqWorkers} Workers/Day)`);
  res.json({ message: 'Machine added successfully' });
});

app.post('/api/machines/update', async (req, res) => {
  const { id, newId, name, type, productMode, shiftsCount, assigned, operatingDays } = req.body;
  const shifts = Number(shiftsCount) || 2;
  const basePerShift = productMode === 'Coiled Product' ? 3 : 2;
  const reqWorkers = basePerShift * shifts;
  const days = operatingDays !== undefined ? Number(operatingDays) : 7;
  const status = days === 0 ? 'Stopped' : 'Active';

  const memM = memoryMachines.find(m => m.id === id);
  if (memM) {
    memM.id = newId || id;
    memM.name = name;
    memM.type = type;
    memM.productMode = productMode;
    memM.shiftsCount = shifts;
    memM.required = reqWorkers;
    memM.assigned = assigned;
    memM.operatingDays = days;
    memM.status = status;
  }

  if (db) {
    try {
      await db.execute({
        sql: 'UPDATE machines SET id = ?, name = ?, type = ?, required = ?, assigned = ?, product_mode = ?, shifts_count = ?, operating_days = ?, status = ? WHERE id = ?',
        args: [newId || id, name, type, reqWorkers, assigned, productMode, shifts, days, status, id]
      });
    } catch (err) {}
  }

  await logAudit(newId || id, 'UPDATE_LINE', `Updated line parameters: ${name} (${days} Days, ${reqWorkers} Workers/Day)`);
  res.json({ message: 'Machine updated successfully' });
});

app.post('/api/machines/toggle-mode', async (req, res) => {
  const { id } = req.body;
  const data = await readFactoryData();
  const target = data.machines.find(m => m.id === id);

  if (target) {
    const newMode = target.productMode === 'Coiled Product' ? 'Straight Pipe' : 'Coiled Product';
    const basePerShift = newMode === 'Coiled Product' ? 3 : 2;
    const reqWorkers = basePerShift * target.shiftsCount;

    const memM = memoryMachines.find(m => m.id === id);
    if (memM) {
      memM.productMode = newMode;
      memM.required = reqWorkers;
    }

    if (db) {
      try {
        await db.execute({
          sql: 'UPDATE machines SET product_mode = ?, required = ? WHERE id = ?',
          args: [newMode, reqWorkers, id]
        });
      } catch (err) {}
    }

    await logAudit(target.id, 'SWITCH_MODE', `Quick switched mode to ${newMode} (${reqWorkers} Workers/Day)`);
    res.json({ message: 'Product Mode updated' });
  } else {
    res.status(404).json({ error: 'Machine not found' });
  }
});

app.post('/api/machines/delete', async (req, res) => {
  const { id } = req.body;
  memoryMachines = memoryMachines.filter(m => m.id !== id);

  if (db) {
    try {
      await db.execute({ sql: 'DELETE FROM machines WHERE id = ?', args: [id] });
    } catch (err) {}
  }

  await logAudit(id, 'DELETE_LINE', `Deleted machine line ${id} from system`);
  res.json({ message: 'Machine deleted successfully' });
});

app.post('/api/machines/update-days', async (req, res) => {
  const { id, days } = req.body;
  try {
    const opDays = Number(days) || 0;
    const status = opDays === 0 ? 'Stopped' : 'Active';

    const memM = memoryMachines.find(m => m.id === id);
    if (memM) {
      memM.operatingDays = opDays;
      memM.status = status;
    }

    if (db) {
      try {
        await db.execute({
          sql: 'UPDATE machines SET operating_days = ?, status = ? WHERE id = ?',
          args: [opDays, status, id]
        });
      } catch (err) {}
    }

    await logAudit(id, 'UPDATE_DAYS', `Operating days updated to ${opDays} days (Status: ${status})`);
    res.json({ message: 'Days updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update operating days' });
  }
});

app.post('/api/machines/toggle', async (req, res) => {
  const { id, currentStatus } = req.body;
  try {
    const newStatus = currentStatus === 'Active' ? 'Stopped' : 'Active';
    const newDays = newStatus === 'Stopped' ? 0 : 7;

    const memM = memoryMachines.find(m => m.id === id);
    if (memM) {
      memM.status = newStatus;
      memM.operatingDays = newDays;
    }

    if (db) {
      try {
        await db.execute({
          sql: 'UPDATE machines SET status = ?, operating_days = ? WHERE id = ?',
          args: [newStatus, newDays, id]
        });
      } catch (err) {}
    }

    await logAudit(id, 'TOGGLE_STATUS', `Status switched to ${newStatus}`);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

app.post('/api/settings/update', async (req, res) => {
  const { companyBaseline, currentExternal, dailyCost } = req.body;
  try {
    if (companyBaseline !== undefined) memorySettings.companyBaseline = Number(companyBaseline);
    if (currentExternal !== undefined) memorySettings.currentExternal = Number(currentExternal);
    if (dailyCost !== undefined) memorySettings.dailyCostPerWorker = Number(dailyCost);

    if (db) {
      try {
        if (companyBaseline !== undefined) await db.execute({ sql: 'UPDATE settings SET value = ? WHERE key = ?', args: [Number(companyBaseline), 'companyBaseline'] });
        if (currentExternal !== undefined) await db.execute({ sql: 'UPDATE settings SET value = ? WHERE key = ?', args: [Number(currentExternal), 'currentExternal'] });
        if (dailyCost !== undefined) await db.execute({ sql: 'UPDATE settings SET value = ? WHERE key = ?', args: [Number(dailyCost), 'dailyCostPerWorker'] });
      } catch (err) {}
    }

    await logAudit('SYSTEM', 'UPDATE_SETTINGS', `Updated params: Company ${companyBaseline}, Agency ${currentExternal}, Daily Rate ${dailyCost}`);
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.listen(PORT, () => console.log(`PWP Dynamic Workflow Engine Running on http://localhost:${PORT}`));
