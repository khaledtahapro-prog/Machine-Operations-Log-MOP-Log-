import React from 'react';

const TrialsDashboard = () => {
  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f172a', fontSize: '24px', marginBottom: '20px' }}>
        Trials Dashboard
      </h1>
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#64748b' }}>لا توجد بيانات معروضة حالياً.</p>
      </div>
    </div>
  );
};

export default TrialsDashboard;