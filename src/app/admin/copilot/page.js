"use client";

import { useState } from 'react';

export default function AIDeveloperPanel() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [useDeepSeek, setUseDeepSeek] = useState(false);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);
    setResponse('Thinking...');
    
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, useDeepSeek }),
      });
      const data = await res.json();
      setResponse(data.text || data.error);
    } catch (err) {
      setResponse('Failed to reach your backend API.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>CultureQuest AI Copilot</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Ask your local models for coding help, database design, or streaming advice.</p>
      
      <textarea 
        rows="5" 
        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' }}
        placeholder="Example: Write a database schema for user profiles and playlists..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
          <input 
            type="checkbox" 
            checked={useDeepSeek} 
            onChange={(e) => setUseDeepSeek(e.target.checked)} 
          />
          Use DeepSeek (Deep Reasoning Mode)
        </label>

        <button 
          onClick={askAI} 
          disabled={loading || !prompt.trim()}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            opacity: (loading || !prompt.trim()) ? 0.6 : 1
          }}
        >
          {loading ? 'Processing...' : 'Ask AI'}
        </button>
      </div>

      <div style={{ marginTop: '25px', background: '#f5f5f5', padding: '20px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
        <strong style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#555' }}>AI Response:</strong>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.5', fontSize: '15px' }}>{response || "Your answer will appear here..."}</p>
      </div>
    </div>
  );
}
