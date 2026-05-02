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

// Inicializar tabla si no existe
async function initDb() {
    if (!process.env.DATABASE_URL) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY,
                status VARCHAR(20) NOT NULL,
                timestamp VARCHAR(10) NOT NULL
            )
        `);
        console.log("Tabla 'pedidos' lista o ya existente.");
    } catch (err) {
        console.error("Error inicializando la base de datos:", err);
    }
}

initDb();

// Almacenamiento en memoria (se mantiene solo lastResetDate)
let lastResetDate = new Date().toLocaleDateString('es-MX', { timeZone: TIMEZONE });

let productos = [
    { id: 1, nombre: 'Hamburguesa', precio: 95, categoria: 'Comida', disponible: true },
    { id: 2, nombre: 'Hot dog', precio: 35, categoria: 'Comida', disponible: true },
    { id: 3, nombre: 'Quesaburro', precio: 110, categoria: 'Comida', disponible: true },
    { id: 4, nombre: 'Papas', precio: 45, categoria: 'Comida', disponible: true },
    { id: 5, nombre: 'Coca Cola', precio: 25, categoria: 'Bebidas', disponible: true },
    { id: 6, nombre: 'Sprite', precio: 25, categoria: 'Bebidas', disponible: true },
    { id: 7, nombre: 'Pepsi', precio: 25, categoria: 'Bebidas', disponible: true },
    { id: 8, nombre: 'Mirinda', precio: 25, categoria: 'Bebidas', disponible: true },
    { id: 9, nombre: '7up', precio: 25, categoria: 'Bebidas', disponible: true },
    { id: 10, nombre: 'Agua', precio: 20, categoria: 'Bebidas', disponible: true }
];

// Función para reiniciar a medianoche
async function checkMidnightReset() {
    const today = new Date().toLocaleDateString('es-MX', { timeZone: TIMEZONE });
    if (today !== lastResetDate) {
        console.log("Reinicio automático de medianoche ejecutado.");
        try {
            await pool.query('TRUNCATE TABLE pedidos');
            // Reiniciar disponibilidad de productos
            productos.forEach(p => p.disponible = true);
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
app.get('/api/productos', (req, res) => {
    res.json(productos);
});

// Actualizar disponibilidad de un producto
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { disponible } = req.body;
    const producto = productos.find(p => p.id === parseInt(id));
    if (producto) {
        producto.disponible = disponible;
        res.json(producto);
    } else {
        res.status(404).send('Producto no encontrado');
    }
});

// Reiniciar el día manualmente
app.delete('/api/pedidos', async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE pedidos');
        // Reiniciar disponibilidad de productos
        productos.forEach(p => p.disponible = true);
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
