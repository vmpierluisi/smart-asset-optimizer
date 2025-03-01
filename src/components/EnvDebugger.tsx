
import React from 'react';

export const EnvDebugger: React.FC = () => {
  return (
    <div style={{ padding: '10px', background: '#f0f0f0', margin: '10px', borderRadius: '4px' }}>
      <h3>Environment Variables:</h3>
      <pre>
        VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✓ Present" : "✗ Missing"}
      </pre>
    </div>
  );
};
