// Funksjon for å registrere båt
document.getElementById('boatForm')?.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        location: formData.get('location'),
        description: formData.get('description'),
        price: formData.get('price'),
        images: formData.get('images').split(','), // Splitter URL-ene ved komma
        size: formData.get('size')
    };

    try {
        const response = await fetch('http://localhost:5000/api/boats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        alert('Båt registrert: ' + result.name);
    } catch (error) {
        console.error('Feil ved registrering av båt:', error);
    }
});

// Funksjon for å hente båter fra backend
async function fetchBoats() {
    try {
        const response = await fetch('http://localhost:5000/api/boats'); // Endre til riktig backend-URL hvis nødvendig
        const boats = await response.json();

        // Kall funksjonen for å vise båtene
        displayBoats(boats);
    } catch (error) {
        console.error('Feil ved henting av båter:', error);
    }
}

// Funksjon for å vise båtene på siden
function displayBoats(boats) {
    const boatsContainer = document.getElementById('boats-container');

    // Tømmer containeren før vi legger til nye båter
    boatsContainer.innerHTML = '';

    // Gå gjennom hver båt og opprett HTML for den
    boats.forEach(boat => {
        const boatElement = document.createElement('div');
        boatElement.classList.add('boat-item');

        boatElement.innerHTML = `
            <h3>${boat.name}</h3>
            <p><strong>Lokasjon:</strong> ${boat.location}</p>
            <p><strong>Beskrivelse:</strong> ${boat.description}</p>
            <p><strong>Pris:</strong> ${boat.price} NOK per dag</p>
            <p><strong>Størrelse:</strong> ${boat.size}</p>
            <div class="boat-images">
                ${boat.images.map(image => `<img src="${image}" alt="Bilde av ${boat.name}" />`).join('')}
            </div>
        `;

        boatsContainer.appendChild(boatElement);
    });
}

// Kall funksjonen når siden lastes for å hente båtene
fetchBoats();