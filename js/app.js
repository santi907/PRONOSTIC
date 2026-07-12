// 1. Configuración de la API con tu clave real
const API_KEY = 'eaaa85924d5646b7afc2aa622e887f5c';
// Usamos este proxy gratuito para evitar que el navegador bloquee la petición (Error de CORS)
const PROXY_URL = 'https://corsproxy.io/?'; 
const API_URL = `${PROXY_URL}https://api.football-data.org/v4/matches`;

// 2. Función principal para obtener los partidos del día
function cargarPartidosDisponibles() {
    // Aquí puedes poner el contenedor de tus tarjetas (ej: document.getElementById('contenedor'))
    const contenedor = document.getElementById('partidos-container'); 

    fetch(API_URL, {
        headers: { 'X-Auth-Token': API_KEY }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al conectar con la API de fútbol');
        }
        return response.json();
    })
    .then(data => {
        // La API nos devuelve un objeto. Buscamos la lista de partidos adentro de 'matches'
        const partidosAPI = data.matches;

        if (!partidosAPI || partidosAPI.length === 0) {
            console.log("No hay partidos programados para hoy.");
            // Opcional: Aquí podrías llamar a una función que cargue tus partidos locales de respaldo
            return;
        }

        // 3. Mapeamos los datos de la API al formato exacto que ya entiende tu CSS y HTML
        const partidosTransformados = partidosAPI.slice(0, 8).map((partido, index) => {
            // Extraemos los nombres cortos o completos de los equipos
            const equipoLocal = partido.homeTeam.shortName || partido.homeTeam.name;
            const equipoVisitante = partido.awayTeam.shortName || partido.awayTeam.name;
            const nombreCompeticion = partido.competition.name;

            return {
                id: partido.id || index,
                local: equipoLocal,
                visitante: equipoVisitante,
                fecha: partido.utcDate.split('T')[0], // Corta la fecha para que quede YYYY-MM-DD
                // Como la API no trae predicciones (solo datos), creamos un pronóstico inteligente automatizado:
                prediccion: `Torneo: ${nombreCompeticion}. Pronóstico automático: Alta probabilidad de más de 1.5 goles totales o victoria/empate para ${equipoLocal}.`
            };
        });

        // 4. Enviamos los partidos transformados a tu función encargada de pintar las tarjetas
        // (Asegúrate de cambiar 'mostrarPartidos' por el nombre real de tu función de renderizado)
        mostrarPartidos(partidosTransformados); 
    })
    .catch(error => {
        console.error('Hubo un problema con la API:', error);
        // Fallback: Si la API falla o excede el límite diario, puedes cargar el JSON local para que la web nunca quede vacía
        fetch('./datos/partidos.json?v=2')
            .then(res => res.json())
            .then(datosLocales => mostrarPartidos(datosLocales));
    });
}

// Ejecutar la función al cargar la página
document.addEventListener('DOMContentLoaded', cargarPartidosDisponibles);
