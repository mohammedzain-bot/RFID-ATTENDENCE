const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

console.log('=== Listing all COM ports ===');
SerialPort.list().then(ports => {
  console.log('Available ports:', JSON.stringify(ports, null, 2));
  
  const com3 = ports.find(p => p.path === 'COM3');
  if (!com3) {
    console.log('\nCOM3 NOT FOUND. Arduino may be disconnected.');
    process.exit(0);
  }
  
  console.log('\nCOM3 found:', com3);
  console.log('\n=== Trying to open COM3 at 9600 baud ===');
  
  const port = new SerialPort({ path: 'COM3', baudRate: 9600 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  
  port.on('open', () => {
    console.log('PORT OPENED SUCCESSFULLY. Listening for 15 seconds...');
    console.log('>>> TAP YOUR CARD NOW <<<');
  });
  
  port.on('error', err => {
    console.log('PORT ERROR:', err.message);
    if (err.message.includes('Access denied')) {
      console.log('\n!!! BACKEND SERVER IS HOLDING THE PORT !!!');
      console.log('The backend already has COM3 open.');
    }
    process.exit(1);
  });
  
  parser.on('data', line => {
    console.log('RECEIVED FROM ARDUINO:', line);
  });
  
  setTimeout(() => {
    console.log('\nDone. No data received in 15 seconds.');
    port.close();
    process.exit(0);
  }, 15000);
});
