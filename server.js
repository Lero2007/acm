// هذا هو server.js الخاص بسيرفر الترخيص
const http = require('http');
const url = require('url');

// الأكواد المسموح بها مع حالة الاستخدام وتاريخ الانتهاء
let allowedLicenses = {
  "ABC123": {used: false, expire: null},
  "XYZ789": {used: false, expire: null},
  "TEST001": {used: false, expire: null}
};

const server = http.createServer((req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const deviceId = queryObject.device;
  const code = queryObject.code;

  if (!deviceId || !code) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    return res.end('INVALID REQUEST');
  }

  const license = allowedLicenses[code];
  const now = Date.now();

  if (!license) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    return res.end('INVALID');
  }

  // تحقق من انتهاء الصلاحية
  if (license.expire && now > license.expire) {
    delete allowedLicenses[code]; // حذف الكود بعد انتهاء الصلاحية
    res.writeHead(200, {'Content-Type': 'text/plain'});
    return res.end('EXPIRED');
  }

  if (!license.used) {
    // أول استخدام للكود
    license.used = true;
    license.expire = now + 30*24*60*60*1000; // صلاحية شهر واحد
    allowedLicenses[code] = license;
    res.writeHead(200, {'Content-Type': 'text/plain'});
    return res.end('OK');
  } else {
    // الكود مستخدم مسبقًا
    res.writeHead(200, {'Content-Type': 'text/plain'});
    return res.end('USED');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`License server running on port ${PORT}`));
