// ===== SISTEMA DE QUIZZES =====

class Quiz {
    constructor(questions, containerId) {
        this.questions = questions;
        this.containerId = containerId;
        this.currentQuestion = 0;
        this.score = 0;
        this.userAnswers = [];
        this.isCompleted = false;
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = this.generateQuizHTML();
        this.attachEventListeners();
    }

    generateQuizHTML() {
        if (this.isCompleted) {
            return this.generateResultsHTML();
        }

        const question = this.questions[this.currentQuestion];
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;

        return `
            <div class="quiz-header">
                <h3><i class="fas fa-question-circle"></i> Pregunta ${this.currentQuestion + 1} de ${this.questions.length}</h3>
                <div class="progress-bar" style="background: #e9ecef; border-radius: 10px; height: 10px; margin: 1rem 0;">
                    <div class="progress-fill" style="background: var(--primary-color); height: 100%; border-radius: 10px; width: ${progress}%; transition: width 0.3s ease;"></div>
                </div>
            </div>
            
            <div class="quiz-question">
                <h4>${question.question}</h4>
                ${question.code ? `<pre style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #3776AB; margin: 1rem 0;"><code>${question.code}</code></pre>` : ''}
                
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <label class="quiz-option" style="display: block; margin: 0.5rem 0; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">
                            <input type="radio" name="answer" value="${index}" style="margin-right: 0.5rem;">
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="quiz-controls" style="margin-top: 2rem; text-align: center;">
                ${this.currentQuestion > 0 ? '<button onclick="quiz.previousQuestion()" class="quiz-button" style="background: #6c757d; margin-right: 1rem;"><i class="fas fa-arrow-left"></i> Anterior</button>' : ''}
                <button onclick="quiz.nextQuestion()" class="quiz-button" id="next-btn" disabled>
                    ${this.currentQuestion === this.questions.length - 1 ? '<i class="fas fa-check"></i> Finalizar Quiz' : '<i class="fas fa-arrow-right"></i> Siguiente'}
                </button>
            </div>
        `;
    }

    generateResultsHTML() {
        const percentage = Math.round((this.score / this.questions.length) * 100);
        let message, color, icon;

        if (percentage >= 80) {
            message = "¡Excelente! Dominas muy bien los conceptos.";
            color = "#28a745";
            icon = "fas fa-trophy";
        } else if (percentage >= 60) {
            message = "¡Bien hecho! Tienes una buena comprensión.";
            color = "#ffc107";
            icon = "fas fa-medal";
        } else {
            message = "Sigue practicando. Revisa los temas y vuelve a intentarlo.";
            color = "#dc3545";
            icon = "fas fa-redo";
        }

        return `
            <div class="quiz-results" style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; color: ${color}; margin-bottom: 1rem;">
                    <i class="${icon}"></i>
                </div>
                <h3>Quiz Completado</h3>
                <div style="font-size: 2rem; margin: 1rem 0; color: ${color};">
                    ${this.score}/${this.questions.length} (${percentage}%)
                </div>
                <p style="font-size: 1.1rem; color: var(--text-light); margin-bottom: 2rem;">${message}</p>
                
                <div class="quiz-review" style="text-align: left; max-width: 600px; margin: 2rem auto;">
                    <h4>Revisión de Respuestas:</h4>
                    ${this.questions.map((question, index) => {
                        const userAnswer = this.userAnswers[index];
                        const isCorrect = userAnswer === question.correct;
                        return `
                            <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: ${isCorrect ? '#d4edda' : '#f8d7da'};">
                                <strong>Pregunta ${index + 1}:</strong> ${question.question}<br>
                                <span style="color: ${isCorrect ? '#155724' : '#721c24'};">
                                    ${isCorrect ? '✅' : '❌'} Tu respuesta: ${question.options[userAnswer]}
                                </span><br>
                                ${!isCorrect ? `<span style="color: #155724;">✅ Respuesta correcta: ${question.options[question.correct]}</span><br>` : ''}
                                ${question.explanation ? `<small style="color: var(--text-light);"><strong>Explicación:</strong> ${question.explanation}</small>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="margin-top: 2rem;">
                    <button onclick="quiz.restart()" class="quiz-button" style="background: var(--primary-color); margin-right: 1rem;">
                        <i class="fas fa-redo"></i> Reintentar Quiz
                    </button>
                    <button onclick="window.location.href='index.html'" class="quiz-button" style="background: #6c757d;">
                        <i class="fas fa-home"></i> Volver al Curso
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Listener para opciones de respuesta
        const options = document.querySelectorAll('input[name="answer"]');
        options.forEach(option => {
            option.addEventListener('change', () => {
                // Remover estilo de todas las opciones
                document.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.style.borderColor = '#e9ecef';
                    opt.style.background = 'white';
                });
                
                // Aplicar estilo a la opción seleccionada
                const selectedLabel = option.closest('.quiz-option');
                selectedLabel.style.borderColor = 'var(--primary-color)';
                selectedLabel.style.background = '#f8f9fa';
                
                // Habilitar botón siguiente
                document.getElementById('next-btn').disabled = false;
            });
        });
    }

    nextQuestion() {
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (!selectedOption) return;

        const answer = parseInt(selectedOption.value);
        this.userAnswers[this.currentQuestion] = answer;

        if (answer === this.questions[this.currentQuestion].correct) {
            this.score++;
        }

        if (this.currentQuestion === this.questions.length - 1) {
            this.completeQuiz();
        } else {
            this.currentQuestion++;
            this.render();
        }
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.render();
            
            // Restaurar respuesta anterior si existe
            if (this.userAnswers[this.currentQuestion] !== undefined) {
                const previousAnswer = this.userAnswers[this.currentQuestion];
                const option = document.querySelector(`input[name="answer"][value="${previousAnswer}"]`);
                if (option) {
                    option.checked = true;
                    option.dispatchEvent(new Event('change'));
                }
            }
        }
    }

    completeQuiz() {
        this.isCompleted = true;
        this.render();
        
        // Guardar progreso
        if (window.progressTracker) {
            const course = window.location.pathname.includes('/python/') ? 'python' : 
                          window.location.pathname.includes('/c/') ? 'c' : 'html';
            window.progressTracker.markLessonComplete(course, 'quiz');
        }
        
        // Mostrar notificación
        const percentage = Math.round((this.score / this.questions.length) * 100);
        if (typeof showNotification === 'function') {
            showNotification(`Quiz completado: ${this.score}/${this.questions.length} (${percentage}%)`, 
                           percentage >= 60 ? 'success' : 'error');
        }
    }

    restart() {
        this.currentQuestion = 0;
        this.score = 0;
        this.userAnswers = [];
        this.isCompleted = false;
        this.render();
    }
}

// ===== PREGUNTAS PARA DIFERENTES CURSOS =====

const pythonQuestions = [
    {
        question: "¿Cuál es la forma correcta de crear una variable en Python?",
        options: [
            "var nombre = 'Juan'",
            "nombre = 'Juan'",
            "string nombre = 'Juan'",
            "let nombre = 'Juan'"
        ],
        correct: 1,
        explanation: "En Python no necesitas declarar el tipo de variable, simplemente asignas un valor con el operador =."
    },
    {
        question: "¿Qué imprime el siguiente código?",
        code: "x = 5\ny = 2\nprint(x ** y)",
        options: [
            "10",
            "25",
            "7",
            "52"
        ],
        correct: 1,
        explanation: "El operador ** es para potenciación, por lo que 5 ** 2 = 5² = 25."
    },
    {
        question: "¿Cuál es el resultado de: 7 % 3?",
        options: [
            "2.33",
            "1",
            "2",
            "21"
        ],
        correct: 1,
        explanation: "El operador % devuelve el resto de la división. 7 dividido 3 es 2 con resto 1."
    },
    {
        question: "¿Qué tipo de dato es True en Python?",
        options: [
            "string",
            "integer",
            "boolean",
            "float"
        ],
        correct: 2,
        explanation: "True y False son valores booleanos (bool) en Python."
    },
    {
        question: "¿Cuál es la sintaxis correcta para un condicional en Python?",
        options: [
            "if (x > 5) { print('mayor') }",
            "if x > 5: print('mayor')",
            "if x > 5 then print('mayor')",
            "if x > 5 print('mayor')"
        ],
        correct: 1,
        explanation: "Python usa dos puntos (:) después de la condición y no requiere paréntesis ni llaves."
    },
    {
        question: "¿Qué hace el siguiente bucle?",
        code: "for i in range(3):\n    print(i)",
        options: [
            "Imprime 1, 2, 3",
            "Imprime 0, 1, 2",
            "Imprime 3 veces el número 3",
            "Da un error"
        ],
        correct: 1,
        explanation: "range(3) genera los números 0, 1, 2. Python cuenta desde 0."
    },
    {
        question: "¿Cuál es el operador para 'Y lógico' en Python?",
        options: [
            "&&",
            "AND",
            "and",
            "&"
        ],
        correct: 2,
        explanation: "Python usa 'and' (en minúsculas) para el operador lógico Y."
    },
    {
        question: "¿Qué función usas para conocer el tipo de una variable?",
        options: [
            "typeof()",
            "type()",
            "getType()",
            "datatype()"
        ],
        correct: 1,
        explanation: "La función type() devuelve el tipo de dato de una variable en Python."
    },
    {
        question: "¿Cuál es la diferencia entre '=' y '==' en Python?",
        options: [
            "No hay diferencia",
            "= es asignación, == es comparación",
            "= es comparación, == es asignación",
            "Ambos son para asignación"
        ],
        correct: 1,
        explanation: "= se usa para asignar valores a variables, == se usa para comparar si dos valores son iguales."
    },
    {
        question: "¿Qué imprime este código?",
        code: "nombre = 'Python'\nprint('Hola ' + nombre + '!')",
        options: [
            "Hola Python!",
            "Hola + Python + !",
            "HolaPython!",
            "Error"
        ],
        correct: 0,
        explanation: "El operador + concatena (une) strings en Python, resultando en 'Hola Python!'."
    }
];

const cQuestions = [
    {
        question: "¿Cuál es la función principal en un programa de C?",
        options: [
            "start()",
            "begin()",
            "main()",
            "init()"
        ],
        correct: 2,
        explanation: "Todo programa en C debe tener una función main() que es el punto de entrada del programa."
    },
    {
        question: "¿Qué biblioteca necesitas incluir para usar printf()?",
        options: [
            "#include <iostream>",
            "#include <stdio.h>",
            "#include <stdlib.h>",
            "#include <string.h>"
        ],
        correct: 1,
        explanation: "stdio.h (standard input/output) contiene las funciones printf() y scanf()."
    },
    {
        question: "¿Cómo declaras una variable entera en C?",
        options: [
            "integer x;",
            "int x;",
            "var x;",
            "number x;"
        ],
        correct: 1,
        explanation: "En C usas 'int' para declarar variables enteras."
    },
    {
        question: "¿Qué símbolo se usa para comentarios de una línea en C?",
        options: [
            "#",
            "//",
            "/*",
            "--"
        ],
        correct: 1,
        explanation: "// se usa para comentarios de una línea en C (desde C99)."
    },
    {
        question: "¿Cuál es el especificador de formato para enteros en printf()?",
        options: [
            "%s",
            "%d",
            "%f",
            "%c"
        ],
        correct: 1,
        explanation: "%d se usa para imprimir enteros (decimales) en printf()."
    }
];

const htmlQuestions = [
    {
        question: "¿Qué significa HTML?",
        options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Home Tool Markup Language",
            "Hyperlink and Text Markup Language"
        ],
        correct: 0,
        explanation: "HTML significa HyperText Markup Language (Lenguaje de Marcado de Hipertexto)."
    },
    {
        question: "¿Cuál es la estructura básica de un documento HTML?",
        options: [
            "<html><body></body></html>",
            "<!DOCTYPE html><html><head></head><body></body></html>",
            "<document><content></content></document>",
            "<page><header></header><content></content></page>"
        ],
        correct: 1,
        explanation: "Un documento HTML debe tener DOCTYPE, html, head y body como estructura básica."
    },
    {
        question: "¿Qué etiqueta se usa para el título principal de una página?",
        options: [
            "<title>",
            "<h1>",
            "<header>",
            "<main>"
        ],
        correct: 1,
        explanation: "<h1> se usa para el encabezado principal del contenido visible de la página."
    },
    {
        question: "¿Cómo creas un enlace en HTML?",
        options: [
            "<link href='url'>texto</link>",
            "<a href='url'>texto</a>",
            "<url>texto</url>",
            "<href='url'>texto</href>"
        ],
        correct: 1,
        explanation: "La etiqueta <a> con el atributo href se usa para crear enlaces."
    },
    {
        question: "¿Qué atributo se usa para agregar texto alternativo a una imagen?",
        options: [
            "title",
            "alt",
            "description",
            "text"
        ],
        correct: 1,
        explanation: "El atributo 'alt' proporciona texto alternativo para imágenes, importante para accesibilidad."
    }
];

// Función para inicializar quiz según el curso
function initializeQuiz(course, containerId) {
    let questions;
    
    switch(course) {
        case 'python':
            questions = pythonQuestions;
            break;
        case 'c':
            questions = cQuestions;
            break;
        case 'html':
            questions = htmlQuestions;
            break;
        default:
            questions = pythonQuestions;
    }
    
    window.quiz = new Quiz(questions, containerId);
    window.quiz.render();
}

// Exportar para uso global
window.Quiz = Quiz;
window.initializeQuiz = initializeQuiz;