// Lógica del Panel de Administración

function getPedidos() {
    return JSON.parse(localStorage.getItem('pedidos')) || [];
}

function savePedidos(pedidos) {
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
}

function renderAdmin() {
    const listProceso = document.getElementById('list-proceso');
    const listFinalizado = document.getElementById('list-finalizado');
    const listCancelado = document.getElementById('list-cancelado');

    if (!listProceso || !listFinalizado || !listCancelado) return;

    let pedidos = getPedidos();

    listProceso.innerHTML = '';
    listFinalizado.innerHTML = '';
    listCancelado.innerHTML = '';

    pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-info">
                <span class="order-num">#${pedido.id}</span>
                <span class="order-time">${pedido.timestamp}</span>
            </div>
            <div class="order-actions">
                ${pedido.status === 'proceso' ? `
                    <button class="btn-action btn-done" onclick="cambiarEstado(${pedido.id}, 'finalizado')">✓</button>
                    <button class="btn-action btn-cancel" onclick="cambiarEstado(${pedido.id}, 'cancelado')">✕</button>
                ` : `
                    <button class="btn-action" onclick="cambiarEstado(${pedido.id}, 'proceso')">↺</button>
                `}
            </div>
        `;

        if (pedido.status === 'proceso') listProceso.appendChild(card);
        else if (pedido.status === 'finalizado') listFinalizado.appendChild(card);
        else if (pedido.status === 'cancelado') listCancelado.appendChild(card);
    });
}

function cambiarEstado(id, nuevoEstado) {
    let pedidos = getPedidos();
    const pedido = pedidos.find(p => p.id === id);
    if (pedido) {
        pedido.status = nuevoEstado;
        savePedidos(pedidos);
        renderAdmin();
    }
}

// Inicialización al cargar el Dashboard
window.onload = function() {
    renderAdmin();
    // Actualizar cada 5 segundos por si hay nuevos pedidos
    setInterval(renderAdmin, 5000);
};
