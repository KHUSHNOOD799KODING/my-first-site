import { useState, useEffect } from 'react';

function ApiTest() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then(res => res.json())
      .then(data => setStatus(data.message))
      .catch(() => setStatus('API not reachable'));
  }, []);

  return <p>Backend says: {status}</p>;
}

export default ApiTest;