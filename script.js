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
    const today = localDate.getFullYear() + "-" +(localDate.getMonth() + 1).toString().padStart(2, '0') + "-" + localDate.getDate().toString().padStart(2, '0');
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

document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;
    
    const systemDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (systemDarkMode || localStorage.getItem("dark-mode") === "enabled") {
        body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }

    darkModeToggle.addEventListener("change", () => {
        body.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("dark-mode", "enabled");
        } else {
            localStorage.setItem("dark-mode", "disabled");
        }
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (e.matches) {
            body.classList.add("dark-mode");
            darkModeToggle.checked = true;
        } else {
            body.classList.remove("dark-mode");
            darkModeToggle.checked = false;
        }
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

    // Obtener la fecha actual en UTC y formatearla como YYYY-MM-DD
    const nowUtc = new Date();
    nowUtc.setHours(nowUtc.getHours() - 3);
    const utcDateFormatted = nowUtc.toISOString().split('T')[0];
    const [year, month, day] = utcDateFormatted.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    const weekDay = nowUtc.getUTCDay() === 0 ? 7 : nowUtc.getUTCDay();
    
    const programNames = {
        1: "Lower Body",
        2: "Hybrid",
        3: "Full Body",
        4: "Hybrid",
        5: "Upper Body",
        6: "Hybrid",
        7: "Hybrid"
    };

    for (let url of urls) {
        try {
            const updatedUrl = `${url}/${utcDateFormatted}`;
            const response = await fetch(updatedUrl);
            if (!response.ok) throw new Error(`Error ${response.status}`);

            const data = await response.json();

            if (!data.bloques || data.bloques.length === 0) {
                document.getElementById("planning-content").innerHTML = `<p style="color: var(--color-text);">No data available</p>`;

                continue;
            }

            allPrograms.push(data);

            const programDiv = document.createElement("div");
            programDiv.className = "program";

            document.querySelector("#today h1").innerHTML = `Planning - ${formattedDate}`;

            if (url.includes("Programa/1")) {
                data.nombre = programNames[weekDay] || "Hybrid";
            }

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

        programsContainer.innerHTML = `<p style="color: var(--color-text);">No data for ${formattedDate}</p>`;
    }
}

async function fetchOldPlanning() {
    // Convertir currentDate a la zona horaria de Montevideo y formatear como "YYYY-MM-DD" para la URL
    const montevideoDate = getMontevideoDate(currentDate);  // Aseguramos que la fecha esté ajustada
    const fecha = montevideoDate.getFullYear() + "-" + (montevideoDate.getMonth() + 1).toString().padStart(2, '0') + "-" + montevideoDate.getDate().toString().padStart(2, '0');

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
            document.getElementById("planning-content").innerHTML = `<p style="color: var(--color-text);">No data available</p>`;
        } else {
            data.bloques.forEach(bloque => {
                bloque.fecha = parseDateFromJson(bloque.fecha);
            });
            
            // Pasamos la fecha ajustada a Montevideo
            const selectedDate = montevideoDate;  // Fecha ya ajustada a Montevideo
            displayPlanningData(data, fullUrl, selectedDate); // Pasamos la fecha ajustada
        }

    } catch (error) {
        console.error("Error when obtaining planning data: ", error);
        document.getElementById("planning-content").innerHTML = `<p style="color: var(--color-text);" >Error in obtaining data: ${error.message}</p>`;
    }
}


function displayPlanningData(data, fullUrl, selectedDate = null) {
    const planningContainer = document.getElementById("planning-content");
    planningContainer.innerHTML = "";

    if (!data || !data.bloques || data.bloques.length === 0) {
        programsContainer.innerHTML = `<p style="color: var(--color-text);">No data</p>`;
        return;
    }

    // Usamos selectedDate (ajustada a Montevideo) si está disponible
    const now = selectedDate ? selectedDate : new Date();
    const localDate = getMontevideoDate(now); // Asegurándonos de que la fecha esté ajustada a Montevideo
    const weekDay = localDate.getDay() === 0 ? 7 : localDate.getDay();

    const programNames = {
        1: "LOWER BODY",
        2: "HYBRID",
        3: "FULL BODY",
        4: "HYBRID",
        5: "UPPER BODY",
        6: "HYBRID",
        7: "HYBRID"
    };

    const programDiv = document.createElement("div");
    programDiv.className = "program";

    const formattedDate = formatDate(localDate);
    
    // Asignamos el nombre del programa dependiendo del día
    if (fullUrl.includes("Programa/1")) {
        data.nombre = programNames[weekDay] || "HYBRID";
        programDiv.innerHTML = `<h2>${data.nombre} - ${formattedDate}</h2>`;
    } else {
        programDiv.innerHTML = `<h2>${data.nombre} - ${formattedDate}</h2>`;
    }

    // Procesamos los bloques y los ejercicios
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

    // Añadimos el contenido al contenedor
    planningContainer.appendChild(programDiv);
}


function getMontevideoDate(date) {
    return new Date(date.toLocaleString("en-US", { timeZone: "America/Montevideo" }));
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
