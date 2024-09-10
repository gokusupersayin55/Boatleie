// Funksjon for å registrere en båt
document.getElementById('boatForm')?.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        location: formData.get('location'),
        description: formData.get('description'),
        price: formData.get('price'),
        images: formData.get('images').split(','),
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

// Funksjon for å hente båter og vise dem på "bater.html"
async function fetchBoats() {
    try {
        const response = await fetch('http://localhost:5000/api/boats');
        const boats = await response.json();
        
        const boatList = document.getElementById('boatList');
        boats.forEach(boat => {
            const boatItem = document.createElement('div');
            boatItem.classList.add('boat-item');
            boatItem.innerHTML = `
                <h3>${boat.name}</h3>
                <p>${boat.description}</p>
                <p>Lokasjon: ${boat.location}</p>
                <p>Pris: ${boat.price} NOK per dag</p>
                <p>Størrelse: ${boat.size} meter</p>
                <img src="${boat.images[0]}" alt="Bilde av ${boat.name}">
            `;
            boatList.appendChild(boatItem);
        });
    } catch (error) {
        console.error('Feil ved henting av båter:', error);
    }
}

// Kjør fetchBoats på bater.html
if (document.getElementById('boatList')) {
    fetchBoats();
}
