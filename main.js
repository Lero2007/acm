const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const https = require('https');

const LICENSE_FILE = path.join(app.getPath('userData'), 'license.dat');
const SERVER_URL = 'https://your-server.com/check_license'; // ضع هنا رابط السيرفر

// 🔒 دالة لتوليد معرف الجهاز بشكل آمن
function getDeviceId() {
  const networkInterfaces = os.networkInterfaces();
  let mac = '';
  for (const iface of Object.values(networkInterfaces)) {
    for (const i of iface) {
      if (!i.internal && i.mac !== '00:00:00:00:00:00') {
        mac = i.mac;
        break;
      }
    }
    if (mac) break;
  }
  return crypto.createHash('sha256').update(mac + os.hostname()).digest('hex');
}

// 🔒 دالة لحفظ الترخيص مشفر
function saveLicense(key) {
  const cipher = crypto.createCipher('aes-256-cbc', getDeviceId());
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  fs.writeFileSync(LICENSE_FILE, encrypted, 'utf8');
}

// 🔒 دالة لقراءة الترخيص
function readLicense() {
  if (!fs.existsSync(LICENSE_FILE)) return null;
  try {
    const encrypted = fs.readFileSync(LICENSE_FILE, 'utf8');
    const decipher = crypto.createDecipher('aes-256-cbc', getDeviceId());
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

// 🔒 التحقق من الترخيص مع السيرفر
function checkLicense(callback) {
  const localKey = readLicense();
  if (localKey) {
    callback(true);
    return;
  }

  const deviceId = getDeviceId();
  const url = `${SERVER_URL}?device=${deviceId}`;

  https.get(url, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      if (data === 'OK') {
        saveLicense('VALID'); // حفظ الترخيص محليًا
        callback(true);
      } else {
        callback(false);
      }
    });
  }).on('error', () => callback(false));
}

// 🔑 إنشاء نافذة التطبيق بعد التحقق من الترخيص
function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

// 🚨 بدء التطبيق مع التحقق من الترخيص
app.whenReady().then(() => {
  checkLicense(valid => {
    if (!valid) {
      dialog.showErrorBox("ترخيص غير صالح", "البرنامج غير مفعل على هذا الجهاز.");
      app.quit();
    } else {
      createWindow();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
