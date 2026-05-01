// Lógica del Panel de Administración (CON BACKEND)

async function getPedidos() {
    const response = await fetch('/api/pedidos');
    return await response.json();
}

async function renderAdmin() {
    const listProceso = document.getElementById('list-proceso');
    const listFinalizado = document.getElementById('list-finalizado');
    const listCancelado = document.getElementById('list-cancelado');

    if (!listProceso || !listFinalizado || !listCancelado) return;

    try {
        const pedidos = await getPedidos();

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
        // Control del botón "Finalizar día"
        const hayEnProceso = pedidos.some(p => p.status === 'proceso');
        const hayPedidos = pedidos.length > 0;
        const btnFinalizar = document.getElementById('btn-finalizar-dia');
        if (btnFinalizar) {
            btnFinalizar.style.display = (!hayEnProceso && hayPedidos) ? 'block' : 'none';
        }
    } catch (e) {
        console.error("Error renderizando admin:", e);
    }
}

async function finalizarDia() {
    if (confirm("¿Estás seguro de que deseas finalizar el día? Se reiniciará el contador a 1.")) {
        try {
            await fetch('/api/pedidos', { method: 'DELETE' });
            renderAdmin();
        } catch (e) {
            console.error("Error al finalizar día:", e);
        }
    }
}

async function cambiarEstado(id, nuevoEstado) {
    try {
        await fetch(`/api/pedidos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nuevoEstado })
        });
        renderAdmin();
    } catch (e) {
        console.error("Error al cambiar estado:", e);
    }
}

// Inicialización al cargar el Dashboard
window.onload = function() {
    // Verificar si ya está autenticado en esta sesión
    if (sessionStorage.getItem('isAdmin') !== 'true') {
        const password = prompt("Por favor, ingresa la contraseña de administrador:");
        
        if (password === window.CONFIG.ADMIN_PASSWORD) {
            sessionStorage.setItem('isAdmin', 'true');
        } else {
            alert("Contraseña incorrecta. Acceso denegado.");
            window.location.href = "index.html";
            return;
        }
    }

    renderAdmin();
    // Actualizar cada 5 segundos para sincronizar con otros dispositivos
    setInterval(renderAdmin, 5000);
};
