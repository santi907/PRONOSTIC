// ==========================================
// CONFIGURACIÓN DE TU API (BSD)
// ==========================================
const MODO_DESARROLLO = false; 
const API_TOKEN = 'be6f00ab1f68e6b755201f1a7cd264a93be3d0cf'; 

// RECUERDA: Cambia esta URL cuando mires el botón "Read docs" en tu panel de BSD
const API_URL = 'https://api.bsd.com/v2/football/fixtures'; 

// ==========================================
// LÓGICA DE LA APLICACIÓN
// ==========================================

function obtenerContenedorHTML() {
    return document.getElementById('contenedor-partidos') || 
           document.getElementById('contenedor') || 
           document.getElementById('partidos');
}

function cargarPartidosDisponibles() {
    console.log("Iniciando carga de partidos...");
    
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    if (loading) loading.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';

    if (MODO_DESARROLLO) {
        setTimeout(cargarRespaldoLocal, 500);
        return;
    }

    fetch(API_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error Status ${response.status}`);
        return response.json();
    })
    .then(data => {
        const partidosAPI = data.response || data.data || data;

        if (!partidosAPI || partidosAPI.length === 0) {
            cargarRespaldoLocal();
            return;
        }

        const partidosTransformados = partidosAPI.slice(0, 10).map((item, index) => {
            const local = item.home_team?.name || item.teams?.home?.name || "Equipo Local";
            const visitante = item.away_team?.name || item.teams?.away?.name || "Equipo Visitante";
            const liga = item.league?.name || "Torneo";

            // Inteligencia Artificial Básica: Detectar si es Serie B de Brasil para personalizar la predicción
            let pronostico = "";
            const esSerieB = liga.toLowerCase().includes("serie b") || liga.toLowerCase().includes("brasil");

            if (esSerieB) {
                // En la Serie B de Brasil se dan muchos empates y pocos goles
                pronostico = index % 2 === 0 
                    ? `Torneo: ${liga}. Pronóstico: Menos de 2.5 goles (Defensas cerradas).`
                    : `Torneo: ${liga}. Pronóstico: Hándicap Asiático +0.5 para ${local}.`;
            } else {
                pronostico = index % 2 === 0
                    ? `Torneo: ${liga}. Pronóstico: Gana o empata ${local}.`
                    : `Torneo: ${liga}. Pronóstico: Más de 1.5 goles totales.`;
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
        console.warn('Cargando los partidos desde el archivo de respaldo local...', error);
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
    const contenedor = obtenerContenedorHTML();
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    if (loading) loading.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';

    if (!contenedor) {
        mostrarErrorEnPantalla("Error de estructura en la plantilla web.");
        return;
    }
    
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
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    if (loading) loading.style.display = 'none';
    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', cargarPartidosDisponibles);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}
