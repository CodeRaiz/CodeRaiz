const { contextBridge, ipcRenderer } = require('electron');

// API expuesta al proceso renderizador
contextBridge.exposeInMainWorld('electronAPI', {
    // Información de la aplicación
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

    // Gestión de datos del usuario
    saveUserData: (key, data) => ipcRenderer.invoke('save-user-data', key, data),
    loadUserData: (key) => ipcRenderer.invoke('load-user-data', key),

    // Diálogos del sistema
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

    // Eventos del menú
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-new-project', callback);
        ipcRenderer.on('menu-open-project', callback);
        ipcRenderer.on('menu-settings', callback);
        ipcRenderer.on('navigate-to-course', callback);
        ipcRenderer.on('open-code-editor', callback);
        ipcRenderer.on('open-terminal', callback);
        ipcRenderer.on('open-calculator', callback);
        ipcRenderer.on('export-progress', callback);
        ipcRenderer.on('import-progress', callback);
    },

    // Remover listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

    // Utilidades del sistema
    platform: process.platform,
    versions: process.versions
});

// API para el manejo de archivos locales
contextBridge.exposeInMainWorld('fileAPI', {
    // Leer archivos de la aplicación
    readAppFile: async (filePath) => {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            const fullPath = path.join(__dirname, '..', filePath);
            return await fs.readFile(fullPath, 'utf8');
        } catch (error) {
            throw new Error(`Error leyendo archivo: ${error.message}`);
        }
    },

    // Escribir archivos en el directorio de usuario
    writeUserFile: async (fileName, content) => {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            const { app } = require('electron').remote || require('@electron/remote');
            const userDataPath = app.getPath('userData');
            const fullPath = path.join(userDataPath, fileName);
            await fs.writeFile(fullPath, content, 'utf8');
            return fullPath;
        } catch (error) {
            throw new Error(`Error escribiendo archivo: ${error.message}`);
        }
    },

    // Verificar si un archivo existe
    fileExists: async (filePath) => {
        try {
            const fs = require('fs-extra');
            return await fs.pathExists(filePath);
        } catch (error) {
            return false;
        }
    }
});

// API para el progreso del usuario
contextBridge.exposeInMainWorld('progressAPI', {
    // Guardar progreso
    saveProgress: async (courseId, lessonId, progress) => {
        const key = `progress_${courseId}_${lessonId}`;
        return await ipcRenderer.invoke('save-user-data', key, progress);
    },

    // Cargar progreso
    loadProgress: async (courseId, lessonId) => {
        const key = `progress_${courseId}_${lessonId}`;
        return await ipcRenderer.invoke('load-user-data', key);
    },

    // Guardar configuración del usuario
    saveSettings: async (settings) => {
        return await ipcRenderer.invoke('save-user-data', 'user_settings', settings);
    },

    // Cargar configuración del usuario
    loadSettings: async () => {
        return await ipcRenderer.invoke('load-user-data', 'user_settings');
    },

    // Exportar todo el progreso
    exportAllProgress: async () => {
        return await ipcRenderer.invoke('load-user-data', 'all_progress');
    },

    // Importar progreso
    importProgress: async (progressData) => {
        return await ipcRenderer.invoke('save-user-data', 'all_progress', progressData);
    }
});

// API para notificaciones
contextBridge.exposeInMainWorld('notificationAPI', {
    // Mostrar notificación del sistema
    showNotification: (title, body, icon) => {
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body, icon });
                }
            });
        }
    },

    // Solicitar permisos de notificación
    requestNotificationPermission: async () => {
        return await Notification.requestPermission();
    }
});

// API para el editor de código integrado
contextBridge.exposeInMainWorld('editorAPI', {
    // Ejecutar código Python (simulado)
    executePython: async (code) => {
        // En una implementación real, esto podría usar un intérprete Python embebido
        // Por ahora, simularemos la ejecución
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    output: `Ejecutando código Python:\n${code}\n\n[Simulación] Código ejecutado correctamente.`,
                    error: null
                });
            }, 1000);
        });
    },

    // Ejecutar código C (simulado)
    executeC: async (code) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    output: `Compilando y ejecutando código C:\n${code}\n\n[Simulación] Programa compilado y ejecutado correctamente.`,
                    error: null
                });
            }, 1500);
        });
    },

    // Ejecutar código JavaScript
    executeJavaScript: async (code) => {
        try {
            // Crear un contexto seguro para ejecutar JavaScript
            const result = eval(`(function() { ${code} })()`);
            return {
                success: true,
                output: result !== undefined ? String(result) : 'Código ejecutado correctamente.',
                error: null
            };
        } catch (error) {
            return {
                success: false,
                output: null,
                error: error.message
            };
        }
    },

    // Validar sintaxis HTML
    validateHTML: (html) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const errors = doc.getElementsByTagName('parsererror');
            
            if (errors.length > 0) {
                return {
                    valid: false,
                    errors: Array.from(errors).map(error => error.textContent)
                };
            }
            
            return { valid: true, errors: [] };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message]
            };
        }
    },

    // Validar sintaxis CSS
    validateCSS: (css) => {
        // Validación básica de CSS
        try {
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
            document.head.removeChild(style);
            
            return { valid: true, errors: [] };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message]
            };
        }
    }
});

// API para herramientas adicionales
contextBridge.exposeInMainWorld('toolsAPI', {
    // Calculadora
    calculate: (expression) => {
        try {
            // Sanitizar la expresión para evitar código malicioso
            const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
            const result = eval(sanitized);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Convertidor de unidades
    convertUnits: (value, fromUnit, toUnit) => {
        const conversions = {
            // Longitud
            'mm_cm': 0.1,
            'cm_m': 0.01,
            'm_km': 0.001,
            'in_cm': 2.54,
            'ft_m': 0.3048,
            
            // Peso
            'g_kg': 0.001,
            'kg_lb': 2.20462,
            'lb_kg': 0.453592,
            
            // Temperatura
            'c_f': (c) => (c * 9/5) + 32,
            'f_c': (f) => (f - 32) * 5/9,
            'c_k': (c) => c + 273.15,
            'k_c': (k) => k - 273.15
        };

        const key = `${fromUnit}_${toUnit}`;
        if (conversions[key]) {
            if (typeof conversions[key] === 'function') {
                return conversions[key](value);
            } else {
                return value * conversions[key];
            }
        }
        
        return null;
    },

    // Generador de colores
    generateColorPalette: (baseColor) => {
        // Generar una paleta de colores basada en un color base
        const colors = [];
        const hsl = hexToHsl(baseColor);
        
        for (let i = 0; i < 5; i++) {
            const newHue = (hsl.h + (i * 72)) % 360;
            colors.push(hslToHex(newHue, hsl.s, hsl.l));
        }
        
        return colors;
    }
});

// Funciones auxiliares
function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1/3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1/3);

    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Configurar el tema de la aplicación
    const savedTheme = localStorage.getItem('coderaiz-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Configurar notificaciones de bienvenida
    if (window.notificationAPI) {
        window.notificationAPI.showNotification(
            'CodeRaíz',
            '¡Bienvenido a la plataforma educativa!',
            '../assets/icon.png'
        );
    }
});