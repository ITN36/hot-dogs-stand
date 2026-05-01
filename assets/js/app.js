// Lógica del Menú y Pedidos del Cliente

function getPedidos() {
    return JSON.parse(localStorage.getItem('pedidos')) || [];
}

function savePedidos(pedidos) {
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
}

function hacerFila() {
    const btn = document.getElementById('btn-hacer-fila');
    const status = document.getElementById('queue-status');
    const numSpan = document.getElementById('queue-number');

    let pedidos = getPedidos();

    // El número de fila es el siguiente en la lista o empieza en 1
    const proximoNumero = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1;

    const nuevoPedido = {
        id: proximoNumero,
        status: 'proceso',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    pedidos.push(nuevoPedido);
    savePedidos(pedidos);

    // Actualizar UI Usuario
    numSpan.innerText = proximoNumero;
    status.style.display = 'block';
    btn.disabled = true;
    btn.innerText = 'Ya estás en fila';

    localStorage.setItem('miTurno', proximoNumero);
}

// Inicialización al cargar el Menú
window.onload = function() {
    const miTurno = localStorage.getItem('miTurno');
    if (miTurno) {
        let pedidos = getPedidos();
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
            localStorage.removeItem('miTurno');
        }
    }
};
