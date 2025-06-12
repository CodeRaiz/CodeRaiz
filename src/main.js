const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

// Configuración de la tienda de datos local
const store = new Store();

// Variables globales
let mainWindow;
let isDev = process.argv.includes('--dev');

// Configuración de la aplicación
const APP_CONFIG = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'CodeRaíz - Plataforma Educativa'
};

// Función para crear la ventana principal
function createMainWindow() {
    // Configuración de la ventana
    const windowOptions = {
        width: store.get('windowBounds.width', APP_CONFIG.width),
        height: store.get('windowBounds.height', APP_CONFIG.height),
        minWidth: APP_CONFIG.minWidth,
        minHeight: APP_CONFIG.minHeight,
        title: APP_CONFIG.title,
        icon: path.join(__dirname, '../assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        show: false, // No mostrar hasta que esté listo
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    };

    // Crear la ventana
    mainWindow = new BrowserWindow(windowOptions);

    // Cargar la página principal
    const startUrl = path.join(__dirname, '../dashboard.html');
    mainWindow.loadFile(startUrl);

    // Mostrar la ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Enfocar la ventana
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    // Guardar el tamaño de la ventana cuando se cierre
    mainWindow.on('close', () => {
        const bounds = mainWindow.getBounds();
        store.set('windowBounds', bounds);
    });

    // Manejar enlaces externos
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevenir navegación a sitios externos
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'file://') {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    return mainWindow;
}

// Función para crear el menú de la aplicación
function createMenu() {
    const template = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Nuevo Proyecto',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-project');
                    }
                },
                {
                    label: 'Abrir Proyecto',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openDirectory'],
                            title: 'Seleccionar carpeta del proyecto'
                        });
                        
                        if (!result.canceled) {
                            mainWindow.webContents.send('menu-open-project', result.filePaths[0]);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Configuración',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        mainWindow.webContents.send('menu-settings');
                    }
                },
                { type: 'separator' },
                {
                    label: process.platform === 'darwin' ? 'Salir de CodeRaíz' : 'Salir',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Editar',
            submenu: [
                { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'Rehacer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Pegar', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: 'Seleccionar Todo', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                { label: 'Recargar', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: 'Forzar Recarga', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: 'Herramientas de Desarrollador', accelerator: 'F12', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: 'Zoom Real', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { label: 'Acercar', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: 'Alejar', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { type: 'separator' },
                { label: 'Pantalla Completa', accelerator: 'F11', role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Cursos',
            submenu: [
                {
                    label: 'Python',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'python');
                    }
                },
                {
                    label: 'C',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'c');
                    }
                },
                {
                    label: 'HTML',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'html');
                    }
                },
                {
                    label: 'CSS',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'css');
                    }
                },
                {
                    label: 'JavaScript',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'javascript');
                    }
                },
                {
                    label: 'Java',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'java');
                    }
                },
                {
                    label: 'React',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'react');
                    }
                },
                {
                    label: 'Node.js',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'nodejs');
                    }
                },
                {
                    label: 'Base de Datos',
                    click: () => {
                        mainWindow.webContents.send('navigate-to-course', 'database');
                    }
                }
            ]
        },
        {
            label: 'Herramientas',
            submenu: [
                {
                    label: 'Editor de Código',
                    click: () => {
                        mainWindow.webContents.send('open-code-editor');
                    }
                },
                {
                    label: 'Terminal',
                    click: () => {
                        mainWindow.webContents.send('open-terminal');
                    }
                },
                {
                    label: 'Calculadora',
                    click: () => {
                        mainWindow.webContents.send('open-calculator');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exportar Progreso',
                    click: async () => {
                        const result = await dialog.showSaveDialog(mainWindow, {
                            title: 'Exportar progreso',
                            defaultPath: 'progreso-coderaiz.json',
                            filters: [
                                { name: 'JSON', extensions: ['json'] }
                            ]
                        });
                        
                        if (!result.canceled) {
                            mainWindow.webContents.send('export-progress', result.filePath);
                        }
                    }
                },
                {
                    label: 'Importar Progreso',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            title: 'Importar progreso',
                            filters: [
                                { name: 'JSON', extensions: ['json'] }
                            ],
                            properties: ['openFile']
                        });
                        
                        if (!result.canceled) {
                            mainWindow.webContents.send('import-progress', result.filePaths[0]);
                        }
                    }
                }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Documentación',
                    click: () => {
                        shell.openExternal('https://coderaiz.com/docs');
                    }
                },
                {
                    label: 'Reportar Problema',
                    click: () => {
                        shell.openExternal('https://github.com/coderaiz/plataforma-educativa/issues');
                    }
                },
                {
                    label: 'Comunidad',
                    click: () => {
                        shell.openExternal('https://discord.gg/coderaiz');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Buscar Actualizaciones',
                    click: () => {
                        autoUpdater.checkForUpdatesAndNotify();
                    }
                },
                {
                    label: 'Acerca de CodeRaíz',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Acerca de CodeRaíz',
                            message: 'CodeRaíz - Plataforma Educativa',
                            detail: `Versión: ${app.getVersion()}\nPlataforma educativa para aprender programación desde cero.\n\n© 2024 CodeRaíz Team`
                        });
                    }
                }
            ]
        }
    ];

    // Ajustes específicos para macOS
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { label: 'Acerca de ' + app.getName(), role: 'about' },
                { type: 'separator' },
                { label: 'Servicios', role: 'services', submenu: [] },
                { type: 'separator' },
                { label: 'Ocultar ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
                { label: 'Ocultar Otros', accelerator: 'Command+Shift+H', role: 'hideothers' },
                { label: 'Mostrar Todo', role: 'unhide' },
                { type: 'separator' },
                { label: 'Salir', accelerator: 'Command+Q', click: () => app.quit() }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Manejadores de IPC (comunicación entre procesos)
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
});

ipcMain.handle('save-user-data', async (event, key, data) => {
    try {
        store.set(key, data);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-user-data', async (event, key) => {
    try {
        const data = store.get(key);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

// Eventos de la aplicación
app.whenReady().then(() => {
    createMainWindow();
    createMenu();

    // Configurar actualizaciones automáticas
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Configuración de actualizaciones
autoUpdater.on('checking-for-update', () => {
    console.log('Buscando actualizaciones...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Actualización disponible.');
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización disponible',
        message: 'Una nueva versión está disponible. Se descargará en segundo plano.',
        buttons: ['OK']
    });
});

autoUpdater.on('update-not-available', (info) => {
    console.log('Actualización no disponible.');
});

autoUpdater.on('error', (err) => {
    console.log('Error en auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Velocidad de descarga: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Descargado ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Actualización descargada');
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización lista',
        message: 'La actualización ha sido descargada. Se instalará al reiniciar la aplicación.',
        buttons: ['Reiniciar ahora', 'Más tarde']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

// Prevenir múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Alguien intentó ejecutar una segunda instancia, enfocar nuestra ventana
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}