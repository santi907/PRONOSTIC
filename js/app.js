// 1. Configuración de API-Sports con tu clave real
const API_KEY = '7232d57a2397121a214f82a7dce2d51a';
const PROXY_URL = 'https://corsproxy.io/?';

// Obtenemos la fecha de hoy de forma automática (Formato YYYY-MM-DD)
const hoy = new Date().toISOString().split('T')[0];
const API_URL = `${PROXY_URL}https://v3.football.api-sports.io/fixtures?date=${hoy}`;

// Referencias a los elementos de tu HTML real
const DOM = {
    loading: () => document.getElementById('loading'),
    error: () => document.getElementById('error'),
    contenedor: () => document.getElementById('contenedor-partidos')
};

// 2. Función principal para traer partidos de hoy
function cargarPartidosDisponibles() {
    console.log("Iniciando petición a la API-Sports...");
    
    // Aseguramos que el cargando esté visible y el error oculto al iniciar
    if (DOM.loading()) DOM.loading().style.display = 'block';
    if (DOM.error()) DOM.error().style.display = 'none';

    fetch(API_URL, {
        method: 'GET',
        headers: {
            'x-apisports-key': API_KEY,
            'x-rapidapi-key': API_KEY
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de red (Status ${response.status})`);
        }
        return response.json();
    })
    .then(data => {
        // Si la API nos devuelve errores de credenciales o límite
        if (data.errors && Object.keys(data.errors).length > 0) {
            const mensajeError = JSON.stringify(data.errors);
            throw new Error(`Error de API-Sports: ${mensajeError}`);
        }

        const partidosAPI = data.response;

        // Si la API de fútbol no tiene partidos hoy, cargamos tu JSON local de respaldo
        if (!partidosAPI || partidosAPI.length === 0) {
            console.warn("Sin partidos hoy en la API. Cargando respaldo local...");
            cargarRespaldoLocal();
            return;
        }

        // Mapeamos los partidos recibidos
        const partidosTransformados = partidosAPI.slice(0, 10).map((item, index) => {
            const equipoLocal = item.teams.home.name;
            const equipoVisitante = item.teams.away.name;
            const nombreLiga = item.league.name;

            // Pronósticos simulados inteligentes basados en el partido
            let pronostico = `Torneo: ${nombreLiga}. Pronóstico: Más de 1.5 goles totales o ambos anotan.`;
            if (index % 3 === 0) {
                pronostico = `Torneo: ${nombreLiga}. Pronóstico: Doble oportunidad para ${equipoLocal} (Gana o Empata).`;
            } else if (index % 3 === 1) {
                pronostico = `Torneo: ${nombreLiga}. Pronóstico: Más de 2.5 goles totales en el partido.`;
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
        console.error('Fallo en la API, recurriendo a respaldo local...', error);
        cargarRespaldoLocal();
    });
}

// 3. Función de respaldo (Fallback) si la API falla o excede la cuota
function cargarRespaldoLocal() {
    fetch('./datos/partidos.json?v=4')
        .then(res => {
            if (!res.ok) throw new Error("No se pudo leer el archivo local partidos.json");
            return res.json();
        })
        .then(datosLocales => {
            mostrarPartidos(datosLocales);
        })
        .catch(err => {
            console.error('Fallo crítico de datos:', err);
            mostrarErrorEnPantalla("Hubo un problema al cargar los partidos de hoy. Inténtalo más tarde.");
        });
}

// 4. Función para renderizar las tarjetas y ocultar pantallas de carga
function mostrarPartidos(partidos) {
    const contenedor = DOM.contenedor();
    const loading = DOM.loading();
    const errorMsg = DOM.error();

    // Ocultamos el spinner de carga y el bloque de error
    if (loading) loading.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    if (!contenedor) {
        console.error("Error crítico: No se encontró el elemento #contenedor-partidos en el HTML.");
        return;
    }

    // Limpiamos el contenedor
    contenedor.innerHTML = '';

    // Pintamos cada partido usando la estructura exacta de tus tarjetas
    partidos.forEach(partido => {
        const tarjetaHTML = `
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
        contenedor.innerHTML += tarjetaHTML;
    });
}

// 5. Manejo visual de errores en pantalla
function mostrarErrorEnPantalla(mensaje) {
    const loading = DOM.loading();
    const errorMsg = DOM.error();
    const contenedor = DOM.contenedor();

    if (loading) loading.style.display = 'none';
    if (contenedor) contenedor.innerHTML = ''; // Limpiamos partidos viejos

    if (errorMsg) {
        errorMsg.textContent = mensaje;
        errorMsg.style.display = 'block';
    } else {
        alert(mensaje);
    }
}

// Inicializar la carga al cargar la página
document.addEventListener('DOMContentLoaded', cargarPartidosDisponibles);

// 6. REGISTRO DEL SERVICE WORKER (PWA activa)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado en:', reg.scope))
            .catch(err => console.error('Error al registrar SW:', err));
    });
}
