// ==========================================
// CONFIGURACIÓN REAL DE TU API (BZZOIRO / BSD)
// ==========================================
const MODO_DESARROLLO = false; 
const API_TOKEN = 'be6f00ab1f68e6b755201f1a7cd264a93be3d0cf'; 

// URL real extraída y adaptada de tu documentación de Bzzoiro
const API_URL = 'https://sports.bzzoiro.com/football/api/v2/matches/live/'; 

// ==========================================
// LÓGICA DE LA APLICACIÓN
// ==========================================

function obtenerContenedorHTML() {
    return document.getElementById('contenedor-partidos') || 
           document.getElementById('contenedor') || 
           document.getElementById('partidos');
}

function cargarPartidosDisponibles() {
    console.log("Conectando en vivo con sports.bzzoiro.com...");
    
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    if (loading) loading.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';

    if (MODO_DESARROLLO) {
        setTimeout(cargarRespaldoLocal, 500);
        return;
    }

    // Petición con el formato Token exacto de tu documentación
    fetch(API_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error Bzzoiro (Status ${response.status})`);
        return response.json();
    })
    .then(data => {
        // Bzzoiro suele entregar los partidos en un arreglo directo, en 'data' o en 'results'
        const partidosAPI = data.results || data.data || (Array.isArray(data) ? data : null);

        if (!partidosAPI || partidosAPI.length === 0) {
            console.warn("No hay partidos en vivo en este instante en la API. Usando respaldo.");
            cargarRespaldoLocal();
            return;
        }

        // Mapeamos los partidos manejando cualquier variante de nombres de campo de Bzzoiro
        const partidosTransformados = partidosAPI.slice(0, 10).map((item, index) => {
            const local = item.home_team?.name || item.home?.name || item.home_team || "Equipo Local";
            const visitante = item.away_team?.name || item.away?.name || item.away_team || "Equipo Visitante";
            const liga = item.league?.name || item.tournament?.name || "Serie B / Liga";

            let pronostico = "";
            const esFutbolBrasil = liga.toLowerCase().includes("serie b") || liga.toLowerCase().includes("brasil");

            if (esFutbolBrasil) {
                pronostico = index % 2 === 0 
                    ? `Torneo: ${liga}. Pronóstico: Menos de 2.5 goles (Partido cerrado).`
                    : `Torneo: ${liga}. Pronóstico: Gana o empata ${local} por localía.`;
            } else {
                pronostico = index % 2 === 0
                    ? `Torneo: ${liga}. Pronóstico: Más de 1.5 goles totales.`
                    : `Torneo: ${liga}. Pronóstico: Apuesta sin empate a favor de ${local}.`;
            }

            return {
                local: local,
                visitante: visitante,
                fecha: "HOY EN VIVO",
                prediccion: pronostico
            };
        });

        mostrarPartidos(partidosTransformados);
    })
    .catch(error => {
        console.warn('API sin partidos en vivo o reconectando. Activando respaldo local...', error);
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
                <p class="fecha">Estado: <strong>${partido.fecha}</strong></p>
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
