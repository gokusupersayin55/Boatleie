// Funksjon for å registrere en båt
document.getElementById('boatForm')?.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('title'),
        location: formData.get('location'),
        description: formData.get('description'),
        price: formData.get('price'),
        images: Array.from(formData.getAll('images')),
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

// Funksjon for å vise opplastede bilder
document.getElementById('addImages')?.addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput')?.addEventListener('change', function(event) {
    const fileInput = event.target;
    const files = fileInput.files;
    const imagePreview = document.getElementById('imagePreview');
    
    imagePreview.innerHTML = '';
    
    Array.from(files).forEach(file => {
        if (['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreview.appendChild(img);
            };
            
            reader.readAsDataURL(file);
        } else {
            alert('Ugyldig filtype: ' + file.type);
        }
    });
});

// Autocomplete for kommunen
const locations = [
    'Alstahaug', 'Alta', 'Alvdal', 'AlverAndøy', 'Aremark', 'Arendal', 'AskerAskvoll', 'Askøy', 'AukraAure', 'Aurland',
    'Aurskog-HølandAustevoll', 'Austrheim', 'Averøy', 'Balsfjord', 'Bamble', 'Bardu', 'Beiarn', 'BergBergen', 'Berlevåg',
    'Bindal', 'Birkenes', 'BjerkreimBjornafjorden', 'Bjugn', 'Bodø', 'BoknBremanger', 'Brønnøy', 'Bygland', 'BykleBærum',
    'Bø', 'Bømlo', 'Båtsfjord', 'Dovre', 'Drammen', 'Drangedal', 'Dyrøy', 'Dønna', 'Eidfjord', 'Eidskog', 'Eidsvoll',
    'Eigersund', 'Elverum', 'Enebakk', 'Engerdal', 'Etne', 'Etnedal', 'Evenes', 'Evje og Hornnes', 'Farsund', 'Fauske',
    'Fedje', 'Finnøy', 'FitjarFjaler', 'Fjord', 'Flakstad', 'FlatangerFlekkefjord', 'Flesberg', 'Flora', 'FlåFolldal',
    'Fredrikstad', 'Frogn', 'FrolandFrosta', 'Frøya', 'Fyresdal', 'Færder', 'Gamvik', 'Gausdal', 'Gildeskål', 'GiskeGjemnes',
    'Gjerdrum', 'Gjerstad', 'GjesdalGjøvik', 'Gloppen', 'Gol', 'GranGrane', 'Gratangen', 'GrimstadGrong', 'Grue', 'Gulen',
    'Hadsel', 'Halden', 'Hamar', 'Hamarøy', 'Hammerfest', 'Hareid', 'HarstadHasvik', 'Hattfjelldal', 'Haugesund', 'Heim',
    'Hemnes', 'HemsedalHerøy i Møre', 'Herøy i Nordland', 'Hitra', 'Hjartdal', 'Hjelmeland', 'HolHole', 'Holmestrand',
    'Holtålen', 'Horten', 'Hurdal', 'HustadvikaHvaler', 'Hyllestad', 'Hægebostad', 'Høyanger', 'Høylandet', 'Hå',
    'Ibestad', 'Inderøy', 'Indre Fosen', 'Indre Østfold', 'Iveland', 'Jevnaker', 'Jondal', 'Karasjok', 'Karlsøy', 'Karmøy',
    'Kautokeino', 'Klepp', 'Kongsberg', 'Kongsvinger', 'Kragerø', 'Kristiansand', 'Kristiansund', 'Krødsherad', 'Kvam herad',
    'Kvinesdal', 'Kvinnherad', 'Kviteseid', 'Kvitsøy', 'Kvæfjord', 'Kvænangen', 'Kåfjord', 'Larvik', 'Lavangen', 'Lebesby',
    'Leirfjord', 'Leka', 'Lenvik', 'Lesja', 'Levanger', 'Lier', 'Lierne', 'Lillehammer', 'Lillesand', 'Lillestrøm', 
    'Lindesnes', 'Lom', 'Longyearbyen', 'Loppa', 'Lund', 'Lunner', 'Lurøy', 'Luster', 'Lyngdal', 'Lyngen', 'Lærdal',
    'Lødingen', 'Lørenskog', 'Løten', 'Malvik', 'Marker', 'Masfjorden', 'Melhus', 'Meløy', 'Meråker', 'Midt-Telemark',
    'Midtre Gauldal', 'Modalen', 'Modum', 'Molde', 'Moskenes', 'Moss', 'Målselv', 'Måsøy', 'Namsos', 'Namsskogan',
    'Nannestad', 'Narvik', 'Nes', 'Nesbyen', 'Nesna', 'Nesodden', 'Nesseby', 'Nissedal', 'Nittedal', 'Nome', 'Nord-Aurdal',
    'Nord-Fron', 'Nord-Odal', 'Nordkapp', 'Nordre Follo', 'Nordre Land', 'Nordreisa', 'Nore og Uvdal', 'Notodden',
    'Nærøysund', 'Odda', 'Oppdal', 'Orkland', 'Os', 'Osen', 'Oslo', 'Osterøy', 'Overhalla', 'Porsanger', 'Porsgrunn',
    'Rakkestad', 'Rana', 'Randaberg', 'Rauma', 'Rendalen', 'Rennebu', 'Rennesøy', 'Rindal', 'Ringebu', 'Ringerike',
    'Ringsaker', 'Risør', 'Rollag', 'Rælingen', 'Rødøy', 'Røros', 'Røst', 'Røyrvik', 'Råde', 'Salangen', 'Saltdal',
    'Samnanger', 'Sande', 'Sandefjord', 'Sandnes', 'Sarpsborg', 'Sauda', 'Sel', 'Selbu', 'Seljord', 'Sigdal', 'Siljan',
    'Sirdal', 'Skaun', 'Skien', 'Skiptvet', 'Skjervøy', 'Skjåk', 'Smøla', 'Snillfjord', 'Snåsa', 'Sogndal', 'Sokndal',
    'Sola', 'Solund', 'Sortland', 'Stad', 'Stange', 'Stavanger', 'Steigen', 'Steinkjer', 'Stjørdal', 'Stord',
    'Stor-Elvdal', 'Storfjord', 'Strand', 'Stranda', 'Stryn', 'Sula', 'Suldal', 'Sunnfjord', 'Sunndal', 'Surnadal',
    'Sveio', 'Sykkylven', 'Sømna', 'Søndre Land', 'Sør-Aurdal', 'Sørfold', 'Sør-Fron', 'Sør-Odal', 'Sørreisa',
    'Sør-Varanger', 'Tana', 'Time', 'Tingvoll', 'Tinn', 'Tjeldsund', 'Tokke', 'Tolga', 'Torsken', 'Tranøy', 'Tromsø',
    'Trondheim', 'Trysil', 'Træna', 'Tvedestrand', 'Tydal', 'Tynset', 'Tysnes', 'Tysvær', 'Tønsberg', 'Ullensaker',
    'Ullensvang', 'Ulstein', 'Ulvik', 'Utsira', 'Vadsø', 'Vaksdal', 'Valle', 'Vang', 'Vanylven', 'Vardø', 'Vefsn',
    'Vega', 'Vegårshei', 'Vennesla', 'Verdal', 'Vestby', 'Vestnes', 'Vestre Slidre', 'Vestre Toten', 'Vestvågøy',
    'Vevelstad', 'Vik', 'Vindafjord', 'Vinje', 'Volda', 'Voss', 'Værøy', 'Vågan', 'Vågsøy', 'Vågå', 'Våler i Hedmark',
    'Våler i Østfold', 'Øksnes', 'Ørland', 'Ørsta', 'Østre Toten', 'Øvre Eiker', 'Øyer', 'Øygarden', 'Øystre Slidre',
    'Åfjord', 'Ål', 'Ålesund', 'Åmli', 'Åmot', 'Årdal', 'Ås', 'Åseral', 'Åsnes'
];

document.getElementById('location')?.addEventListener('input', function(event) {
    const query = event.target.value.toLowerCase();
    const suggestions = locations.filter(location => location.toLowerCase().includes(query));
    const list = document.getElementById('location-list');
    
    list.innerHTML = '';
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', function() {
            document.getElementById('location').value = suggestion;
            list.innerHTML = '';
        });
        list.appendChild(div);
    });
});
