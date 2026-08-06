import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ backgroundColor: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
      <h2 style={{ margin: 0, fontSize: '20px', color: '#38bdf8' }}>PlastiLog (MOP-Log)</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          Data Entry
        </Link>
        <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          Trials Dashboard
        </Link>
        <Link to="/formulations" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          Formulations
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
