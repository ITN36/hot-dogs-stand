const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'PLACEHOLDER_PASSWORD';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Zona Horaria (Los Cabos BCS - America/Mazatlan)
const TIMEZONE = 'America/Mazatlan';

// Configuración de la base de datos
if (!process.env.DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is not defined. The application will not be able to persist data.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Manejo de errores en el pool
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

// Inicializar tablas si no existen
async function initDb() {
    if (!process.env.DATABASE_URL) return;
    try {
        // Tabla de pedidos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY,
                status VARCHAR(20) NOT NULL,
                timestamp VARCHAR(10) NOT NULL
            )
        `);
        
        // Tabla de productos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                precio INTEGER NOT NULL,
                categoria VARCHAR(50) NOT NULL,
                disponible BOOLEAN NOT NULL DEFAULT TRUE
            )
        `);

        // Verificar si hay productos, si no, insertar iniciales
        const res = await pool.query('SELECT COUNT(*) FROM productos');
        if (parseInt(res.rows[0].count) === 0) {
            const initialProducts = [
                [1, 'Hamburguesa', 95, 'Comida', true],
                [2, 'Hot dog', 35, 'Comida', true],
                [3, 'Quesaburro', 110, 'Comida', true],
                [4, 'Papas', 45, 'Comida', true],
                [5, 'Coca Cola', 25, 'Bebidas', true],
                [6, 'Sprite', 25, 'Bebidas', true],
                [7, 'Pepsi', 25, 'Bebidas', true],
                [8, 'Mirinda', 25, 'Bebidas', true],
                [9, '7up', 25, 'Bebidas', true],
                [10, 'Agua', 20, 'Bebidas', true]
            ];

            for (const p of initialProducts) {
                await pool.query(
                    'INSERT INTO productos (id, nombre, precio, categoria, disponible) VALUES ($1, $2, $3, $4, $5)',
                    p
                );
            }
            console.log("Productos iniciales cargados en la base de datos.");
        }

        console.log("Tablas de la base de datos listas.");
    } catch (err) {
        console.error("Error inicializando la base de datos:", err);
    }
}

initDb();

// Almacenamiento en memoria (solo para control de reinicio)
let lastResetDate = new Date().toLocaleDateString('es-MX', { timeZone: TIMEZONE });

// Función para reiniciar a medianoche
async function checkMidnightReset() {
    const today = new Date().toLocaleDateString('es-MX', { timeZone: TIMEZONE });
    if (today !== lastResetDate) {
        console.log("Reinicio automático de medianoche ejecutado.");
        try {
            await pool.query('TRUNCATE TABLE pedidos');
            // Reiniciar disponibilidad de productos en la DB
            await pool.query('UPDATE productos SET disponible = true');
            lastResetDate = today;
        } catch (err) {
            console.error("Error en reinicio automático:", err);
        }
    }
}

// Revisar cada minuto si ya es otro día
setInterval(checkMidnightReset, 60000);

// --- Endpoints API ---

// Obtener inventario de productos
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener productos');
    }
});

// Actualizar disponibilidad de un producto
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { disponible } = req.body;
    try {
        const result = await pool.query(
            'UPDATE productos SET disponible = $1 WHERE id = $2 RETURNING *',
            [disponible, id]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Producto no encontrado');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar producto');
    }
});

// Reiniciar el día manualmente
app.delete('/api/pedidos', async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE pedidos');
        // Reiniciar disponibilidad de productos en la DB
        await pool.query('UPDATE productos SET disponible = true');
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al reiniciar pedidos');
    }
});

// Obtener todos los pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pedidos ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener pedidos');
    }
});

// Crear un nuevo pedido
app.post('/api/pedidos', async (req, res) => {
    try {
        // Obtener el próximo número de pedido
        const maxResult = await pool.query('SELECT MAX(id) as max_id FROM pedidos');
        const proximoNumero = (maxResult.rows[0].max_id || 0) + 1;
        
        const timestamp = new Date().toLocaleTimeString('es-MX', { 
            timeZone: TIMEZONE,
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const nuevoPedido = {
            id: proximoNumero,
            status: 'proceso',
            timestamp: timestamp
        };
        
        await pool.query(
            'INSERT INTO pedidos (id, status, timestamp) VALUES ($1, $2, $3)',
            [nuevoPedido.id, nuevoPedido.status, nuevoPedido.timestamp]
        );
        
        res.status(201).json(nuevoPedido);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear pedido');
    }
});

// Actualizar estado de un pedido
app.put('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Pedido no encontrado');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar pedido');
    }
});

// Servir la configuración al frontend (para la clave de admin)
app.get('/assets/js/config.js', (req, res) => {
    res.type('application/javascript');
    res.send(`window.CONFIG = { ADMIN_PASSWORD: "${ADMIN_PASSWORD}" };`);
});

// Ruta para admin (opcional, express.static ya lo sirve)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
