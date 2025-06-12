// ===== NAVEGACIÓN MÓVIL =====
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle menú móvil
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Cerrar menú al hacer click en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animación de aparición para las tarjetas de cursos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos que necesitan animación
    document.querySelectorAll('.course-card, .feature').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Cambiar estilo de navbar al hacer scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(26, 26, 26, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
            navbar.style.borderBottom = '1px solid rgba(220, 20, 60, 0.3)';
        } else {
            navbar.style.background = 'var(--bg-secondary)';
            navbar.style.backdropFilter = 'blur(10px)';
            navbar.style.borderBottom = '1px solid rgba(220, 20, 60, 0.2)';
        }
    });
});

// ===== SISTEMA DE PROGRESO (localStorage) =====
class ProgressTracker {
    constructor() {
        this.storageKey = 'coderaiz_progress';
        this.progress = this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {
            python: { completed: [], currentLesson: 1 },
            c: { completed: [], currentLesson: 1 },
            html: { completed: [], currentLesson: 1 }
        };
    }

    saveProgress() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    }

    markLessonComplete(course, lessonId) {
        if (!this.progress[course].completed.includes(lessonId)) {
            this.progress[course].completed.push(lessonId);
            this.saveProgress();
        }
    }

    isLessonComplete(course, lessonId) {
        return this.progress[course].completed.includes(lessonId);
    }

    getProgress(course) {
        return this.progress[course];
    }

    updateCurrentLesson(course, lessonNumber) {
        this.progress[course].currentLesson = lessonNumber;
        this.saveProgress();
    }
}

// Instancia global del tracker de progreso
window.progressTracker = new ProgressTracker();

// ===== UTILIDADES GENERALES =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===== FUNCIONES PARA CURSOS =====
function initializeCourseNavigation() {
    const courseNavLinks = document.querySelectorAll('.course-nav a');
    
    courseNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remover clase active de todos los enlaces
            courseNavLinks.forEach(l => l.classList.remove('active'));
            // Agregar clase active al enlace clickeado
            this.classList.add('active');
        });
    });
}

// Función para resaltar sintaxis básica (sin librerías externas)
function highlightCode(code, language) {
    // Implementación básica de resaltado de sintaxis
    const keywords = {
        python: ['def', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'class', 'return', 'print', 'input', 'len', 'range', 'in', 'and', 'or', 'not', 'True', 'False', 'None'],
        c: ['#include', 'int', 'float', 'char', 'void', 'if', 'else', 'for', 'while', 'return', 'printf', 'scanf', 'main', 'struct', 'typedef'],
        html: ['html', 'head', 'body', 'div', 'p', 'h1', 'h2', 'h3', 'a', 'img', 'ul', 'li', 'span', 'strong', 'em']
    };
    
    if (keywords[language]) {
        keywords[language].forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            code = code.replace(regex, `<span style="color: #0066cc; font-weight: bold;">${keyword}</span>`);
        });
    }
    
    return code;
}

// Inicializar funciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCourseNavigation();
});