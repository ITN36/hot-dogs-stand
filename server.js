const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'PLACEHOLDER_PASSWORD';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Almacenamiento en memoria
let pedidos = [];
let lastResetDate = new Date().toLocaleDateString();

// Función para reiniciar a medianoche
function checkMidnightReset() {
    const today = new Date().toLocaleDateString();
    if (today !== lastResetDate) {
        console.log("Reinicio automático de medianoche ejecutado.");
        pedidos = [];
        lastResetDate = today;
    }
}

// Revisar cada minuto si ya es otro día
setInterval(checkMidnightReset, 60000);

// --- Endpoints API ---

// Reiniciar el día manualmente
app.delete('/api/pedidos', (req, res) => {
    pedidos = [];
    res.status(204).send();
});

// Obtener todos los pedidos
app.get('/api/pedidos', (req, res) => {
    res.json(pedidos);
});

// Crear un nuevo pedido
app.post('/api/pedidos', (req, res) => {
    const proximoNumero = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1;
    
    const nuevoPedido = {
        id: proximoNumero,
        status: 'proceso',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    pedidos.push(nuevoPedido);
    res.status(201).json(nuevoPedido);
});

// Actualizar estado de un pedido
app.put('/api/pedidos/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const pedido = pedidos.find(p => p.id === parseInt(id));
    if (pedido) {
        pedido.status = status;
        res.json(pedido);
    } else {
        res.status(404).send('Pedido no encontrado');
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
