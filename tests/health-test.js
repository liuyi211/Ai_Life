const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应:', data);
  });
});

req.on('error', (error) => {
  console.error('错误:', error.message);
});

req.end();
