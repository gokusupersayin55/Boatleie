// Listen over kommuner i Norge
const kommuner = [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Kristiansand", 
    "Drammen", "Fredrikstad", "Sandnes", "Tromsø", "Sarpsborg",
    "Skien", "Bodø", "Ålesund", "Tønsberg", "Moss"
];

// Lokasjonsfeltet og forslagselementet
const lokasjonInput = document.getElementById('lokasjon');
const suggestions = document.getElementById('location-suggestions');

// Funksjon for å vise kommune-forslag basert på input
lokasjonInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();

    // Sjekk om minst 3 bokstaver er skrevet inn
    if (query.length >= 3) {
        // Filtrer kommuner basert på input
        const filteredKommuner = kommuner.filter(kommune => 
            kommune.toLowerCase().startsWith(query)
        );

        // Tøm tidligere forslag
        suggestions.innerHTML = '';

        // Vis forslagene
        filteredKommuner.forEach(kommune => {
            const li = document.createElement('li');
            li.textContent = kommune;
            li.addEventListener('click', function () {
                // Når brukeren klikker på et forslag, sett verdien i input-feltet
                lokasjonInput.value = kommune;
                suggestions.innerHTML = ''; // Fjern forslagene
            });
            suggestions.appendChild(li);
        });

        // Hvis ingen forslag, skjul listen
        if (filteredKommuner.length === 0) {
            suggestions.innerHTML = '';
        }

    } else {
        // Skjul forslagene om mindre enn 3 bokstaver er skrevet inn
        suggestions.innerHTML = '';
    }
});

// Lukk forslagene om man klikker utenfor feltet
document.addEventListener('click', function (e) {
    if (!lokasjonInput.contains(e.target)) {
        suggestions.innerHTML = '';
    }
});

// Forhåndsvisning av bilder
const imageInput = document.getElementById('bilde');
const imagePreview = document.getElementById('image-preview');
const removeButton = document.getElementById('fjern-bilder');

imageInput.addEventListener('change', function () {
    imagePreview.innerHTML = ''; // Tøm tidligere forhåndsvisninger
    const files = Array.from(this.files);

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imagePreview.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
});

removeButton.addEventListener('click', function () {
    imageInput.value = '';
    imagePreview.innerHTML = ''; // Fjern alle forhåndsvisninger
});
