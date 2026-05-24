const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
const isProd = app.isPackaged;
const DEFAULT_PORT = 4000;

function startBackend() {
  const serverPath = isProd 
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js')
    : path.join(__dirname, 'backend', 'server.js');
  
  const env = {
    ...process.env,
    NODE_ENV: isProd ? 'production' : 'development',
    PORT: String(DEFAULT_PORT),
    USER_DATA_PATH: app.getPath('userData'),
    VITE_BACKEND_URL: `http://localhost:${DEFAULT_PORT}`
  };

  serverProcess = spawn('node', [serverPath], { env });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Express stdout] ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Express stderr] ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Express server exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Prescripto Admin - System Management',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the admin panel URL
  mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}/admin`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create customized application menu
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Print Page', accelerator: 'CmdOrCtrl+P', click: () => { mainWindow.webContents.print(); } },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Admin Navigation',
      submenu: [
        { label: 'Dashboard', click: () => { mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}/admin/admin-dashboard`); } },
        { label: 'Appointments', click: () => { mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}/admin/all-appointments`); } },
        { label: 'Doctor List', click: () => { mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}/admin/doctor-list`); } },
        { label: 'Staff List', click: () => { mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}/admin/staff-list`); } },
        { label: 'Vehicle Management', click: () => { mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}/admin/vehicle-management`); } },
        { label: 'Support Tickets', click: () => { mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}/admin/support-management`); } }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://krishsatasiya-prescriptosystem.onrender.com');
          }
        },
        {
          label: 'Privacy Policy',
          click: async () => {
            await shell.openExternal('https://krishsatasiya-prescriptosystem.onrender.com/privacy');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', () => {
  startBackend();
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    console.log('Terminating backend Express server process...');
    serverProcess.kill('SIGINT');
  }
});
