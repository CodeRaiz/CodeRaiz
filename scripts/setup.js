const { testConnection, query } = require('../config/database');

async function setupDatabase() {
    console.log('🚀 Iniciando configuración de CodeRaíz...\n');

    try {
        // Probar conexión
        console.log('📡 Probando conexión a la base de datos...');
        const connected = await testConnection();
        
        if (!connected) {
            console.error('❌ No se pudo conectar a la base de datos');
            console.error('Verifica las credenciales en el archivo .env');
            process.exit(1);
        }

        console.log('✅ Conexión exitosa a PostgreSQL (Supabase)\n');

        // Crear extensiones necesarias
        console.log('🔧 Configurando extensiones...');
        try {
            await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            console.log('✅ Extensión uuid-ossp configurada');
        } catch (error) {
            console.log('⚠️  Extensión uuid-ossp no disponible (opcional)');
        }

        // Crear tablas
        console.log('\n📋 Creando tablas...');

        // Tabla usuarios
        await query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                fecha_nacimiento DATE,
                nivel_experiencia VARCHAR(20) DEFAULT 'beginner',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ultimo_acceso TIMESTAMP,
                activo BOOLEAN DEFAULT true,
                avatar_url VARCHAR(500),
                biografia TEXT,
                CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
                CONSTRAINT valid_nivel CHECK (nivel_experiencia IN ('beginner', 'intermediate', 'advanced'))
            )
        `);
        console.log('✅ Tabla usuarios creada');

        // Tabla cursos
        await query(`
            CREATE TABLE IF NOT EXISTS cursos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                nivel VARCHAR(20) DEFAULT 'beginner',
                duracion_estimada INTEGER CHECK (duracion_estimada > 0),
                icono VARCHAR(50),
                color VARCHAR(20),
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT valid_nivel_curso CHECK (nivel IN ('beginner', 'intermediate', 'advanced'))
            )
        `);
        console.log('✅ Tabla cursos creada');

        // Tabla inscripciones
        await query(`
            CREATE TABLE IF NOT EXISTS inscripciones (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
                fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                progreso DECIMAL(5,2) DEFAULT 0.00 CHECK (progreso >= 0 AND progreso <= 100),
                completado BOOLEAN DEFAULT false,
                fecha_completado TIMESTAMP,
                UNIQUE(usuario_id, curso_id)
            )
        `);
        console.log('✅ Tabla inscripciones creada');

        // Tabla lecciones
        await query(`
            CREATE TABLE IF NOT EXISTS lecciones (
                id SERIAL PRIMARY KEY,
                curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
                titulo VARCHAR(200) NOT NULL,
                contenido TEXT,
                orden INTEGER NOT NULL CHECK (orden > 0),
                tipo VARCHAR(50) DEFAULT 'lectura',
                duracion INTEGER CHECK (duracion >= 0),
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT valid_tipo CHECK (tipo IN ('lectura', 'video', 'ejercicio', 'quiz', 'proyecto'))
            )
        `);
        console.log('✅ Tabla lecciones creada');

        // Tabla progreso_lecciones
        await query(`
            CREATE TABLE IF NOT EXISTS progreso_lecciones (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                leccion_id INTEGER REFERENCES lecciones(id) ON DELETE CASCADE,
                completado BOOLEAN DEFAULT false,
                fecha_completado TIMESTAMP,
                tiempo_dedicado INTEGER DEFAULT 0 CHECK (tiempo_dedicado >= 0),
                puntuacion DECIMAL(3,1) CHECK (puntuacion >= 0 AND puntuacion <= 10),
                UNIQUE(usuario_id, leccion_id)
            )
        `);
        console.log('✅ Tabla progreso_lecciones creada');

        // Tabla logros
        await query(`
            CREATE TABLE IF NOT EXISTS logros (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                icono VARCHAR(50),
                condicion TEXT,
                puntos INTEGER DEFAULT 0 CHECK (puntos >= 0),
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla logros creada');

        // Tabla usuario_logros
        await query(`
            CREATE TABLE IF NOT EXISTS usuario_logros (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                logro_id INTEGER REFERENCES logros(id) ON DELETE CASCADE,
                fecha_obtenido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(usuario_id, logro_id)
            )
        `);
        console.log('✅ Tabla usuario_logros creada');

        // Crear índices para mejor rendimiento
        console.log('\n🔍 Creando índices...');
        
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
            'CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo)',
            'CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario ON inscripciones(usuario_id)',
            'CREATE INDEX IF NOT EXISTS idx_inscripciones_curso ON inscripciones(curso_id)',
            'CREATE INDEX IF NOT EXISTS idx_lecciones_curso ON lecciones(curso_id, orden)',
            'CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso_lecciones(usuario_id)',
            'CREATE INDEX IF NOT EXISTS idx_usuario_logros_usuario ON usuario_logros(usuario_id)'
        ];

        for (const index of indices) {
            await query(index);
        }
        console.log('✅ Índices creados');

        // Insertar datos iniciales
        console.log('\n📚 Insertando cursos iniciales...');

        const cursosIniciales = [
            {
                nombre: 'Python',
                descripcion: 'Aprende Python desde cero hasta nivel intermedio. Ideal para principiantes en programación.',
                nivel: 'beginner',
                duracion: 40,
                icono: 'fab fa-python',
                color: '#FF4757'
            },
            {
                nombre: 'JavaScript',
                descripcion: 'Domina el lenguaje de la web. Crea páginas interactivas y aplicaciones dinámicas.',
                nivel: 'beginner',
                duracion: 35,
                icono: 'fab fa-js-square',
                color: '#FFD700'
            },
            {
                nombre: 'HTML',
                descripcion: 'Aprende la estructura fundamental de las páginas web con HTML5.',
                nivel: 'beginner',
                duracion: 20,
                icono: 'fab fa-html5',
                color: '#FF6348'
            },
            {
                nombre: 'CSS',
                descripcion: 'Dale estilo a tus páginas web. Aprende diseño responsivo y animaciones modernas.',
                nivel: 'beginner',
                duracion: 30,
                icono: 'fab fa-css3-alt',
                color: '#FF4081'
            },
            {
                nombre: 'Java',
                descripcion: 'Programación orientada a objetos con uno de los lenguajes más utilizados en la industria.',
                nivel: 'intermediate',
                duracion: 50,
                icono: 'fab fa-java',
                color: '#FF5722'
            },
            {
                nombre: 'React',
                descripcion: 'Construye interfaces de usuario modernas e interactivas con React.',
                nivel: 'intermediate',
                duracion: 45,
                icono: 'fab fa-react',
                color: '#FF69B4'
            },
            {
                nombre: 'Node.js',
                descripcion: 'JavaScript en el servidor. Desarrolla aplicaciones backend potentes.',
                nivel: 'intermediate',
                duracion: 40,
                icono: 'fab fa-node-js',
                color: '#32CD32'
            },
            {
                nombre: 'C',
                descripcion: 'Domina los fundamentos de la programación con el lenguaje C.',
                nivel: 'beginner',
                duracion: 35,
                icono: 'fas fa-code',
                color: '#FF3838'
            },
            {
                nombre: 'Bases de Datos',
                descripcion: 'Aprende SQL y gestión de bases de datos relacionales y NoSQL.',
                nivel: 'intermediate',
                duracion: 30,
                icono: 'fas fa-database',
                color: '#FF1493'
            }
        ];

        for (const curso of cursosIniciales) {
            try {
                await query(`
                    INSERT INTO cursos (nombre, descripcion, nivel, duracion_estimada, icono, color)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (nombre) DO UPDATE SET
                        descripcion = EXCLUDED.descripcion,
                        nivel = EXCLUDED.nivel,
                        duracion_estimada = EXCLUDED.duracion_estimada,
                        icono = EXCLUDED.icono,
                        color = EXCLUDED.color
                `, [curso.nombre, curso.descripcion, curso.nivel, curso.duracion, curso.icono, curso.color]);
                console.log(`✅ Curso "${curso.nombre}" insertado/actualizado`);
            } catch (error) {
                console.log(`⚠️  Error insertando curso "${curso.nombre}":`, error.message);
            }
        }

        // Insertar logros iniciales
        console.log('\n🏆 Insertando logros iniciales...');

        const logrosIniciales = [
            {
                nombre: 'Primer Paso',
                descripcion: 'Completaste tu primer curso',
                icono: 'fas fa-medal',
                condicion: '{"cursos_completados": 1}',
                puntos: 100
            },
            {
                nombre: 'Racha de Fuego',
                descripcion: 'Estudiaste 7 días seguidos',
                icono: 'fas fa-fire',
                condicion: '{"dias_consecutivos": 7}',
                puntos: 200
            },
            {
                nombre: 'Explorador',
                descripcion: 'Te inscribiste en 5 cursos diferentes',
                icono: 'fas fa-compass',
                condicion: '{"cursos_inscritos": 5}',
                puntos: 150
            },
            {
                nombre: 'Dedicado',
                descripcion: 'Acumulaste 50 horas de estudio',
                icono: 'fas fa-clock',
                condicion: '{"horas_estudio": 50}',
                puntos: 300
            },
            {
                nombre: 'Experto en Python',
                descripcion: 'Completaste todos los módulos de Python',
                icono: 'fab fa-python',
                condicion: '{"curso_completo": "Python"}',
                puntos: 250
            },
            {
                nombre: 'Maestro JavaScript',
                descripcion: 'Dominaste JavaScript completamente',
                icono: 'fab fa-js-square',
                condicion: '{"curso_completo": "JavaScript"}',
                puntos: 250
            },
            {
                nombre: 'Graduado',
                descripcion: 'Obtuviste 10 certificados',
                icono: 'fas fa-graduation-cap',
                condicion: '{"certificados": 10}',
                puntos: 500
            },
            {
                nombre: 'Perfeccionista',
                descripcion: 'Obtuviste calificación perfecta en 5 quizzes',
                icono: 'fas fa-star',
                condicion: '{"quizzes_perfectos": 5}',
                puntos: 200
            }
        ];

        for (const logro of logrosIniciales) {
            try {
                await query(`
                    INSERT INTO logros (nombre, descripcion, icono, condicion, puntos)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (nombre) DO UPDATE SET
                        descripcion = EXCLUDED.descripcion,
                        icono = EXCLUDED.icono,
                        condicion = EXCLUDED.condicion,
                        puntos = EXCLUDED.puntos
                `, [logro.nombre, logro.descripcion, logro.icono, logro.condicion, logro.puntos]);
                console.log(`✅ Logro "${logro.nombre}" insertado/actualizado`);
            } catch (error) {
                console.log(`⚠️  Error insertando logro "${logro.nombre}":`, error.message);
            }
        }

        // Verificar datos
        console.log('\n📊 Verificando datos insertados...');
        
        const cursosCount = await query('SELECT COUNT(*) FROM cursos WHERE activo = true');
        const logrosCount = await query('SELECT COUNT(*) FROM logros WHERE activo = true');
        
        console.log(`✅ ${cursosCount.rows[0].count} cursos activos`);
        console.log(`✅ ${logrosCount.rows[0].count} logros disponibles`);

        console.log('\n🎉 ¡Configuración completada exitosamente!');
        console.log('\n📋 Resumen:');
        console.log('   • Base de datos: PostgreSQL (Supabase)');
        console.log('   • Tablas creadas: 7');
        console.log('   • Índices creados: 7');
        console.log(`   • Cursos disponibles: ${cursosCount.rows[0].count}`);
        console.log(`   • Logros disponibles: ${logrosCount.rows[0].count}`);
        console.log('\n🚀 Puedes ejecutar "npm run dev" para iniciar el servidor');

    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message);
        console.error('\nDetalles del error:', error);
        process.exit(1);
    }
}

// Ejecutar configuración
setupDatabase();