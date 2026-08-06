import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running smoothly' });
});

app.get('/api/formulations', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM formulations ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/formulations', async (req, res) => {
  const {
    formula_code,
    pvc_s71,
    calcium_carbonate,
    stabilizer,
    titanium_dioxide,
    pe_wax,
    esbo,
    calcium_stearate,
    total_weight
  } = req.body;

  try {
    await db.execute({
      sql: `INSERT INTO formulations 
            (formula_code, pvc_s71, calcium_carbonate, stabilizer, titanium_dioxide, pe_wax, esbo, calcium_stearate, total_weight)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        formula_code,
        pvc_s71,
        calcium_carbonate,
        stabilizer,
        titanium_dioxide,
        pe_wax,
        esbo,
        calcium_stearate,
        total_weight
      ]
    });
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trials', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM trials ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trials', async (req, res) => {
  const { trial_name, entry_type, section_type, machine_id, product_id, formula_code, notes, parameters } = req.body;

  try {
    const trialResult = await db.execute({
      sql: `INSERT INTO trials (trial_name, entry_type, section_type, machine_id, product_id, formula_code, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [trial_name, entry_type, section_type, machine_id, product_id, formula_code, notes]
    });

    const trialId = trialResult.rows[0].id;

    if (parameters && parameters.length > 0) {
      for (const param of parameters) {
        await db.execute({
          sql: `INSERT INTO trial_values (trial_id, parameter_name, parameter_value, phase)
                VALUES (?, ?, ?, ?)`,
          args: [trialId, param.name, String(param.value), param.phase]
        });
      }
    }

    res.status(201).json({ success: true, trialId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
