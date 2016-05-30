// 1
//Sticky header pgugin init
$('header').sticky();


// 2
//Google Map with the place marker on CONTACT page
function initMap() {
  var myLatLng = {lat: 54.6793, lng: 25.2845};
  var mapDiv = document.getElementById('map');
  var map = new google.maps.Map(mapDiv, {
    center: myLatLng,
    zoom: 16
  });
  var marker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    title: 'ADS'
  });
}


// 3
// When the user clicks on the button, toggle between hiding and showing the dropdown content
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}
// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}


// 4
// Remove/add .selected class to nav a
switch(window.location.pathname) {
  case '/':
    document.getElementById("all").classList.add("selected");
    break;
  case '/realizations':
    document.getElementById("realizations").classList.add("selected");
    break;
  case '/competitions':
    document.getElementById("competitions").classList.add("selected");
    break;
  case '/projects':
    document.getElementById("projects").classList.add("selected");
    break;
  case '/about':
    document.getElementById("about").classList.add("selected");
    break;
  case '/contact':
    document.getElementById("contact").classList.add("selected");
    break;
}
