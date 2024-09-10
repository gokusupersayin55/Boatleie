// Funksjon for å registrere en båt
document.getElementById('boatForm')?.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        location: formData.get('location'),
        description: formData.get('description'),
        priceDay: formData.get('priceDay'),
        priceHour: formData.get('priceHour'),
        size: formData.get('size') + ' fot',
        images: Array.from(formData.getAll('images[]'))
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

// Funksjon for å fylle dropdown-menyen med alle kommuner
async function populateLocations() {
    const locations = [
        "Alstahaug", "Alta", "Alvdal", "Alver", "Andøy", "Aremark", "Arendal", "Asker", "Askvoll", 
        "Askøy", "Aukra", "Aure", "Aurland", "Aurskog-Høland", "Austevoll", "Austrheim", "Averøy", 
        "Balsfjord", "Bamble", "Bardu", "Beiarn", "Berg", "Bergen", "Berlevåg", "Bindal", "Birkenes", 
        "Bjerkreim", "Bjørnafjorden", "Bjugn", "Bodø", "Bokn", "Bremanger", "Brønnøy", "Bygland", 
        "Bykle", "Bærum", "Bø", "Bømlo", "Båtsfjord", "Dovre", "Drammen", "Drangedal", "Dyrøy", "Dønna", 
        "Eidfjord", "Eidskog", "Eidsvoll", "Eigersund", "Elverum", "Enebakk", "Engerdal", "Etne", 
        "Etnedal", "Evenes", "Evje og Hornnes", "Farsund", "Fauske", "Fedje", "Finnøy", "Fitjar", 
        "Fjaler", "Fjord", "Flakstad", "Flatanger", "Flekkefjord", "Flesberg", "Flora", "Flå", "Folldal", 
        "Fredrikstad", "Frogn", "Froland", "Frosta", "Frøya", "Fyresdal", "Færder", "Gamvik", "Gausdal", 
        "Gildeskål", "Giske", "Gjemnes", "Gjerdrum", "Gjerstad", "Gjesdal", "Gjøvik", "Gloppen", "Gol", 
        "Gran", "Grane", "Gratangen", "Grimstad", "Grong", "Grue", "Gulen", "Hadsel", "Halden", "Hamar", 
        "Hamarøy", "Hammerfest", "Hareid", "Harstad", "Hasvik", "Hattfjelldal", "Haugesund", "Heim", 
        "Hemnes", "Hemsedal", "Herøy i Møre", "Herøy i Nordland", "Hitra", "Hjartdal", "Hjelmeland", 
        "Hol", "Hole", "Holmestrand", "Holtålen", "Horten", "Hurdal", "Hustadvika", "Hvaler", "Hyllestad", 
        "Hægebostad", "Høyanger", "Høylandet", "Hå", "Ibestad", "Inderøy", "Indre Fosen", "Indre Østfold", 
        "Iveland", "Jevnaker", "Jondal", "Karasjok", "Karlsøy", "Karmøy", "Kautokeino", "Klepp", 
        "Kongsberg", "Kongsvinger", "Kragerø", "Kristiansand", "Kristiansund", "Krødsherad", "Kvam herad", 
        "Kvinesdal", "Kvinnherad", "Kviteseid", "Kvitsøy", "Kvæfjord", "Kvænangen", "Kåfjord", "Larvik", 
        "Lavangen", "Lebesby", "Leirfjord", "Leka", "Lenvik", "Lesja", "Levanger", "Lier", "Lierne", 
        "Lillehammer", "Lillesand", "Lillestrøm", "Lindesnes", "Lom", "Longyearbyen", "Loppa", "Lund", 
        "Lunner", "Lurøy", "Luster", "Lyngdal", "Lyngen", "Lærdal", "Lødingen", "Lørenskog", "Løten", 
        "Malvik", "Marker", "Masfjorden", "Melhus", "Meløy", "Meråker", "Midt-Telemark", "Midtre Gauldal", 
        "Modalen", "Modum", "Molde", "Moskenes", "Moss", "Målselv", "Måsøy", "Namsos", "Namsskogan", 
        "Nannestad", "Narvik", "Nes", "Nesbyen", "Nesna", "Nesodden", "Nesseby", "Nissedal", "Nittedal", 
        "Nome", "Nord-Aurdal", "Nord-Fron", "Nord-Odal", "Nordkapp", "Nordre Follo", "Nordre Land", 
        "Nordreisa", "Nore og Uvdal", "Notodden", "Nærøysund", "Odda", "Oppdal", "Orkland", "Os", 
        "Osen", "Oslo", "Osterøy", "Overhalla", "Porsanger", "Porsgrunn", "Rakkestad", "Rana", "Randaberg", 
        "Rauma", "Rendalen", "Rennebu", "Rennesøy", "Rindal", "Ringebu", "Ringerike", "Ringsaker", 
        "Risør", "Rollag", "Rælingen", "Rødøy", "Røros", "Røst", "Røyrvik", "Råde", "Salangen", 
        "Saltdal", "Samnanger", "Sande", "Sandefjord", "Sandnes", "Sarpsborg", "Sauda", "Sel", 
        "Selbu", "Seljord", "Sigdal", "Siljan", "Sirdal", "Skaun", "Skien", "Skiptvet", "Skjervøy", 
        "Skjåk", "Smøla", "Snillfjord", "Snåsa", "Sogndal", "Sokndal", "Sola", "Solund", "Sortland", 
        "Stad", "Stange", "Stavanger", "Steigen", "Steinkjer", "Stjørdal", "Stord", "Stor-Elvdal", 
        "Storfjord", "Strand", "Stranda", "Stryn", "Sula", "Suldal", "Sunnfjord", "Sunndal", "Surnadal", 
        "Sveio", "Sykkylven", "Sømna", "Søndre Land", "Sør-Aurdal", "Sørfold", "Sør-Fron", "Sør-Odal", 
        "Sørreisa", "Sør-Varanger", "Tana", "Time", "Tingvoll", "Tinn", "Tjeldsund", "Tokke", "Tolga", 
        "Torsken", "Tranøy", "Tromsø", "Trondheim", "Trysil", "Træna", "Tvedestrand", "Tydal", 
        "Tynset", "Tysnes", "Tysvær", "Tønsberg", "Ullensaker", "Ullensvang", "Ulstein", "Ulvik", 
        "Utsira", "Vadsø", "Vaksdal", "Valle", "Vang", "Vanylven", "Vardø", "Vefsn", "Vega", 
        "Vegårshei", "Vennesla", "Verdal", "Vestby", "Vestnes", "Vestre Slidre", "Vestre Toten", 
        "Vestvågøy", "Vevelstad", "Vik", "Vindafjord", "Vinje", "Volda", "Voss", "Værøy", 
        "Vågan", "Vågsøy", "Vågå", "Våler i Hedmark", "Våler i Østfold", "Øksnes", "Ørland", 
        "Ørsta", "Østre Toten", "Øvre Eiker", "Øyer", "Øygarden", "Øystre Slidre", "Åfjord", 
        "Ål", "Ålesund", "Åmli", "Åmot", "Årdal", "Ås", "Åseral", "Åsnes"
    ];

    const locationInput = document.getElementById('location');
    const locationList = document.getElementById('location-list');

    locationInput.addEventListener('input', function() {
        const inputValue = this.value.toLowerCase();
        locationList.innerHTML = '';

        const filteredLocations = locations.filter(location =>
            location.toLowerCase().includes(inputValue)
        );

        filteredLocations.forEach(location => {
            const item = document.createElement('div');
            item.className = 'suggestion';
            item.textContent = location;
            item.addEventListener('click', function() {
                locationInput.value = location;
                locationList.innerHTML = '';
            });
            locationList.appendChild(item);
        });
    });
}

// Håndter bildeopplasting og forhåndsvisning
document.getElementById('addImages')?.addEventListener('click', function() {
    document.getElementById('images')?.click();
});

document.getElementById('images')?.addEventListener('change', function(event) {
    const files = event.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        if (['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) {
            const reader = new FileReader();

            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                img.className = 'preview-image';
                preview.appendChild(img);
            };

            reader.readAsDataURL(file);
        } else {
            alert('Ugyldig filtype: ' + file.type);
        }
    });
});

// Initialiser dropdown-meny med kommuner når siden lastes
window.addEventListener('DOMContentLoaded', populateLocations);
