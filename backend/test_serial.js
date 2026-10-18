const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

console.log('=== Checking COM3 connection ===');
const port = new SerialPort({ path: 'COM3', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
  console.log('PORT OPENED. Listening for 10 seconds...');
});

port.on('error', err => {
  console.log('PORT ERROR:', err.message);
  process.exit(1);
});

port.on('data', chunk => {
  console.log('RAW DATA CHUNK:', chunk.toString('utf8'));
});

parser.on('data', line => {
  console.log('PARSED LINE:', line.trim());
});

setTimeout(() => {
  console.log('Done listening.');
  port.close();
  process.exit(0);
}, 10000);
