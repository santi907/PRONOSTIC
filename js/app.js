// ==========================================
// CONFIGURACIÓN DE TU NUEVA API (BSD)
// ==========================================

// true = Usa el archivo local partidos.json
// false = Conecta en vivo con la API de BSD
const MODO_DESARROLLO = false; 

// Tu Token de BSD extraído de tu panel
const API_TOKEN = 'be6f00ab1f68e6b755201f1a7cd264a93be3d0cf'; 

// URL de BSD (Revisa la pestaña 'Read docs' en tu panel si necesitas cambiar el endpoint de partidos)
const API_URL = 'https://api.bsd.com/v2/football/fixtures'; // Ajusta esta URL según sus docs si es necesario

// ==========================================
// LÓGICA DE LA APLICACIÓN
// ==========================================
const DOM = {
    loading: () => document.getElementById('loading'),
    error: () => document.getElementById('error'),
    contenedor: () => document.getElementById('contenedor-partidos')
};

function cargarPartidosDisponibles() {
    console.log("Iniciando carga de partidos con BSD Football API...");
    
    if (DOM.loading()) DOM.loading().style.display = 'block';
    if (DOM.error()) DOM.error().style.display = 'none';

    if (MODO_DESARROLLO) {
        console.log("Modo Desarrollo: Cargando datos locales.");
        setTimeout(cargarRespaldoLocal, 500);
        return;
    }

    // Petición con el formato de autorización exacto que te pide BSD
    fetch(API_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error BSD (Status ${response.status})`);
        return response.json();
    })
    .then(data => {
        // Adaptador flexible: BSD suele entregar los datos en 'data' o directamente en el arreglo
        const partidosAPI = data.response || data.data || data;

        if (!partidosAPI || partidosAPI.length === 0) {
            console.warn("No se recibieron partidos de la API hoy. Activando respaldo.");
            cargarRespaldoLocal();
            return;
        }

        // Mapeo de partidos (Ajustado para proteger la app si los nombres de campos varían)
        const partidosTransformados = partidosAPI.slice(0, 10).map((item, index) => {
            const local = item.home_team?.name || item.teams?.home?.name || "Equipo Local";
            const visitante = item.away_team?.name || item.teams?.away?.name || "Equipo Visitante";
            const liga = item.league?.name || "Torneo Internacional";

            let pronostico = `Torneo: ${liga}. Pronóstico: Más de 1.5 goles totales.`;
            if (index % 2 === 0) {
                pronostico = `Torneo: ${liga}. Pronóstico: Gana o empata ${local}.`;
            }

            return {
                local: local,
                visitante: visitante,
                fecha: new Date().toISOString().split('T')[0],
                prediccion: pronostico
            };
        });

        mostrarPartidos(partidosTransformados);
    })
    .catch(error => {
        console.warn('Estructura de API diferente o enlace offline. Usando respaldo local...', error);
        cargarRespaldoLocal();
    });
}

function cargarRespaldoLocal() {
    fetch('./datos/partidos.json?v=' + new Date().getTime()) 
        .then(res => {
            if (!res.ok) throw new Error("No se pudo leer partidos.json");
            return res.json();
        })
        .then(datosLocales => mostrarPartidos(datosLocales))
        .catch(err => {
            console.error(err);
            mostrarErrorEnPantalla("Predicciones en actualización. Intenta más tarde.");
        });
}

function mostrarPartidos(partidos) {
    const contenedor = DOM.contenedor();
    if (DOM.loading()) DOM.loading().style.display = 'none';
    if (DOM.error()) DOM.error().style.display = 'none';

    if (!contenedor) return;
    contenedor.innerHTML = '';

    partidos.forEach(partido => {
        contenedor.innerHTML += `
            <div class="card">
                <div class="partido-header">
                    <span class="equipo-local">${partido.local}</span>
                    <span class="vs">vs</span>
                    <span class="equipo-visitante">${partido.visitante}</span>
                </div>
                <p class="fecha">Fecha: ${partido.fecha}</p>
                <div class="prediccion">
                    <p><strong>Predicción:</strong> ${partido.prediccion}</p>
                </div>
            </div>
        `;
    });
}

function mostrarErrorEnPantalla(mensaje) {
    if (DOM.loading()) DOM.loading().style.display = 'none';
    if (DOM.error()) {
        DOM.error().textContent = mensaje;
        DOM.error().style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', cargarPartidosDisponibles);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}
