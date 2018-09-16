var markersData, activeMarker,
    icon = {
        anchor: new google.maps.Point(9, 9),
        size: new google.maps.Size(18, 17),
        url: 'Map/marker.svg'
    },
    activeIcon = {
        anchor: new google.maps.Point(23, 23),
        size: new google.maps.Size(46, 46),
        url: 'Map/marker-active.svg'
    };

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 50.456342579672736, lng: 30.54443421505789},
        zoom: 12,
        disableDefaultUI: true,
        styles: [
            {
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f5f5f5"
                    }
                ]
            },
            {
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#a6a6a6"
                    }
                ]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#f5f5f5"
                    }
                ]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#a6a6a6"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#d4efeb"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#a6a6a6"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#d4efeb"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#a6a6a6"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#a6a6a6"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#a6a6a6"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#a6a6a6"
                    }
                ]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#e5e5e5"
                    }
                ]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#eeeeee"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#93d6d4"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            }
        ]
    });

    // Parse the KML file and draw markers
    $.get('https://raw.githubusercontent.com/MacPaw/sort-resources/master/Map/map-data.kml', function(data) {
        markersData = [];
        let kmlData = new DOMParser().parseFromString(data,'text/xml');
        let folders = $(kmlData).find('Folder');
        folders.each(function(i) {
            let placemarks = $(folders[i]).find('Placemark');
            placemarks.each(function(j) {
                markersData.push({
                    'title': $(folders[i]).find('>:first-child').text(),
                    'subtitle': $(placemarks[j]).find('name').text(),
                    'description': $(placemarks[j]).find('description').text(),
                    'coords': $(placemarks[j]).find('Point coordinates').text().trim()
                });
            });
        });

        drawMarkers(map, markersData);
    });

    map.addListener('touchend', function(e) {
        activeMarker.setIcon(icon);
        activeMarker = null;
        $('#info').removeClass('minified').removeClass('open');
    });

    $('#tap-area').on('touchend', function() {
        $('#info').toggleClass('open');
    });

    infoWindow = new google.maps.InfoWindow;

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            infoWindow.open(map);
            map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

function drawMarkers(map, markersData) {
    $(markersData).each(function(i) {
        let coords = markersData[i]['coords'].split(',');
        let position = new google.maps.LatLng(parseFloat(coords[1]), parseFloat(coords[0]))
        let marker = new google.maps.Marker({
            map: map,
            position: position,
            icon: icon
        });

        // Handle marker click
        marker.addListener('touchend', function() {
            let $info = $('#info');

            if (activeMarker != null) {
                activeMarker.setIcon(icon);
            }
            marker.setIcon(activeIcon);
            activeMarker = marker;

            // Fill the bottom info block
            let data = markersData[i];
            console.log(data);
            $info.find('#title').text(data['title']);
            $info.find('#subtitle').text(data['subtitle']);
            $info.find('#description').html(data['description']);

            if (!$info.hasClass('open')) {
                $info.addClass('minified');
                map.panTo(position);
            }

        });

    });
}

function transitionInfoToState(state) {
    let $info = $('#info');
    switch (state) {
        case 'closed':
            $info.removeClass('open').removeClass('minified');
            $info.css('height', 0)
    }
}

$(function() {
    initMap();
});