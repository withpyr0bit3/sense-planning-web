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

document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.querySelector(".menu");
    const menuLinks = document.querySelectorAll(".menu a");

    hamburger.addEventListener("click", function () {
        menu.classList.toggle("active");
    });

    menuLinks.forEach(link => {
        link.addEventListener("click", function () {
            menu.classList.remove("active");
        });
    });
});

async function fetchPrograms() {
    const urls = [
        "https://db.sense.fitness/api/Programa/4",
        "https://db.sense.fitness/api/Programa/3",
        "https://db.sense.fitness/api/Programa/2",
        "https://db.sense.fitness/api/Programa/1"
    ];

    const programsContainer = document.getElementById("programs");
    programsContainer.innerHTML = "";
    let allPrograms = [];

    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const data = await response.json();

            allPrograms.push(data);

            const programDiv = document.createElement("div");
            programDiv.className = "program";
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

let currentDate = new Date();
let currentPlanningType = "Advanced";

function formatDate(date) {
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate().toString().padStart(2, '0'); // Asegurarse de que el día tenga dos dígitos
    const year = date.getFullYear();
    return `${dayOfMonth}/${month}/${year}`;
}

document.addEventListener("DOMContentLoaded", function () {
    const fechaInput = document.getElementById('fecha');
    const today = new Date().toISOString().split("T")[0];
    fechaInput.value = today;

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

    const url = `https://db.sense.fitness/api/Programa/${planningNumber}/${fecha}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();

        if (!data || !data.bloques || data.bloques.length === 0) {
            document.getElementById("planning-content").innerHTML = "<p>No data</p>";
        } else {
            displayPlanningData(data);
        }

    } catch (error) {
        console.error("Error al obtener datos: ", error);
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

    // Agregar la fecha formateada al header
    const formattedDate = formatDate(currentDate);
    programDiv.innerHTML = `<h2>${data.nombre} - ${formattedDate}</h2>`; // Agregar la fecha aquí

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

fetchPrograms();