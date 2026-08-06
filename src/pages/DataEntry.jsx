import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const DataEntry = () => {
  const [section, setSection] = useState('PIPE');
  const [entryType, setEntryType] = useState('USUAL_WORK');
  const [phase, setPhase] = useState('REGULAR');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const [formData, setFormData] = useState({
    trialName: '',
    machineId: '',
    productCode: '',
    formulaCode: '',
    notes: ''
  });

  const [formulation, setFormulation] = useState({
    pvcS71: 100,
    calciumCarbonate: 3,
    stabilizer: 4,
    titaniumDioxide: 3,
    peWax: 0.2,
    esbo: 0.15,
    calciumStearate: 0.15
  });

  const [parameters, setParameters] = useState({
    productWeight: '',
    cycleTime: '',
    coolingTime: '',
    fillingTime: '',
    shotSize: '',
    feederRpm: '',
    machineAmp: '',
    zone1Temp: '',
    zone2Temp: '',
    zone3Temp: ''
  });

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormulationChange = (e) => {
    setFormulation({ ...formulation, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleParamChange = (e) => {
    setParameters({ ...parameters, [e.target.name]: e.target.value });
  };

  const calculateTotalFormulation = () => {
    return Object.values(formulation).reduce((sum, val) => sum + val, 0).toFixed(3);
  };

  const parseImageText = (text) => {
    const updatedParams = { ...parameters };
    const lines = text.split('\n');

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      
      if (lower.includes('zone 1') || lower.includes('z1')) {
        const match = line.match(/\d+(\.\d+)?/);
        if (match) updatedParams.zone1Temp = match[0];
      }
      if (lower.includes('zone 2') || lower.includes('z2')) {
        const match = line.match(/\d+(\.\d+)?/);
        if (match) updatedParams.zone2Temp = match[0];
      }
      if (lower.includes('zone 3') || lower.includes('z3')) {
        const match = line.match(/\d+(\.\d+)?/);
        if (match) updatedParams.zone3Temp = match[0];
      }
      if (lower.includes('cycle')) {
        const match = line.match(/\d+(\.\d+)?/);
        if (match) updatedParams.cycleTime = match[0];
      }
      if (lower.includes('rpm') || lower.includes('feeder')) {
        const match = line.match(/\d+(\.\d+)?/);
        if (match) updatedParams.feederRpm = match[0];
      }
      if (lower.includes('amp')) {
        const match = line.match(/\d+(\.\d+)?/);
        if (match) updatedParams.machineAmp = match[0];
      }
      if (lower.includes('weight')) {
        const match = line.match(/\d+(\.\d+)?/);
        if (match) updatedParams.productWeight = match[0];
      }
    });

    setParameters(updatedParams);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
          }
        }
      });
      parseImageText(result.data.text);
      alert('Data extracted successfully from image!');
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract data from image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      trial_name: formData.trialName,
      entry_type: entryType,
      section_type: section,
      machine_id: formData.machineId,
      product_id: formData.productCode,
      formula_code: formData.formulaCode,
      notes: formData.notes,
      formulation: formulation,
      parameters: Object.keys(parameters).map((key) => ({
        name: key,
        value: parameters[key],
        phase: entryType === 'USUAL_WORK' ? 'REGULAR' : phase
      }))
    };

    try {
      const response = await fetch('/api/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Data saved successfully!');
      } else {
        alert('Failed to save data.');
      }
    } catch (error) {
      console.error('Submission Error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Machine Operating Conditions & Trial Entry</h2>

      <fieldset style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', border: '2px dashed #0070f3', backgroundColor: '#f0f7ff' }}>
        <legend><strong>Auto-fill from Machine Image (OCR)</strong></legend>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isScanning} />
          {isScanning && <span>Scanning: {scanProgress}%</span>}
        </div>
      </fieldset>

      <form onSubmit={handleSubmit}>
        
        <fieldset style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
          <legend><strong>General Info</strong></legend>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <label>
              Section: 
              <select value={section} onChange={(e) => setSection(e.target.value)} style={{ marginLeft: '10px' }}>
                <option value="PIPE">Pipe</option>
                <option value="FITTING">Fitting</option>
              </select>
            </label>

            <label>
              Entry Type: 
              <select value={entryType} onChange={(e) => setEntryType(e.target.value)} style={{ marginLeft: '10px' }}>
                <option value="USUAL_WORK">Usual Work</option>
                <option value="TRIAL">Trial</option>
              </select>
            </label>

            {entryType === 'TRIAL' && (
              <label>
                Phase: 
                <select value={phase} onChange={(e) => setPhase(e.target.value)} style={{ marginLeft: '10px' }}>
                  <option value="BEFORE_TRIAL">Before Trial</option>
                  <option value="AFTER_TRIAL">After Trial</option>
                </select>
              </label>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input type="text" name="trialName" placeholder="Trial / Run Title" value={formData.trialName} onChange={handleFormChange} required />
            <input type="text" name="machineId" placeholder="Machine ID" value={formData.machineId} onChange={handleFormChange} required />
            <input type="text" name="productCode" placeholder="Product Code" value={formData.productCode} onChange={handleFormChange} required />
            <input type="text" name="formulaCode" placeholder="Formula Code" value={formData.formulaCode} onChange={handleFormChange} />
          </div>
        </fieldset>

        <fieldset style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
          <legend><strong>Formulation (Recipe)</strong></legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <label>PVC S71: <input type="number" step="0.01" name="pvcS71" value={formulation.pvcS71} onChange={handleFormulationChange} /></label>
            <label>Calcium Carbonate: <input type="number" step="0.01" name="calciumCarbonate" value={formulation.calciumCarbonate} onChange={handleFormulationChange} /></label>
            <label>Stabilizer: <input type="number" step="0.01" name="stabilizer" value={formulation.stabilizer} onChange={handleFormulationChange} /></label>
            <label>Titanium Dioxide: <input type="number" step="0.01" name="titaniumDioxide" value={formulation.titaniumDioxide} onChange={handleFormulationChange} /></label>
            <label>PE Wax: <input type="number" step="0.01" name="peWax" value={formulation.peWax} onChange={handleFormulationChange} /></label>
            <label>ESBO: <input type="number" step="0.01" name="esbo" value={formulation.esbo} onChange={handleFormulationChange} /></label>
            <label>Calcium Stearate: <input type="number" step="0.01" name="calciumStearate" value={formulation.calciumStearate} onChange={handleFormulationChange} /></label>
          </div>
          <p style={{ marginTop: '10px', color: '#0070f3' }}><strong>Total Weight: {calculateTotalFormulation()} kg</strong></p>
        </fieldset>

        <fieldset style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
          <legend><strong>Machine Parameters</strong></legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Product Weight (kg): <input type="number" step="0.001" name="productWeight" value={parameters.productWeight} onChange={handleParamChange} /></label>
            <label>Cycle Time (s): <input type="number" name="cycleTime" value={parameters.cycleTime} onChange={handleParamChange} /></label>

            {section === 'FITTING' && (
              <>
                <label>Cooling Time (s): <input type="number" name="coolingTime" value={parameters.coolingTime} onChange={handleParamChange} /></label>
                <label>Filling Time (s): <input type="number" name="fillingTime" value={parameters.fillingTime} onChange={handleParamChange} /></label>
                <label>Shot Size (mm): <input type="number" name="shotSize" value={parameters.shotSize} onChange={handleParamChange} /></label>
              </>
            )}

            {section === 'PIPE' && (
              <>
                <label>Feeder RPM: <input type="number" name="feederRpm" value={parameters.feederRpm} onChange={handleParamChange} /></label>
                <label>Machine Amp: <input type="number" name="machineAmp" value={parameters.machineAmp} onChange={handleParamChange} /></label>
              </>
            )}

            <label>Zone 1 Temp (°C): <input type="number" name="zone1Temp" value={parameters.zone1Temp} onChange={handleParamChange} /></label>
            <label>Zone 2 Temp (°C): <input type="number" name="zone2Temp" value={parameters.zone2Temp} onChange={handleParamChange} /></label>
            <label>Zone 3 Temp (°C): <input type="number" name="zone3Temp" value={parameters.zone3Temp} onChange={handleParamChange} /></label>
          </div>
        </fieldset>

        <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
          Save Entry
        </button>
      </form>
    </div>
  );
};

export default DataEntry;