import React, { useState, useEffect } from 'react';

const Formulations = () => {
  const [formulations, setFormulations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newFormula, setNewFormula] = useState({
    formulaCode: '',
    pvcS71: 100,
    calciumCarbonate: 0,
    stabilizer: 0,
    titaniumDioxide: 0,
    peWax: 0,
    esbo: 0,
    calciumStearate: 0
  });

  useEffect(() => {
    fetchFormulations();
  }, []);

  const fetchFormulations = async () => {
    try {
      const response = await fetch('/api/formulations');
      if (response.ok) {
        const data = await response.json();
        setFormulations(data);
      }
    } catch (error) {
      console.error('Error fetching formulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFormula({
      ...newFormula,
      [name]: name === 'formulaCode' ? value : parseFloat(value) || 0
    });
  };

  const calculateTotal = (formula) => {
    const { pvcS71, calciumCarbonate, stabilizer, titaniumDioxide, peWax, esbo, calciumStearate } = formula;
    return (pvcS71 + calciumCarbonate + stabilizer + titaniumDioxide + peWax + esbo + calciumStearate).toFixed(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      formula_code: newFormula.formulaCode,
      pvc_s71: newFormula.pvcS71,
      calcium_carbonate: newFormula.calciumCarbonate,
      stabilizer: newFormula.stabilizer,
      titanium_dioxide: newFormula.titaniumDioxide,
      pe_wax: newFormula.peWax,
      esbo: newFormula.esbo,
      calcium_stearate: newFormula.calciumStearate,
      total_weight: calculateTotal(newFormula)
    };

    try {
      const response = await fetch('/api/formulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Formulation saved successfully!');
        setNewFormula({
          formulaCode: '',
          pvcS71: 100,
          calciumCarbonate: 0,
          stabilizer: 0,
          titaniumDioxide: 0,
          peWax: 0,
          esbo: 0,
          calciumStearate: 0
        });
        fetchFormulations();
      } else {
        alert('Failed to save formulation.');
      }
    } catch (error) {
      console.error('Save Error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Formulation Recipe Manager</h2>

      {/* Add New Formulation Form */}
      <fieldset style={{ marginBottom: '30px', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
        <legend><strong>Create New Formula</strong></legend>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>
              <strong>Formula Code: </strong>
              <input
                type="text"
                name="formulaCode"
                placeholder="e.g. KH-120 or TM-555"
                value={newFormula.formulaCode}
                onChange={handleInputChange}
                required
                style={{ padding: '6px', marginLeft: '10px', width: '200px' }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            <label>PVC S71: <input type="number" step="0.01" name="pvcS71" value={newFormula.pvcS71} onChange={handleInputChange} /></label>
            <label>CaCO3: <input type="number" step="0.01" name="calciumCarbonate" value={newFormula.calciumCarbonate} onChange={handleInputChange} /></label>
            <label>Stabilizer: <input type="number" step="0.01" name="stabilizer" value={handleInputChange} onChange={handleInputChange} /></label>
            <label>TiO2: <input type="number" step="0.01" name="titaniumDioxide" value={newFormula.titaniumDioxide} onChange={handleInputChange} /></label>
            <label>PE Wax: <input type="number" step="0.01" name="peWax" value={newFormula.peWax} onChange={handleInputChange} /></label>
            <label>ESBO: <input type="number" step="0.01" name="esbo" value={newFormula.esbo} onChange={handleInputChange} /></label>
            <label>Ca Stearate: <input type="number" step="0.01" name="calciumStearate" value={newFormula.calciumStearate} onChange={handleInputChange} /></label>
          </div>

          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#0070f3', fontSize: '18px' }}>
              <strong>Calculated Total Weight: {calculateTotal(newFormula)} kg</strong>
            </span>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Save Recipe
            </button>
          </div>
        </form>
      </fieldset>

      {/* Existing Recipes List Table */}
      <h3>Saved Formulations Master List</h3>
      {loading ? (
        <p>Loading recipes...</p>
      ) : formulations.length === 0 ? (
        <p>No formulations saved yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#343a40', color: '#fff' }}>
                <th>Formula Code</th>
                <th>PVC S71</th>
                <th>CaCO3</th>
                <th>Stabilizer</th>
                <th>TiO2</th>
                <th>PE Wax</th>
                <th>ESBO</th>
                <th>Ca Stearate</th>
                <th>Total Weight</th>
              </tr>
            </thead>
            <tbody>
              {formulations.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.formula_code}</strong></td>
                  <td>{item.pvc_s71}</td>
                  <td>{item.calcium_carbonate}</td>
                  <td>{item.stabilizer}</td>
                  <td>{item.titanium_dioxide}</td>
                  <td>{item.pe_wax}</td>
                  <td>{item.esbo}</td>
                  <td>{item.calcium_stearate}</td>
                  <td><strong>{item.total_weight} kg</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Formulations;
