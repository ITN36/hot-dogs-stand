// Lógica del Menú y Pedidos del Cliente (CON BACKEND E INVENTARIO)

async function getPedidos() {
    const response = await fetch('/api/pedidos');
    return await response.json();
}

async function getProductos() {
    const response = await fetch('/api/productos');
    return await response.json();
}

async function renderMenu() {
    const listComida = document.getElementById('list-comida');
    const listBebidas = document.getElementById('list-bebidas');
    if (!listComida || !listBebidas) return;

    try {
        const productos = await getProductos();
        listComida.innerHTML = '';
        listBebidas.innerHTML = '';

        productos.forEach(producto => {
            const li = document.createElement('li');
            li.className = `menu-item ${!producto.disponible ? 'no-disponible' : ''}`;
            
            li.innerHTML = `
                <span class="name">${producto.nombre}</span>
                <span class="price">
                    ${producto.disponible ? `$${producto.precio}` : '<span class="status-badge">No disponible</span>'}
                </span>
            `;

            if (producto.categoria === 'Comida') listComida.appendChild(li);
            else listBebidas.appendChild(li);
        });
    } catch (e) {
        console.error("Error al cargar el menú:", e);
    }
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

        numSpan.innerText = nuevoPedido.id;
        status.style.display = 'block';
        btn.disabled = true;
        btn.innerText = 'Ya estás en fila';

        localStorage.setItem('miTurno', nuevoPedido.id);
    } catch (error) {
        console.error("Error al pedir turno:", error);
        alert("Hubo un problema al conectar con el servidor.");
    }
}

// Inicialización al cargar el Menú
window.onload = async function() {
    await renderMenu();

    const miTurno = localStorage.getItem('miTurno');
    if (miTurno) {
        try {
            const pedidos = await getPedidos();
            const pedidoEncontrado = pedidos.find(p => p.id == miTurno);
            
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
        } catch (e) {
            console.error("Error al cargar pedidos:", e);
        }
    }
};
