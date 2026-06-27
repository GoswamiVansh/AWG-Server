const https = require('https');

const req = https.request('https://awg-server.onrender.com/api/health', {
  method: 'GET',
  headers: {
    'Origin': 'https://artwithgarima.in'
  }
}, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', console.error);
req.end();
