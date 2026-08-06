import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const ImageScanner = ({ onExtractData }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    Tesseract.recognize(
      file,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      }
    ).then(({ data: { text } }) => {
      setLoading(false);
      if (onExtractData) {
        onExtractData(text);
      }
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <div style={{ border: '2px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '15px' }}>
      <label style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 'bold' }}>
        Upload Machine Screen / Sheet Photo
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      </label>
      {loading && <p style={{ marginTop: '10px', color: '#64748b' }}>Scanning Image... {progress}%</p>}
    </div>
  );
};

export default ImageScanner;