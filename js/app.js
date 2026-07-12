// 1. Configuración de API-Sports con tu clave real
const API_KEY = '7232d57a2397121a214f82a7dce2d51a';
const PROXY_URL = 'https://corsproxy.io/?';

// Obtenemos la fecha de hoy de forma automática (Formato YYYY-MM-DD)
const hoy = new Date().toISOString().split('T')[0];
const API_URL = `${PROXY_URL}https://v3.football.api-sports.io/fixtures?date=${hoy}`;

// 2. Función principal para traer partidos de hoy
function cargarPartidosDisponibles() {
    console.log("Iniciando petición a la API...");
    
    fetch(API_URL, {
        method: 'GET',
        headers: {
            'x-apisports-key': API_KEY,
            'x-rapidapi-key': API_KEY
        }
    })
    .then(response => {
        console.log("Respuesta recibida del servidor. Status:", response.status);
        if (!response.ok) {
            throw new Error(`Error de conexión (Status ${response.status})`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Datos recibidos de API-Sports:", data);

        // Si la API nos devuelve errores internos (como clave inválida o límite excedido)
        if (data.errors && Object.keys(data.errors).length > 0) {
            const mensajeError = JSON.stringify(data.errors);
            throw new Error(`API-Sports reportó un error: ${mensajeError}`);
        }

        const partidosAPI = data.response;

        if (!partidosAPI || partidosAPI.length === 0) {
            console.warn("No hay partidos programados para hoy en la API. Cargando respaldo local...");
            cargarRespaldoLocal("No hay partidos en vivo hoy. Mostrando respaldo local.");
            return;
        }

        // Mapeamos los datos de API-Sports
        const partidosTransformados = partidosAPI.slice(0, 10).map((item, index) => {
            const equipoLocal = item.teams.home.name;
            const equipoVisitante = item.teams.away.name;
            const nombreLiga = item.league.name;

            let pronostico = `Torneo: ${nombreLiga}. Pronóstico: Ambos anotan o más de 1.5 goles.`;
            if (index % 2 === 0) {
                pronostico = `Torneo: ${nombreLiga}. Pronóstico: Doble oportunidad para ${equipoLocal}.`;
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
        console.error('Error atrapado en la API:', error);
        // Intentamos usar el respaldo si la API falla
        cargarRespaldoLocal(`Error API (${error.message}). Cargando respaldo...`);
    });
}

// 3. Función de respaldo (Fallback)
function cargarRespaldoLocal(motivoLog) {
    console.log(motivoLog);
    fetch('./datos/partidos.json?v=3')
        .then(res => {
            if (!res.ok) throw new Error("No se pudo leer el archivo partidos.json local.");
            return res.json();
        })
        .then(datosLocales => {
            mostrarPartidos(datosLocales);
        })
        .catch(err => {
            console.error('Error crítico: Tampoco se pudo cargar el respaldo local:', err);
            mostrarErrorEnPantalla(`Fallo total. API bloqueada y archivo local no encontrado. Detalle: ${err.message}`);
        });
}

// 4. Función para renderizar las tarjetas en el HTML
function mostrarPartidos(partidos) {
    const contenedor = document.getElementById('partidos-container') || document.getElementById('contenedor') || document.querySelector('.contenedor');

    if (!contenedor) {
        console.error("No se encontró el contenedor HTML.");
        alert("Error de diseño: No se encuentra el contenedor de tarjetas en tu HTML.");
        return;
    }

    contenedor.innerHTML = ''; // Limpiar cargando...

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

// 5. Mostrar errores visuales en la app
function mostrarErrorEnPantalla(mensaje) {
    const contenedor = document.getElementById('partidos-container') || document.getElementById('contenedor') || document.querySelector('.contenedor');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="card" style="border: 2px solid #ff4d4d; background: #fff5f5; color: #cc0000; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-weight: bold;">⚠️ Error de Carga</p>
                <p style="margin: 8px 0 0 0; font-size: 14px;">${mensaje}</p>
            </div>
        `;
    }
}

// Inicializar la app
document.addEventListener('DOMContentLoaded', cargarPartidosDisponibles);

// 6. Registro del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registrado.'))
            .catch(err => console.error('Error SW:', err));
    });
}
