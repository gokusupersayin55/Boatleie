document.addEventListener('DOMContentLoaded', function () {
    // Listen over norske kommuner
    const kommuner = [
        "Alstahaug", "Alta", "Alvdal", "Alver", "Andøy", "Aremark", "Arendal", "Asker", "Askvoll", "Askøy",
        "Aukra", "Aure", "Aurland", "Aurskog-Høland", "Austevoll", "Austrheim", "Averøy", "Balsfjord", "Bamble",
        "Bardu", "Beiarn", "Berg", "Bergen", "Berlevåg", "Bindal", "Birkenes", "Bjerkreim", "Bjornafjorden", "Bjugn",
        "Bodø", "Bokn", "Bremanger", "Brønnøy", "Bygland", "Bykle", "Bærum", "Bø", "Bømlo", "Båtsfjord",
        "Dovre", "Drammen", "Drangedal", "Dyrøy", "Dønna", "Eidfjord", "Eidskog", "Eidsvoll", "Eigersund", "Elverum",
        "Enebakk", "Engerdal", "Etne", "Etnedal", "Evenes", "Evje og Hornnes", "Farsund", "Fauske", "Fedje", "Finnøy",
        "Fitjar", "Fjaler", "Fjord", "Flakstad", "Flatanger", "Flekkefjord", "Flesberg", "Flora", "Flå", "Folldal",
        "Fredrikstad", "Frogn", "Froland", "Frosta", "Frøya", "Fyresdal", "Færder", "Gamvik", "Gausdal", "Gildeskål",
        "Giske", "Gjemnes", "Gjerdrum", "Gjerstad", "Gjesdal", "Gjøvik", "Gloppen", "Gol", "Gran", "Grane",
        "Gratangen", "Grimstad", "Grong", "Grue", "Gulen", "Hadsel", "Halden", "Hamar", "Hamarøy", "Hammerfest",
        "Hareid", "Harstad", "Hasvik", "Hattfjelldal", "Haugesund", "Heim", "Hemnes", "Hemsedal", "Herøy i Møre", "Herøy i Nordland",
        "Hitra", "Hjartdal", "Hjelmeland", "Hol", "Hole", "Holmestrand", "Holtålen", "Horten", "Hurdal", "Hustadvika",
        "Hvaler", "Hyllestad", "Hægebostad", "Høyanger", "Høylandet", "Hå", "Ibestad", "Inderøy", "Indre Fosen", "Indre Østfold",
        "Iveland", "Jevnaker", "Jondal", "Karasjok", "Karlsøy", "Karmøy", "Kautokeino", "Klepp", "Kongsberg", "Kongsvinger",
        "Kragerø", "Kristiansand", "Kristiansund", "Krødsherad", "Kvam herad", "Kvinesdal", "Kvinnherad", "Kviteseid", "Kvitsøy", "Kvæfjord",
        "Kvænangen", "Kåfjord", "Larvik", "Lavangen", "Lebesby", "Leirfjord", "Leka", "Lenvik", "Lesja", "Levanger",
        "Lier", "Lierne", "Lillehammer", "Lillesand", "Lillestrøm", "Lindesnes", "Lom", "Longyearbyen", "Loppa", "Lund",
        "Lunner", "Lurøy", "Luster", "Lyngdal", "Lyngen", "Lærdal", "Lødingen", "Lørenskog", "Løten", "Malvik",
        "Marker", "Masfjorden", "Melhus", "Meløy", "Meråker", "Midt-Telemark", "Midtre Gauldal", "Modalen", "Modum", "Molde",
        "Moskenes", "Moss", "Målselv", "Måsøy", "Namsos", "Namsskogan", "Nannestad", "Narvik", "Nes", "Nesbyen",
        "Nesna", "Nesodden", "Nesseby", "Nissedal", "Nittedal", "Nome", "Nord-Aurdal", "Nord-Fron", "Nord-Odal", "Nordkapp",
        "Nordre Follo", "Nordre Land", "Nordreisa", "Nore og Uvdal", "Notodden", "Nærøysund", "Odda", "Oppdal", "Orkland", "Os",
        "Osen", "Oslo", "Osterøy", "Overhalla", "Porsanger", "Porsgrunn", "Rakkestad", "Rana", "Randaberg", "Rauma",
        "Rendalen", "Rennebu", "Rennesøy", "Rindal", "Ringebu", "Ringerike", "Ringsaker", "Risør", "Rollag", "Rælingen",
        "Rødøy", "Røros", "Røst", "Røyrvik", "Råde", "Salangen", "Saltdal", "Samnanger", "Sande", "Sandefjord",
        "Sandnes", "Sarpsborg", "Sauda", "Sel", "Selbu", "Seljord", "Sigdal", "Siljan", "Sirdal", "Skaun",
        "Skien", "Skiptvet", "Skjervøy", "Skjåk", "Smøla", "Snillfjord", "Snåsa", "Sogndal", "Sokndal", "Sola",
        "Solund", "Sortland", "Stad", "Stange", "Stavanger", "Steigen", "Steinkjer", "Stjørdal", "Stord", "Stor-Elvdal",
        "Storfjord", "Strand", "Stranda", "Stryn", "Sula", "Suldal", "Sunnfjord", "Sunndal", "Surnadal", "Sveio",
        "Sykkylven", "Sømna", "Søndre Land", "Sør-Aurdal", "Sørfold", "Sør-Fron", "Sør-Odal", "Sørreisa", "Sør-Varanger", "Tana",
        "Time", "Tingvoll", "Tinn", "Tjeldsund", "Tokke", "Tolga", "Torsken", "Tranøy", "Tromsø", "Trondheim",
        "Trysil", "Træna", "Tvedestrand", "Tydal", "Tynset", "Tysnes", "Tysvær", "Tønsberg", "Ullensaker", "Ullensvang",
        "Ulstein", "Ulvik", "Utsira", "Vadsø", "Vaksdal", "Valle", "Vang", "Vanylven", "Vardø", "Vefsn",
        "Vega", "Vegårshei", "Vennesla", "Verdal", "Vestby", "Vestnes", "Vestre Slidre", "Vestre Toten", "Vestvågøy", "Vevelstad",
        "Vik", "Vindafjord", "Vinje", "Volda", "Voss", "Værøy", "Vågan", "Vågsøy", "Vågå", "Våler i Hedmark",
        "Våler i Østfold", "Øksnes", "Ørland", "Ørsta", "Østre Toten", "Øvre Eiker", "Øyer", "Øygarden", "Øystre Slidre", "Åfjord",
        "Ål", "Ålesund", "Åmli", "Åmot", "Årdal", "Ås", "Åseral", "Åsnes"
    ];

    const locationInput = document.getElementById('lokasjon');
    const suggestionsList = document.createElement('ul');
    suggestionsList.id = 'location-suggestions';
    locationInput.parentNode.appendChild(suggestionsList);

    locationInput.addEventListener('input', function () {
        const inputValue = locationInput.value.toLowerCase();
        suggestionsList.innerHTML = '';

        if (inputValue.length >= 3) {
            const filteredKommuner = kommuner.filter(kommune => kommune.toLowerCase().includes(inputValue));

            filteredKommuner.forEach(kommune => {
                const suggestionItem = document.createElement('li');
                suggestionItem.textContent = kommune;
                suggestionItem.addEventListener('click', function () {
                    locationInput.value = kommune;
                    suggestionsList.innerHTML = '';
                });
                suggestionsList.appendChild(suggestionItem);
            });
        }
    });

    document.addEventListener('click', function (event) {
        if (!suggestionsList.contains(event.target) && event.target !== locationInput) {
            suggestionsList.innerHTML = '';
        }
    });
});
