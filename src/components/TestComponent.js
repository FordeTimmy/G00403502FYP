
import React, { useEffect, useState } from 'react';

const TestComponent = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch data from the backend
    fetch('/api/test')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
      <h2>Backend Test</h2>
      <p>{message}</p>
    </div>
  );
};

export default TestComponent;
