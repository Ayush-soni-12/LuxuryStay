
  window.initMap = function () {
    try{
    const locationInput = document.getElementById('location');
    const autocomplete = new google.maps.places.Autocomplete(locationInput, {
      types: ['(cities)'],
      fields: ['formatted_address', 'geometry', 'name']
    });
    
    // Prevent form submission when selecting a place
    autocomplete.addListener('place_changed', function() {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        locationInput.placeholder = "Enter a city";
      }
    })
}
catch(err){
    console.error("Map initialization failed:", err);
}
  }
  
  // Load Google Maps API asynchronously
  function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCarHW4XK2XEoEHf7dDjxYzVhDAhaIkaRA&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  
  // Load everything when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    
    // Load Google Maps after everything else is ready
    loadGoogleMaps();
  });