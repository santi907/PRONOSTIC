// 1. Configuración de API-Sports con tu clave real
const API_KEY = '7232d57a2397121a214f82a7dce2d51a';
const PROXY_URL = 'https://corsproxy.io/?';

// Obtenemos la fecha de hoy de forma automática en formato YYYY-MM-DD
const hoy = new Date().toISOString().split('T')[0];
const API_URL = `${PROXY_URL}https://v3.football.api-sports.io/fixtures?date=${hoy}`;

// 2. Función principal para traer partidos de hoy
function cargarPartidosDisponibles() {
    fetch(API_URL, {
        headers: {
            'x-apisports-key': API_KEY,
            'x-rapidapi-key': API_KEY // Ponemos ambos encabezados por seguridad
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al conectar con API-Sports');
        }
        return response.json();
    })
    .then(data => {
        // API-Sports entrega la lista de partidos dentro de 'response'
        const partidosAPI = data.response;

        if (!partidosAPI || partidosAPI.length === 0) {
            console.log("No hay partidos programados para hoy en la API. Usando respaldo local...");
            cargarRespaldoLocal();
            return;
        }

        // Mapeamos los datos de API-Sports a la estructura de tus tarjetas
        const partidosTransformados = partidosAPI.slice(0, 10).map((item, index) => {
            const equipoLocal = item.teams.home.name;
            const equipoVisitante = item.teams.away.name;
            const nombreLiga = item.league.name;

            // Generamos un pronóstico simulado divertido según el partido
            let pronostico = `Torneo: ${nombreLiga}. Pronóstico: Más de 1.5 goles totales o ambos anotan.`;
            if (index % 3 === 0) {
                pronostico = `Torneo: ${nombreLiga}. Pronóstico: Alta probabilidad de victoria/empate para ${equipoLocal} (1X).`;
            } else if (index % 3 === 1) {
                pronostico = `Torneo: ${nombreLiga}. Pronóstico: Más de 2.5 goles totales. Juego muy dinámico.`;
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
        console.error('Hubo un fallo con la API:', error);
        cargarRespaldoLocal();
    });
}

// 3. Función de respaldo (Fallback) si la API supera su límite diario
function cargarRespaldoLocal() {
    fetch('./datos/partidos.json?v=2')
        .then(res => res.json())
        .then(datosLocales => mostrarPartidos(datosLocales))
        .catch(err => console.error('No se pudo cargar tampoco el respaldo local:', err));
}

// 4. Función para renderizar y pintar las tarjetas en el HTML
function mostrarPartidos(partidos) {
    // Buscamos el contenedor. Si tu ID en el HTML es diferente, cámbialo aquí abajo.
    const contenedor = document.getElementById('partidos-container') || document.getElementById('contenedor') || document.querySelector('.contenedor');

    if (!contenedor) {
        console.error("No encontramos tu contenedor HTML para renderizar los partidos.");
        return;
    }

    // Limpiamos el texto de "Cargando predicciones..."
    contenedor.innerHTML = '';

    // Dibujamos cada partido usando tus clases CSS
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

// Inicializar la carga cuando el HTML esté listo
document.addEventListener('DOMContentLoaded', cargarPartidosDisponibles);

// 5. REGISTRO DEL SERVICE WORKER (Manteniendo viva tu PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado con éxito en el ámbito:', reg.scope))
            .catch(err => console.error('Error al registrar el Service Worker:', err));
    });
}
