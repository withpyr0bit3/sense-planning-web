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
        "https://db.sense.fitness/api/Programa/4/2025-03-08",
        "https://db.sense.fitness/api/Programa/3/2025-03-08",
        "https://db.sense.fitness/api/Programa/2/2025-03-08",
        "https://db.sense.fitness/api/Programa/1/2025-03-08"
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

    document.getElementById("downloadButton").onclick = () => downloadTextFile(allPrograms);
    document.getElementById("downloadJsonButton").onclick = () => downloadJSONFile(allPrograms);
}

function downloadTextFile(data) {
    if (!data.length) {
        console.error("No hay datos para descargar.");
        return;
    }

    let fecha = "sin-fecha";
    if (data[0]?.bloques?.length > 0 && data[0].bloques[0].fecha) {
        const fechaObj = new Date(data[0].bloques[0].fecha);
        fecha = `${fechaObj.getDate().toString().padStart(2, '0')}/${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}/${fechaObj.getFullYear()}`;
    }

    let formattedText = data.map(programa => {
        let bloquesText = programa.bloques.map(bloque => {
            let ejercicios = bloque.ejercicios
                .replace(/<br>/g, '\n')
                .replace(/<.*?>/g, '')
                .replace(/&#\d+;/g, match => {
                    const textarea = document.createElement("textarea");
                    textarea.innerHTML = match;
                    return textarea.value;
                });
            return `Bloque ${bloque.bloque}:\n${ejercicios}\n`;
        }).join('\n');
        return `${programa.nombre}\n${bloquesText}`;
    }).join('\n');

    const blob = new Blob([formattedText], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `PlanificacionSense-${fecha}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadJSONFile(data) {
    if (!data.length) {
        console.error("No hay datos para descargar.");
        return;
    }

    const fecha = new Date().toISOString().split("T")[0];
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `PlanificacionSense-${fecha}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

let currentDate = new Date();
let currentPlanningType = "Advanced";

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

        displayPlanningData(data);

    } catch (error) {
        console.error("Error al obtener datos: ", error);
    }
}

function displayPlanningData(data) {
    const planningContainer = document.getElementById("planning-content");
    planningContainer.innerHTML = "";

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

    planningContainer.appendChild(programDiv);
}

function updateDateInput() {
    const fechaInput = document.getElementById('fecha');
    fechaInput.value = currentDate.toISOString().split("T")[0];
}

fetchPrograms();
