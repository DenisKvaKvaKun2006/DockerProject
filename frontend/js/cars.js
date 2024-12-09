const carsList = document.getElementById("carsList");
const addCarButton = document.getElementById("addCarButton");
const addCarForm = document.getElementById("addCarForm");
const submitAddCar = document.getElementById("submitAddCar");
const searchCarInput = document.getElementById("searchCarInput");
const searchCarButton = document.getElementById("searchCarButton");

const API_BASE = "/carsdb"; // Базовый путь API

// Получение токена из localStorage
const AUTH_TOKEN = localStorage.getItem("token");

// Проверка авторизации
if (!AUTH_TOKEN) {
    alert("Вы не авторизованы. Перейдите на страницу входа.");
    window.location.href = "/static/html/login.html";
}

// Утилита для выполнения авторизованных запросов
async function authorizedFetch(url, options = {}) {
    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json"
    };

    const response = await fetch(url, options);

    // Проверка статуса 401 (неавторизован)
    if (response.status === 401) {
        alert("Сессия истекла. Пожалуйста, войдите снова.");
        window.location.href = "/static/html/login.html";
        return null;
    }

    // Дополнительная обработка других статусов ошибок
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Ошибка запроса:", errorData.detail);
        alert(`Ошибка: ${errorData.detail}`);
        return null;
    }

    return response;
}

async function loadCars() {
    const response = await authorizedFetch(`${API_BASE}/get_cars/`);

    if (!response || !response.ok) {
        console.error("Ошибка загрузки автомобилей:", response?.statusText);
        return;
    }

    const data = await response.json();

    if (data && Array.isArray(data.cars)) {
        const cars = data.cars;

        if (cars.length === 0) {
            carsList.innerHTML = "<li>Нет доступных автомобилей</li>";
        } else {
            carsList.innerHTML = "";
            cars.forEach(car => {
                const li = document.createElement("li");
                li.setAttribute("data-make", car.make);
                li.setAttribute("data-model", car.model);
                li.setAttribute("data-license", car.license_plate);
                li.innerHTML = `
                    <strong>${car.make} ${car.model}</strong>
                    <button class="expand">Данные</button>
                    <button class="green">Добавить регистрацию</button>
                    <button class="delete">Удалить</button>
                    <div class="car-details hidden">
                        <p>Марка: <strong>${car.make}</strong></p>
                        <p>Модель: <strong>${car.model}</strong></p>
                        <p>Номер: <strong>${car.license_plate}</strong></p>
                    </div>
                `;
                carsList.appendChild(li);

                li.querySelector(".expand").addEventListener("click", () => {
                    const details = li.querySelector(".car-details");
                    details.classList.toggle("hidden");
                });

                li.querySelector(".green").addEventListener("click", () => {
                    window.location.href = `/regdb/add_registration.html?license_plate=${car.license_plate}`;
                });

                li.querySelector(".delete").addEventListener("click", async () => {
                    if (confirm("Удалить автомобиль?")) {
                        const deleteResponse = await authorizedFetch(`${API_BASE}/delete_car/${car.license_plate}`, {
                            method: "DELETE"
                        });
                        if (deleteResponse && deleteResponse.ok) {
                            loadCars();
                        }
                    }
                });
            });
        }
    } else {
        console.error("Ответ сервера не содержит корректный список машин:", data);
        alert("Ошибка загрузки автомобилей.");
    }
}

addCarButton.addEventListener("click", () => {
    addCarForm.classList.toggle("hidden");
});


submitAddCar.addEventListener("click", async () => {
    const make = document.getElementById("newCarMake").value;
    const model = document.getElementById("newCarModel").value;
    const licensePlate = document.getElementById("newCarLicensePlate").value;

    if (make && model && licensePlate) {
        const response = await authorizedFetch(`${API_BASE}/add_car/`, {
            method: "POST",
            body: JSON.stringify({ make, model, license_plate: licensePlate })
        });

        if (response) {
            addCarForm.classList.add("hidden");
            loadCars();
        } else {
            alert("Ошибка добавления автомобиля.");
        }
    } else {
        alert("Введите марку, модель и номер автомобиля.");
    }
});


searchCarButton.addEventListener("click", () => {
    const query = searchCarInput.value.toLowerCase();
    const cars = document.querySelectorAll("li");
    let found = false;

    const noResultsMessage = document.querySelector(".no-results");
    if (noResultsMessage) {
        noResultsMessage.remove();
    }
    cars.forEach(car => {
        const make = car.getAttribute("data-make") || "";
        const model = car.getAttribute("data-model") || "";
        const licensePlate = car.getAttribute("data-license") || "";

        if (make.toLowerCase().includes(query) || model.toLowerCase().includes(query) || licensePlate.toLowerCase().includes(query)) {
            car.style.display = "";
            found = true;
        } else {
            car.style.display = "none";
        }
    });

    if (!found && query != "") {
        if (!document.querySelector(".no-results")) {
            const noResultsMessage = document.createElement("li");
            noResultsMessage.classList.add("no-results");
            noResultsMessage.textContent = "Автомобили не найдены.";
            carsList.appendChild(noResultsMessage);
        }
    }
});

loadCars();
