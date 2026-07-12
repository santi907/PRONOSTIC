document.addEventListener('DOMContentLoaded', () => {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const contenedorPartidos = document.getElementById('contenedor-partidos');

    // 1. Cargar datos desde el archivo JSON local
    fetch('./datos/partidos.json?v=2')
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se pudo leer el archivo de predicciones (Status: ${response.status})`);
            }
            return response.json();
        })
        .then(partidos => {
            // Ocultar mensaje de carga
            loadingElement.style.display = 'none';

            if (partidos.length === 0) {
                contenedorPartidos.innerHTML = '<p class="mensaje">No hay predicciones disponibles para hoy.</p>';
                return;
            }

            // Renderizar cada partido en el HTML
            partidos.forEach(partido => {
                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-partido';
                tarjeta.innerHTML = `
                    <div class="equipos">
                        <span>${partido.local}</span>
                        <span class="vs">VS</span>
                        <span>${partido.visitante}</span>
                    </div>
                    <div class="fecha">Fecha: ${partido.fecha}</div>
                    <div class="prediccion">
                        <strong>Predicción:</strong> ${partido.prediccion}
                    </div>
                `;
                contenedorPartidos.appendChild(tarjeta);
            });
        })
        .catch(error => {
            loadingElement.style.display = 'none';
            errorElement.style.display = 'block';
            errorElement.textContent = `Error: ${error.message}`;
            console.error('Error al procesar predicciones:', error);
        });

    // 2. Registrar el Service Worker para hacer la app instalable (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registrado con éxito en el ámbito:', registration.scope);
                })
                .catch(err => {
                    console.error('Fallo al registrar el Service Worker:', err);
                });
        });
    }
});
