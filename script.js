let currentDate = new Date();
let currentPlanningType = "Advanced";

document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.querySelector(".menu");
    const menuLinks = document.querySelectorAll(".menu a");

    const fechaInput = document.getElementById('fecha');
    const today = new Date().toISOString().split("T")[0];
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
        currentDate = new Date(e.target.value);
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
    const formattedDate = formatDate(currentDate);

    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const data = await response.json();

            allPrograms.push(data);

            const programDiv = document.createElement("div");
            programDiv.className = "program";

            const programDate = new Date(data.bloques[0].fecha);
            const formattedProgramDate = formatDate(programDate);  

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
            console.error("Error al obtener datos: ", error);
        }
    }

    if (allPrograms.length === 0) {
        programsContainer.innerHTML = "<p>No data</p>";
    }

    document.getElementById("downloadButton").onclick = () => downloadTextFile(allPrograms);
    document.getElementById("downloadJsonButton").onclick = () => downloadJSONFile(allPrograms);
}

async function fetchOldPlanning() {
    const fecha = currentDate.toISOString().split("T")[0]; 

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
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
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
        console.error("Error al obtener los datos de planificación: ", error);
        document.getElementById("planning-content").innerHTML = `<p>Error al obtener los datos: ${error.message}</p>`;
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
    fechaInput.value = currentDate.toISOString().split("T")[0];
}


function formatDate(date) {
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    
    const month = months[date.getMonth()];
    const dayOfMonth = date.getUTCDate().toString().padStart(2, '0'); 
    const year = date.getUTCFullYear(); 
    return `${dayOfMonth}/${month}/${year}`;
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                    function encodeBase64(url) {return btoa(url);}
                                                                                                                                                                                                                                                                                                                                                                                                                                                    function decodeBase64(encodedUrl) {return atob(encodedUrl);}
function parseDateFromJson(dateString) {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate;
}


fetchPrograms();
