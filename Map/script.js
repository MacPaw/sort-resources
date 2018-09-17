var markersData, activeMarker, geoMarker,
    icon, activeIcon;

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 50.456342579672736, lng: 30.54443421505789},
        zoom: 10,
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

    icon = {
        anchor: new google.maps.Point(9, 9),
        size: new google.maps.Size(18, 17),
        url: 'Map/marker.svg'
    };
    activeIcon = {
        anchor: new google.maps.Point(23, 23),
        size: new google.maps.Size(46, 46),
        url: 'Map/marker-active.svg'
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
                    'title': $(folders[i]).find('>:first-child').text(),
                    'subtitle': $(placemarks[j]).find('name').text(),
                    'description': descr.replace('<br/><br />', '<br/>'),
                    'coords': $(placemarks[j]).find('Point coordinates').text().trim()
                });
            });
        });

        drawMarkers(map, markersData);
    });

    // Map click
    map.addListener('click', function(e) {
        activeMarker.setIcon(icon);
        activeMarker = null;
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

    $('#location-center').on('touchend', function() {
        if ($(this).hasClass('loading')) {
            return false;
        }

        if(geoMarker == undefined || !geoMarker.getPosition()) {
            initGeoMarker(map);
            $('#location-center').addClass('loading');
        } else {
            map.panTo(geoMarker.getPosition());
            if (map.zoom < 12) {
                map.setZoom(12);
            }
        }

        return false;
    });
}

function drawMarkers(map, markersData) {
    $(markersData).each(function(i) {
        var coords = markersData[i]['coords'].split(',');
        var position = new google.maps.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            icon: icon
        });

        // Handle marker click
        marker.addListener('click', function() {
            var $info = $('#info');

            if (activeMarker != null) {
                activeMarker.setIcon(icon);
            }
            marker.setIcon(activeIcon);
            activeMarker = marker;

            // Fill the bottom info block
            var data = markersData[i];
            $info.find('#title').text(data['title']);
            $info.find('#subtitle').text(data['subtitle']);
            $info.find('#description').html(data['description']);

            if (!$info.hasClass('open')) {
                transitionInfoToState('minified');
                map.panTo(position);
                if (map.zoom < 13) {
                    map.setZoom(13);
                }
            } else {
                $info.css('height', $('#tap-area').outerHeight() + $('#description').outerHeight());
            }
        });
    });
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

function initGeoMarker(map) {
    geoMarker = new GeolocationMarker(map);
    geoMarker.setCircleOptions({
        fillColor: '#448AFF',
        fillOpacity: 0.2,
        strokeColor: '#448AFF',
        strokeOpacity: 0.4,
        strokeWeight: 1
    });

    geoMarker.addListener('position_changed', function() {
        if ($('#location-center').hasClass('loading')) {
            map.panTo(geoMarker.getPosition());
            $('#location-center').removeClass('loading');
            if (map.zoom < 12) {
                map.setZoom(12);
            }
        }
    });
}

$(window).bind("load", function() {
    initMap();
});