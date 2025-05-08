// document.addEventListener('DOMContentLoaded', function () {
//     // Initialize Google Places Autocomplete
//     const locationInput = document.getElementById('location');
//     if (typeof google !== 'undefined') {
//         const autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
//             inputElement: locationInput, // Correctly pass the input element
//             types: ['(cities)'], // Restrict to cities
//         });

  
//       // Add a listener to handle the place selection
//     //   autocompleteElement.addListener('place_changed', () => {
//     //     const place = autocomplete.getPlace();
//     //     console.log('Selected place:', place);
//     //   });
//     }
  
//     // Initialize Flatpickr
//     const datePicker = flatpickr("#checkin, #checkout", {
//       mode: "range",
//       minDate: "today",
//       dateFormat: "M j, Y",
//       defaultDate: ["today", new Date().fp_incr(7)],
//       onClose: function (selectedDates) {
//         if (selectedDates.length === 2) {
//           document.getElementById('checkin').value = flatpickr.formatDate(selectedDates[0], "M j, Y");
//           document.getElementById('checkout').value = flatpickr.formatDate(selectedDates[1], "M j, Y");
//         }
//       },
//     });
  
//     // Guests Picker Functionality
//     const guestsModal = document.querySelector('.guests-picker-modal');
//     const guestsInput = document.getElementById('guests');
  
//     let adults = 1;
//     let children = 0;
//     let infants = 0;
  
//     function updateGuestDisplay() {
//       const total = adults + children;
//       let text = '';
  
//       if (adults > 0) text += `${adults} adult${adults !== 1 ? 's' : ''}`;
//       if (children > 0) text += `${text ? ', ' : ''}${children} child${children !== 1 ? 'ren' : ''}`;
//       if (infants > 0) text += `${text ? ', ' : ''}${infants} infant${infants !== 1 ? 's' : ''}`;
  
//       guestsInput.value = text || 'Add guests';
//       guestsInput.dataset.total = total;
//     }
  
//     // Open modal
//     document.querySelector('.guests-field').addEventListener('click', function (e) {
//       if (!e.target.classList.contains('airbnb-search-button')) {
//         guestsModal.style.display = 'block';
//       }
//     });
  
//     // Close modal
//     document.querySelector('.apply-guests').addEventListener('click', function () {
//       guestsModal.style.display = 'none';
//     });
  
//     // Handle increment/decrement
//     document.querySelectorAll('.increment').forEach((btn) => {
//       btn.addEventListener('click', function () {
//         const type = this.parentElement.querySelector('h4').textContent.toLowerCase();
//         if (type === 'adults') adults++;
//         if (type === 'children') children++;
//         if (type === 'infants') infants++;
//         updateCounts();
//       });
//     });
  
//     document.querySelectorAll('.decrement').forEach((btn) => {
//       btn.addEventListener('click', function () {
//         const type = this.parentElement.querySelector('h4').textContent.toLowerCase();
//         if (type === 'adults' && adults > 1) adults--;
//         if (type === 'children' && children > 0) children--;
//         if (type === 'infants' && infants > 0) infants--;
//         updateCounts();
//       });
//     });
  
//     function updateCounts() {
//       document.querySelectorAll('.count').forEach((el) => {
//         const type = el.closest('.guest-option').querySelector('h4').textContent.toLowerCase();
//         if (type === 'adults') el.textContent = adults;
//         if (type === 'children') el.textContent = children;
//         if (type === 'infants') el.textContent = infants;
//       });
//       updateGuestDisplay();
//     }
  
//     // Close modal when clicking outside
//     window.addEventListener('click', function (e) {
//       if (e.target === guestsModal) {
//         guestsModal.style.display = 'none';
//       }
//     });
//   });






// Initialize Flatpickr first (doesn't depend on Google Maps)
const datePicker = flatpickr("#checkin, #checkout", {
    mode: "range",
    minDate: "today",
    dateFormat: "M j, Y",
    defaultDate: ["today", new Date().fp_incr(7)],
    onClose: function(selectedDates) {
      if (selectedDates.length === 2) {
        document.getElementById('checkin').value = flatpickr.formatDate(selectedDates[0], "M j, Y");
        document.getElementById('checkout').value = flatpickr.formatDate(selectedDates[1], "M j, Y");
      }
    }
  });
  
  // Initialize Google Maps when API loads
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
    // Initialize guest picker functionality
    const guestsModal = document.querySelector('.guests-picker-modal');
    const guestsInput = document.getElementById('guests');
    
    let adults = 1, children = 0, infants = 0;
  
    function updateGuestDisplay() {
      const total = adults + children;
      let text = '';
      
      if (adults > 0) text += `${adults} adult${adults !== 1 ? 's' : ''}`;
      if (children > 0) text += `${text ? ', ' : ''}${children} child${children !== 1 ? 'ren' : ''}`;
      if (infants > 0) text += `${text ? ', ' : ''}${infants} infant${infants !== 1 ? 's' : ''}`;
      
      guestsInput.value = text || 'Add guests';
      guestsInput.dataset.total = total;
    }
  
    // Guest picker event handlers
    document.querySelector('.guests-field').addEventListener('click', function(e) {
      if (!e.target.classList.contains('airbnb-search-button')) {
        guestsModal.style.display = 'block';
      }
    });
  
    document.querySelector('.apply-guests').addEventListener('click', function() {
      guestsModal.style.display = 'none';
    });
  
    document.querySelectorAll('.increment').forEach(btn => {
      btn.addEventListener('click', function() {
        const type = this.parentElement.querySelector('h4').textContent.toLowerCase();
        if (type === 'adults') adults++;
        if (type === 'children') children++;
        if (type === 'infants') infants++;
        updateCounts();
      });
    });
  
    document.querySelectorAll('.decrement').forEach(btn => {
      btn.addEventListener('click', function() {
        const type = this.parentElement.querySelector('h4').textContent.toLowerCase();
        if (type === 'adults' && adults > 1) adults--;
        if (type === 'children' && children > 0) children--;
        if (type === 'infants' && infants > 0) infants--;
        updateCounts();
      });
    });
  
    function updateCounts() {
      document.querySelectorAll('.count').forEach(el => {
        const type = el.closest('.guest-option').querySelector('h4').textContent.toLowerCase();
        if (type === 'adults') el.textContent = adults;
        if (type === 'children') el.textContent = children;
        if (type === 'infants') el.textContent = infants;
      });
      updateGuestDisplay();
    }
  
    // Load Google Maps after everything else is ready
    loadGoogleMaps();
  });