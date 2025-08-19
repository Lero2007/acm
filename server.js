const http = require('http');
const url = require('url');

// هنا ضع أكواد التفعيل الصالحة
// يمكن إضافة أي عدد من الأكواد المسموح بها
const allowedLicenses = [
  "ABC123",
  "XYZ789",
  "TEST001"
];

const allowedDevices = {}; // لتخزين الكود لكل جهاز

const server = http.createServer((req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const deviceId = queryObject.device;
  const code = queryObject.code;

  if (deviceId && code) {
    if (allowedLicenses.includes(code)) {
      allowedDevices[deviceId] = code; // تخزين الكود مع الجهاز
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('OK');
    } else {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('INVALID');
    }
  } else {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end('INVALID REQUEST');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`License server running on port ${PORT}`));
