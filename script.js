// Placeholder for future interactivity
console.log("Båtutleie Norge script aktivert");

// Simple filter functionality (not complete; for demonstration purposes)
document.getElementById('filterForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // Collect form data
    const price = document.getElementById('price').value;
    const location = document.getElementById('location').value;
    const size = document.getElementById('size').value;

    // Example filter logic (you need to implement this based on your data)
    console.log(`Filter applied: Price ${price}, Location ${location}, Size ${size}`);
});

// Google Maps initialization
function initMap() {
    // Example location: Oslo
    const oslo = { lat: 59.9139, lng: 10.7522 };
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: oslo
    });
    const marker = new google.maps.Marker({
        position: oslo,
        map: map,
        title: 'Oslo'
    });
}
