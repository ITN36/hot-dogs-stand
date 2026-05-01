// Lógica del Menú y Pedidos del Cliente (CON BACKEND)

async function getPedidos() {
    const response = await fetch('/api/pedidos');
    return await response.json();
}

async function hacerFila() {
    const btn = document.getElementById('btn-hacer-fila');
    const status = document.getElementById('queue-status');
    const numSpan = document.getElementById('queue-number');

    try {
        const response = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const nuevoPedido = await response.json();

        // Actualizar UI Usuario
        numSpan.innerText = nuevoPedido.id;
        status.style.display = 'block';
        btn.disabled = true;
        btn.innerText = 'Ya estás en fila';

        // Guardamos solo NUESTRO turno localmente para recordarlo al refrescar
        localStorage.setItem('miTurno', nuevoPedido.id);
    } catch (error) {
        console.error("Error al pedir turno:", error);
        alert("Hubo un problema al conectar con el servidor.");
    }
}

// Inicialización al cargar el Menú
window.onload = async function() {
    const miTurno = localStorage.getItem('miTurno');
    if (miTurno) {
        try {
            const pedidos = await getPedidos();
            const pedidoEncontrado = pedidos.find(p => p.id == miTurno);
            
            // Solo mostrar si el pedido sigue en proceso
            if (pedidoEncontrado && pedidoEncontrado.status === 'proceso') {
                const btn = document.getElementById('btn-hacer-fila');
                const status = document.getElementById('queue-status');
                const numSpan = document.getElementById('queue-number');

                numSpan.innerText = miTurno;
                status.style.display = 'block';
                btn.disabled = true;
                btn.innerText = 'Ya estás en fila';
            } else if (pedidoEncontrado) {
                // Si ya terminó, limpiamos para permitir volver a formarse
                localStorage.removeItem('miTurno');
            }
        } catch (e) {
            console.error("Error al cargar pedidos:", e);
        }
    }
};
