const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const net = require('net');

let mainWindow;
let wsServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'HyperDeck Controller'
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  initializeWebSocketServer();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (wsServer) wsServer.close();
  app.quit();
});

function initializeWebSocketServer() {
  try {
    wsServer = new WebSocket.Server({ port: 8888 });
    
    wsServer.on('connection', (ws) => {
      console.log('External client connected');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (mainWindow) {
            mainWindow.webContents.send('external-command', data);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      });
    });
    
    console.log('WebSocket server started on port 8888');
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
  }
}

ipcMain.handle('hyperdeck-command', async (event, { ip, command }) => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host: ip, port: 9993 }, () => {
      client.write(command + '\r\n');
    });
    
    let response = '';
    
    client.on('data', (data) => {
      response += data.toString();
      if (response.includes('\r\n\r\n')) {
        client.end();
        resolve(response);
      }
    });
    
    client.on('error', (error) => {
      reject(error);
    });
    
    client.setTimeout(5000, () => {
      client.end();
      reject(new Error('Connection timeout'));
    });
  });
});
