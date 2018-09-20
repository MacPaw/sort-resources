"use strict";

var map, markersData, activeMarker, browserGeoMarker, customGeoMarker,
    icon, activeIcon, ubsIcon, ubsActiveIcon,
    mapCenter = {lat: 50.456342579672736, lng: 30.54443421505789},
    defaultZoom = 10;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: defaultZoom,
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
            },
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [
                    { "visibility": "off" }
                ]
            }
        ]
    });

    icon = {
        anchor: new google.maps.Point(9, 9),
        size: new google.maps.Size(18, 17),
        url: 'https://macpaw.github.io/sort-resources/Map/images/marker.svg'
    };
    activeIcon = {
        anchor: new google.maps.Point(23, 23),
        size: new google.maps.Size(46, 46),
        url: 'https://macpaw.github.io/sort-resources/Map/images/marker-active.svg'
    };
    ubsIcon = {
        anchor: new google.maps.Point(9, 9),
        size: new google.maps.Size(18, 17),
        url: 'https://macpaw.github.io/sort-resources/Map/images/ubs-marker.svg'
    };
    ubsActiveIcon = {
        anchor: new google.maps.Point(23, 23),
        size: new google.maps.Size(46, 46),
        url: 'https://macpaw.github.io/sort-resources/Map/images/ubs-marker-active.svg'
    };

    // Parse the KML file and draw markers
    $.get('https://raw.githubusercontent.com/MacPaw/sort-resources/master/Map/map-data.kml', function(data) {
        markersData = [];
        var kmlData = new DOMParser().parseFromString(data,'text/xml');
        var folders = $(kmlData).find('Folder');
        folders.each(function(i) {
            var placemarks = $(folders[i]).find('Placemark');
            placemarks.each(function(j) {
                var descr = $(placemarks[j]).find('description').text();
                markersData.push({
                    'icon': i === 0 ? icon : ubsIcon,
                    'activeIcon': i === 0 ? activeIcon : ubsActiveIcon,
                    'title': $(folders[i]).find('>:first-child').text(),
                    'subtitle': $(placemarks[j]).find('name').text(),
                    'description': descr.replace('<br/><br />', '<br/>'),
                    'coords': $(placemarks[j]).find('Point coordinates').text().trim()
                });
            });
        });

        drawMarkers(markersData);
    });

    // Map click
    map.addListener('click', function() {
        if (activeMarker != null) {
            activeMarker.deactivate();
        }
        transitionInfoToState('closed');
    });

    // Info block top part touch
    $('#tap-area').on('touchend', function(e) {
        if ($('#info').hasClass('open')) {
            transitionInfoToState('minified');
        } else if ($('#info').hasClass('minified')) {
            transitionInfoToState('open');
        }
        return false;
    });

    // User location
    $('#location-center').on('touchend', function() {
        var $button = $(this);
        if ($button.hasClass('loading')) {
            return false;
        }

        var client = findGetParameter('client');
        if (client === "android") {
            if (browserGeoMarker === undefined || !browserGeoMarker.getPosition()) {
                initBrowserGeoMarker(map);
                $button.addClass('loading');
            } else {
                map.panTo(browserGeoMarker.getPosition());
                zoomInMap();
            }
        } else {
            $button.addClass('loading');
            window.location = "sort://update-location";
        }

        return false;
    });
}

function initBrowserGeoMarker(map) {
    browserGeoMarker = new GeolocationMarker(map);
    browserGeoMarker.setCircleOptions({
        fillOpacity: 0,
        strokeOpacity: 0
    });

    browserGeoMarker.addListener('position_changed', function() {
        if ($('#location-center').hasClass('loading')) {
            map.panTo(geoMarker.getPosition());
            $('#location-center').removeClass('loading');
            if (map.zoom < 12) {
                map.setZoom(12);
            }
        }
    });
}

function drawMarkers(markersData) {
    $(markersData).each(function(i) {
        var coords = markersData[i]['coords'].split(',');
        var position = new google.maps.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            icon: markersData[i]['icon']
        });

        // Handle marker click
        marker.addListener('click', function() {
            var $info = $('#info');

            if (activeMarker != null) {
                activeMarker.deactivate();
            }
            marker.setIcon(markersData[i]['activeIcon']);
            activeMarker = marker;

            // Fill the bottom info block
            var data = markersData[i];
            var $description = $info.find('#description')
            $info.find('#title').text(data['title']);
            $info.find('#subtitle').text(data['subtitle']);
            $description.html(data['description']);

            var link = 'sort://open?lat=' + coords[1] + '&lng=' + coords[0] + '&title=' + data['subtitle'];
            $description.html('<a href="' + link + '"' + onclick + '>Прокласти маршрут</a><br/><br/>' + $description.html());

            if (!$info.hasClass('open')) {
                transitionInfoToState('minified');
                map.panTo(position);
                zoomInMap();
            } else {
                $info.css('height', $('#tap-area').outerHeight() + $('#description').outerHeight());
            }
        });

        marker.deactivate = function() {
            marker.setIcon(markersData[i]['icon']);
            activeMarker = null
        }
    });
}

function zoomInMap() {
    if (map.zoom < 13) {
        map.setZoom(13);
    }
}

function resetMap() {
    transitionInfoToState('closed');
    map.panTo(mapCenter);
    map.setZoom(defaultZoom);
    if (activeMarker != null) {
        activeMarker.deactivate();
    }
}

function transitionInfoToState(state) {
    var $info = $('#info');
    switch (state) {
        case 'closed':
            $info.removeClass('open').removeClass('minified');
            $info.css('height', 0);
            break;
        case 'minified':
            if ($info.hasClass('open')) {
                $info.removeClass('open').addClass('closing');
                setTimeout(function() {
                    $info.removeClass('closing');
                }, 300);
            }
            $info.addClass('minified');
            $info.css('height', $('#tap-area').outerHeight());
            break;
        case 'open':
            $info.addClass('open');
            $info.css('height', $('#tap-area').outerHeight() + $('#description').outerHeight());
            break;
    }
}

function drawUserLocation(lat, lng) {
    if (customGeoMarker === undefined) {
        customGeoMarker = new google.maps.Marker({
            map: map,
            position: {lat: 0, lng: 0},
            icon: {
                anchor: new google.maps.Point(9, 9),
                size: new google.maps.Size(18, 17),
                url: 'https://macpaw.github.io/sort-resources/Map/images/user-marker.svg'
            }
        });
    }

    if (lat !== undefined && lng !== undefined) {
        customGeoMarker.setPosition({lat: lat, lng: lng});
    }
}

$(window).bind("load", function() {
    initMap();
});