// Gestión de autenticación y API calls
class AuthManager {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('coderaiz_token');
        this.user = JSON.parse(localStorage.getItem('coderaiz_user') || 'null');
        this.init();
    }

    init() {
        // Verificar si el token sigue siendo válido al cargar la página
        if (this.token) {
            this.verifyToken();
        }
        
        // Actualizar UI basado en el estado de autenticación
        this.updateUI();
    }

    // Verificar si el token es válido
    async verifyToken() {
        try {
            const response = await this.apiCall('/api/user/profile', 'GET');
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('coderaiz_user', JSON.stringify(this.user));
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            this.logout();
        }
    }

    // Realizar llamadas a la API
    async apiCall(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        return fetch(`${this.baseURL}${endpoint}`, config);
    }

    // Registro de usuario
    async register(formData) {
        try {
            const response = await this.apiCall('/api/auth/register', 'POST', formData);
            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('coderaiz_token', this.token);
                localStorage.setItem('coderaiz_user', JSON.stringify(this.user));
                this.updateUI();
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Login de usuario
    async login(email, password, remember = false) {
        try {
            const response = await this.apiCall('/api/auth/login', 'POST', {
                email,
                password,
                remember
            });
            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('coderaiz_token', this.token);
                localStorage.setItem('coderaiz_user', JSON.stringify(this.user));
                this.updateUI();
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('coderaiz_token');
        localStorage.removeItem('coderaiz_user');
        this.updateUI();
        
        // Redirigir a la página principal si estamos en una página protegida
        if (window.location.pathname.includes('dashboard')) {
            window.location.href = '/';
        }
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return this.token && this.user;
    }

    // Obtener datos del dashboard
    async getDashboardData() {
        try {
            const response = await this.apiCall('/api/user/dashboard', 'GET');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Error obteniendo datos del dashboard');
        } catch (error) {
            console.error('Error en dashboard:', error);
            throw error;
        }
    }

    // Obtener cursos disponibles
    async getCourses() {
        try {
            const response = await this.apiCall('/api/courses', 'GET');
            if (response.ok) {
                const data = await response.json();
                return data.courses;
            }
            throw new Error('Error obteniendo cursos');
        } catch (error) {
            console.error('Error obteniendo cursos:', error);
            throw error;
        }
    }

    // Inscribirse a un curso
    async enrollCourse(courseId) {
        try {
            const response = await this.apiCall(`/api/courses/${courseId}/enroll`, 'POST');
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error en inscripción:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Actualizar UI basado en el estado de autenticación
    updateUI() {
        const authLinks = document.querySelectorAll('.auth-required');
        const guestLinks = document.querySelectorAll('.guest-only');
        const userInfo = document.querySelectorAll('.user-info');

        if (this.isAuthenticated()) {
            // Mostrar elementos para usuarios autenticados
            authLinks.forEach(el => el.style.display = 'block');
            guestLinks.forEach(el => el.style.display = 'none');
            
            // Actualizar información del usuario
            userInfo.forEach(el => {
                el.textContent = this.user.nombre;
            });

            // Actualizar navegación
            this.updateNavigation();
        } else {
            // Mostrar elementos para invitados
            authLinks.forEach(el => el.style.display = 'none');
            guestLinks.forEach(el => el.style.display = 'block');
        }
    }

    // Actualizar navegación para usuarios autenticados
    updateNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && this.isAuthenticated()) {
            // Buscar si ya existe el enlace del dashboard
            const dashboardLink = navMenu.querySelector('a[href="dashboard.html"]');
            if (!dashboardLink) {
                // Crear enlace al dashboard
                const dashboardLi = document.createElement('li');
                dashboardLi.innerHTML = '<a href="dashboard.html" class="nav-link">Mi Dashboard</a>';
                
                // Insertar antes del enlace de contacto
                const contactLi = navMenu.querySelector('a[href*="contacto"]')?.parentElement;
                if (contactLi) {
                    navMenu.insertBefore(dashboardLi, contactLi);
                }
            }

            // Reemplazar enlaces de login/registro con logout
            const loginLink = navMenu.querySelector('a[href="login.html"]');
            const registerLink = navMenu.querySelector('a[href="registro.html"]');
            
            if (loginLink) {
                loginLink.textContent = 'Cerrar Sesión';
                loginLink.href = '#';
                loginLink.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            }
            
            if (registerLink) {
                registerLink.style.display = 'none';
            }
        }
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Estilos inline para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#DC143C' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        // Agregar al DOM
        document.body.appendChild(notification);

        // Cerrar al hacer clic en X
        notification.querySelector('.notification-close').onclick = () => {
            notification.remove();
        };

        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar contraseña
    isValidPassword(password) {
        return password.length >= 6;
    }
}

// Crear instancia global del AuthManager
const authManager = new AuthManager();

// Funciones globales para usar en los formularios
window.authManager = authManager;

// Función para manejar el registro
window.handleRegister = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        nombre: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        fechaNacimiento: formData.get('birthDate'),
        experiencia: formData.get('experience'),
        newsletter: formData.get('newsletter') === 'on'
    };

    // Validaciones del frontend
    if (!data.nombre || !data.email || !data.password) {
        authManager.showNotification('Todos los campos son obligatorios', 'error');
        return;
    }

    if (!authManager.isValidEmail(data.email)) {
        authManager.showNotification('Email inválido', 'error');
        return;
    }

    if (!authManager.isValidPassword(data.password)) {
        authManager.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (data.password !== data.confirmPassword) {
        authManager.showNotification('Las contraseñas no coinciden', 'error');
        return;
    }

    // Realizar registro
    const result = await authManager.register(data);
    
    if (result.success) {
        authManager.showNotification('¡Cuenta creada exitosamente!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        authManager.showNotification(result.error, 'error');
    }
};

// Función para manejar el login
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember') === 'on';

    if (!email || !password) {
        authManager.showNotification('Email y contraseña son obligatorios', 'error');
        return;
    }

    const result = await authManager.login(email, password, remember);
    
    if (result.success) {
        authManager.showNotification('¡Bienvenido de vuelta!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        authManager.showNotification(result.error, 'error');
    }
};

// Función para cerrar sesión
window.handleLogout = function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        authManager.logout();
        authManager.showNotification('Sesión cerrada exitosamente', 'info');
    }
};

// Proteger páginas que requieren autenticación
window.requireAuth = function() {
    if (!authManager.isAuthenticated()) {
        authManager.showNotification('Debes iniciar sesión para acceder a esta página', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    return true;
};

// CSS para las notificaciones
const notificationCSS = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.notification-close:hover {
    opacity: 0.8;
}
`;

// Agregar CSS al documento
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);