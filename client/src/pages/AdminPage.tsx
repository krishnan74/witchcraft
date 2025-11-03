import React from 'react';
import { Link } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel.tsx';
import WalletConnect from '../components/WalletConnect';

export default function AdminPage({ controller }: { controller: any }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#d32f2f', fontSize: '28px' }}>🔧 Admin Panel</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Game Manager Tools</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <WalletConnect controller={controller} />
            <Link 
              to="/" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#1976d2', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Game
            </Link>
            <Link 
              to="/dashboard" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#4caf50', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Admin Panel */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <AdminPanel />
        </div>
      </div>
    </div>
  );
}

