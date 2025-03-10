let currentDate = new Date(); // Se actualizará según la fecha seleccionada
let currentPlanningType = "Advanced";

// Función auxiliar para obtener la fecha en la zona horaria de Montevideo
function getMontevideoDate(date) {
    return new Date(date.toLocaleString("en-US", { timeZone: "America/Montevideo" }));
}

document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.querySelector(".menu");
    const menuLinks = document.querySelectorAll(".menu a");

    const fechaInput = document.getElementById('fecha');
    // Obtener la fecha actual en Montevideo y formatearla como "YYYY-MM-DD" para el input type="date"
    const now = new Date();
    const localDate = getMontevideoDate(now);
    const today = localDate.getFullYear() + "-" +
                  (localDate.getMonth() + 1).toString().padStart(2, '0') + "-" +
                  localDate.getDate().toString().padStart(2, '0');
    fechaInput.value = today;

    hamburger.addEventListener("click", function () {
        menu.classList.toggle("active");
    });

    menuLinks.forEach(link => {
        link.addEventListener("click", function () {
            menu.classList.remove("active");
        });
    });

    document.getElementById('planning').addEventListener('change', (e) => {
        currentPlanningType = e.target.value;
        fetchOldPlanning();
    });

    document.getElementById('fecha').addEventListener('change', (e) => {
        // Parsear el valor del input como fecha en Montevideo (se agrega la hora y el offset para UTC-3)
        currentDate = new Date(e.target.value + "T00:00:00-03:00");
        fetchOldPlanning();
    });

    document.getElementById("prevBtn").addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateInput();
        fetchOldPlanning();
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateInput();
        fetchOldPlanning();
    });
});

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';

    if (tabId === "today") {
        fetchPrograms();
    } else if (tabId === "old-planning") {
        fetchOldPlanning();
    }
}

function toggleMenu() {
    const menu = document.querySelector('.menuContainer');
    menu.classList.toggle('active');
}

async function fetchPrograms() {
    const encodedUrls = [
        "aHR0cHM6Ly9kYi5zZW5zZS5maXRuZXNzL2FwaS9Qcm9ncmFtYS80",
        "aHR0cHM6Ly9kYi5zZW5zZS5maXRuZXNzL2FwaS9Qcm9ncmFtYS8z",
        "aHR0cHM6Ly9kYi5zZW5zZS5maXRuZXNzL2FwaS9Qcm9ncmFtYS8y",
        "aHR0cHM6Ly9kYi5zZW5zZS5maXRuZXNzL2FwaS9Qcm9ncmFtYS8x"
    ];

    const urls = encodedUrls.map(encodedUrl => decodeBase64(encodedUrl));
    const programsContainer = document.getElementById("programs");
    programsContainer.innerHTML = "";

    let allPrograms = [];

    // Obtener la fecha actual en Montevideo (UTC-3)
    const now = new Date();
    const localDate = getMontevideoDate(now);
    // Formatear la fecha en DD/MM/YYYY para mostrar en el mensaje
    const dateFormatted = localDate.getDate().toString().padStart(2, '0') + "/" +
                          (localDate.getMonth() + 1).toString().padStart(2, '0') + "/" +
                          localDate.getFullYear();

    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error ${response.status}`);

            const data = await response.json();

            if (!data.bloques || data.bloques.length === 0) {
                document.getElementById("planning-content").innerHTML = `<p>No data available</p>`;
                continue;
            }

            allPrograms.push(data);

            const programDiv = document.createElement("div");
            programDiv.className = "program";

            const programDate = new Date(data.bloques[0].fecha);
            const formattedProgramDate = isNaN(programDate.getTime()) ? "Invalid date" : formatDate(programDate);

            document.querySelector("#today h1").innerHTML = `Planning - ${formattedProgramDate}`;
            programDiv.innerHTML = `<h2>${data.nombre}</h2>`;

            data.bloques.forEach(bloque => {
                let ejercicios = bloque.ejercicios
                    .replace(/<br>/g, '\n')
                    .replace(/<.*?>/g, '')
                    .replace(/&#\d+;/g, match => {
                        const textarea = document.createElement("textarea");
                        textarea.innerHTML = match;
                        return textarea.value;
                    });

                programDiv.innerHTML += `<p><strong>Bloque ${bloque.bloque}:</strong><br>${ejercicios.replace(/\n/g, '<br>')}</p>`;
            });

            programsContainer.appendChild(programDiv);

        } catch (error) {
            console.error("Error in obtaining data: ", error);
        }
    }

    if (allPrograms.length === 0) {
        programsContainer.innerHTML = `<p>No data for ${dateFormatted}</p>`;
    }
}

async function fetchOldPlanning() {
    // Convertir currentDate a la zona horaria de Montevideo y formatear como "YYYY-MM-DD" para la URL
    const montevideoDate = getMontevideoDate(currentDate);
    const fecha = montevideoDate.getFullYear() + "-" +
                  (montevideoDate.getMonth() + 1).toString().padStart(2, '0') + "-" +
                  montevideoDate.getDate().toString().padStart(2, '0');

    let planningNumber;
    switch (currentPlanningType) {
        case "Advanced":
            planningNumber = 4;
            break;
        case "Fitness":
            planningNumber = 3;
            break;
        case "Functional":
            planningNumber = 2;
            break;
        case "Start":
            planningNumber = 1;
            break;
        default:
            planningNumber = 4;
    }

    const baseUrl = `aHR0cHM6Ly9kYi5zZW5zZS5maXRuZXNzL2FwaS9Qcm9ncmFtYS8=`;
    const decodedUrl = decodeBase64(baseUrl);
    const fullUrl = `${decodedUrl}${planningNumber}/${fecha}`;

    try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Error in the application: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || !data.bloques || data.bloques.length === 0) {
            document.getElementById("planning-content").innerHTML = "<p>No data available</p>";
        } else {
            data.bloques.forEach(bloque => {
                bloque.fecha = parseDateFromJson(bloque.fecha);
            });
            displayPlanningData(data);
        }

    } catch (error) {
        console.error("Error when obtaining planning data: ", error);
        document.getElementById("planning-content").innerHTML = `<p>Error in obtaining data: ${error.message}</p>`;
    }
}

function displayPlanningData(data) {
    const planningContainer = document.getElementById("planning-content");
    planningContainer.innerHTML = "";

    if (!data.bloques || data.bloques.length === 0) {
        planningContainer.innerHTML = "<p>No data</p>";
        return;
    }

    const programDiv = document.createElement("div");
    programDiv.className = "program";

    const formattedDate = formatDate(currentDate);
    programDiv.innerHTML = `<h2>${data.nombre} - ${formattedDate}</h2>`;

    data.bloques.forEach(bloque => {
        let ejercicios = bloque.ejercicios
            .replace(/<br>/g, '\n')
            .replace(/<.*?>/g, '')
            .replace(/&#\d+;/g, match => {
                const textarea = document.createElement("textarea");
                textarea.innerHTML = match;
                return textarea.value;
            });
        programDiv.innerHTML += `<p><strong>Bloque ${bloque.bloque}:</strong><br>${ejercicios.replace(/\n/g, '<br>')}</p>`;
    });

    planningContainer.appendChild(programDiv);
}


function updateDateInput() {
    const fechaInput = document.getElementById('fecha');
    const montevideoDate = getMontevideoDate(currentDate);
    const year = montevideoDate.getFullYear();
    const month = (montevideoDate.getMonth() + 1).toString().padStart(2, '0');
    const day = montevideoDate.getDate().toString().padStart(2, '0');
    fechaInput.value = `${year}-${month}-${day}`;
}


function formatDate(date) {
    // Formatea la fecha en "DD/MM/YYYY" usando la zona horaria de Montevideo
    const local = getMontevideoDate(date);
    const day = local.getDate().toString().padStart(2, '0');
    const month = (local.getMonth() + 1).toString().padStart(2, '0');
    const year = local.getFullYear();
    return `${day}/${month}/${year}`;
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        function encodeBase64(url) {return btoa(url);}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        function decodeBase64(encodedUrl) {return atob(encodedUrl);}
function parseDateFromJson(dateString) {
    return new Date(new Date(dateString).toLocaleString("es-UY", { timeZone: "America/Montevideo" }));
}

fetchPrograms();
