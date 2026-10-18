fetch('http://localhost:5000/api/hardware/status')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d.hardware, null, 2)))
  .catch(e => console.log('Error:', e.message));
