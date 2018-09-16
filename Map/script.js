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
                    'id': j,
                    'title': $(folders[i]).find('name').text(),
                    'subtitle': $(placemarks[j]).find('name').text(),
                    'description': $(placemarks[j]).find('description').text(),
                    'coords': $(placemarks[j]).find('Point coordinates').text().trim()
                });
            });
        });

        drawMarkers(map, markersData);
    });

    map.addListener('click', function(e) {
        activeMarker.setIcon(icon);
        activeMarker = null;
        $('#info').removeClass('minified').removeClass('open');
    });

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
        marker.addListener('click', function() {
            let $info = $('#info');

            if (activeMarker != null) {
                activeMarker.setIcon(icon);
            }
            marker.setIcon(activeIcon);
            activeMarker = marker;
            map.panTo(position);

            if (!$info.hasClass('open')) {
                $info.addClass('minified');
            }
        });

    });
}

$(function() {
    initMap();
});