// ==========================================
// CONFIGURACIÓN DE TU API Y MODO DE PRUEBAS
// ==========================================

// true = Usa el archivo local (no gasta tus peticiones de la API)
// false = Conecta en vivo con la API usando tu clave real
const MODO_DESARROLLO = false; 

// Tu nueva clave de acceso configurada
const API_KEY = 'be6f00ab1f68e6b755201f1a7cd264a93be3d0cf'; 

// ==========================================
// LÓGICA DE LA APLICACIÓN
// ==========================================
const hoy = new Date().toISOString().split('T')[0];
const API_URL = `https://v3.football.api-sports.io/fixtures?date=${hoy}`;

const DOM = {
    loading: () => document.getElementById('loading'),
    error: () => document.getElementById('error'),
    contenedor: () => document.getElementById('contenedor-partidos')
};

function cargarPartidosDisponibles() {
    console.log("Iniciando carga de partidos con la nueva clave...");
    
    if (DOM.loading()) DOM.loading().style.display = 'block';
    if (DOM.error()) DOM.error().style.display = 'none';

    // Si estás diseñando y activas el modo desarrollo, va directo al JSON local
    if (MODO_DESARROLLO) {
        console.log("Modo Desarrollo Activo: Cargando datos locales.");
        setTimeout(cargarRespaldoLocal, 500);
        return;
    }

    // Petición directa y limpia a los servidores de fútbol
    fetch(API_URL, {
        method: 'GET',
        headers: {
            'x-apisports-key': API_KEY,
            'x-rapidapi-key': API_KEY
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error de red (Status ${response.status})`);
        return response.json();
    })
    .then(data => {
        // Si la API rechaza la clave o dice que no es válida
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(JSON.stringify(data.errors));
        }

        const partidosAPI = data.response;

        if (!partidosAPI || partidosAPI.length === 0) {
            console.warn("No hay partidos en vivo para hoy en esta API. Usando respaldo.");
            cargarRespaldoLocal();
            return;
        }

        // Procesamos y estructuramos los partidos del servidor
        const partidosTransformados = partidosAPI.slice(0, 10).map((item, index) => {
            const equipoLocal = item.teams.home.name;
            const equipoVisitante = item.teams.away.name;
            const nombreLiga = item.league.name;

            let pronostico = `Torneo: ${nombreLiga}. Pronóstico: Más de 1.5 goles totales.`;
            if (index % 2 === 0) {
                pronostico = `Torneo: ${nombreLiga}. Pronóstico: Gana o empata ${equipoLocal}.`;
            }

            return {
                local: equipoLocal,
                visitante: equipoVisitante,
                fecha: item.fixture.date.split('T')[0],
                prediccion: pronostico
            };
        });

        mostrarPartidos(partidosTransformados);
    })
    .catch(error => {
        console.warn('La API no pudo procesar la clave actual. Entrando en modo respaldo...', error);
        cargarRespaldoLocal();
    });
}

function cargarRespaldoLocal() {
    // El truco del timestamp (?v=...) rompe el caché del navegador para mostrar datos frescos
    fetch('./datos/partidos.json?v=' + new Date().getTime()) 
        .then(res => {
            if (!res.ok) throw new Error("No se pudo leer partidos.json");
            return res.json();
        })
        .then(datosLocales => mostrarPartidos(datosLocales))
        .catch(err => {
            console.error(err);
            mostrarErrorEnPantalla("No se pudieron cargar las predicciones del día.");
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

// Registro de Service Worker para capacidades Offline PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}
