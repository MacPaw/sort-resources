"use strict";

$(window).bind("load", function() {
    initMap();
});

// ----------------------- Global vars -----------------------

var map, allMarkers, allMarkersBounds, activeMarker, browserGeoMarker, browserMarkerNeedsCentering,
    customGeoMarker, customAccuracyMarker,
    appVersion, client,
    defaultZoom = 10;

// ----------------------- Map init -----------------------

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: defaultZoom,
        disableDefaultUI: true,
        styles: mapStyles
    });

    appVersion = findGetParameter('version');
    client = findGetParameter('client');

    loadMapData(function() {
        browserMarkerNeedsCentering = false;

        // Activate a certain marker if needed
        var activateMarkerCoords = findGetParameter('activateMarker');

        // Center map on user location if needed
        var initialUserPosition = findGetParameter('coord');

        if (activateMarkerCoords != null) {
            var marker = allMarkers[activateMarkerCoords];
            if (marker !== undefined) {
                marker.activate();
            }
        } else if (initialUserPosition != null) {
            var locationItems = initialUserPosition.split(',');
            drawUserLocation(parseFloat(locationItems[0]), parseFloat(locationItems[1]), parseFloat(locationItems[2]));
        } else {
            map.fitBounds(allMarkersBounds);
        }
    });

    // Map click
    map.addListener('click', function() {
        if (activeMarker != null) {
            activeMarker.deactivate();
        }
        transitionInfoToState('closed');
    });

    // Map did zoom
    map.addListener('zoom_changed', function() {
        drawAccuracy();
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
        if (client === "ios") {
            window.location = "sort://update-location";
        } else {
            if (browserGeoMarker === undefined || !browserGeoMarker.getPosition()) {
                initBrowserGeoMarker(map);
            } else {
                map.panTo(browserGeoMarker.getPosition());
                zoomInMap();
            }
        }

        return false;
    });
}

// ----------------------- Helper functions -----------------------

function loadMapData(callback) {

    $.get('https://raw.githubusercontent.com/MacPaw/sort-resources/master/Map/map-data.json', function(data) {

        allMarkers = [];
        allMarkersBounds = new google.maps.LatLngBounds();
        var operatorsData = data['operators'],
            locationsData = data['locationData'];

        for (var i in locationsData) {
            var group = locationsData[i];

            // Name of the location based on the operator
            var locationName = operatorsData.filter(function(obj) {
                return obj['id'] === group['operator'];
            })[0]['locationName'];

            for (var j in group['locations']) {
                var location = group['locations'][j];
                if (location['isHidden'] == 1)
                    continue;

                var stringCoords = location['coordinates'].split(','),
                    latLng = new google.maps.LatLng(parseFloat(stringCoords[0]), parseFloat(stringCoords[1])),
                    isMobile = (location['isMobile'] == 1),
                    icon = {
                        anchor: new google.maps.Point(9, 9),
                        size: new google.maps.Size(18, 17),
                        url: 'https://macpaw.github.io/sort-resources/Map/images/marker.svg'
                    },
                    activeIcon = {
                        anchor: new google.maps.Point(23, 23),
                        size: new google.maps.Size(46, 46),
                        url: 'https://macpaw.github.io/sort-resources/Map/images/' +
                            (isMobile ? 'mobile-' : '') +
                            'marker-active.svg'
                    };

                // Init google maps object
                var marker = new google.maps.Marker({
                    map: map,
                    position: latLng,
                    icon: icon,
                    zIndex: 10
                });

                // Store for later use
                marker.inactiveIcon = icon;
                marker.activeIcon = activeIcon;
                marker.isMobile = isMobile;
                marker.name = locationName === undefined ? "" : locationName;
                marker.address = location['address'] === undefined ? "" : location['address'];
                marker.description = location['description'] === undefined ? "" : location['description'];

                marker.activate = function() {
                    var $info = $('#info');

                    if (activeMarker != null) {
                        activeMarker.deactivate();
                    }
                    this.setIcon(this.activeIcon);
                    activeMarker = this;

                    // Fill the bottom info block
                    var $description = $info.find('#description');
                    $info.find('#title').text(this.name);
                    $info.find('#subtitle').text(this.address);

                    if (!this.isMobile) {
                        var link = 'sort://open?lat=' + this.position.lat() + '&lng=' + this.position.lng() + '&title=' + this.address;
                        $description.html('<a href="' + link + '">Прокласти маршрут</a><br/><br/>' + this.description);
                    } else {
                        $description.html(this.description);
                    }

                    if (!$info.hasClass('open')) {
                        transitionInfoToState('minified');
                        map.panTo(this.position);
                        zoomInMap();
                    } else {
                        $info.css('height', $('#tap-area').outerHeight() + $('#description').outerHeight());
                    }
                };

                marker.deactivate = function() {
                    this.setIcon(this.inactiveIcon);
                    activeMarker = null
                };

                marker.addListener('click', function() {
                    this.activate();
                });

                allMarkers[location['coordinates']] = marker;
                allMarkersBounds.extend(marker.position);
            }
        }

        callback();
    }, 'json');
}

function initBrowserGeoMarker() {
    browserGeoMarker = new GeolocationMarker(map);
    browserGeoMarker.setCircleOptions({
        fillOpacity: 0,
        strokeOpacity: 0
    });
    browserMarkerNeedsCentering = true;

    browserGeoMarker.addListener('position_changed', function() {
        if (browserMarkerNeedsCentering) {
            map.panTo(browserGeoMarker.getPosition());
            zoomInMap();
            browserMarkerNeedsCentering = false
        }
    });
}

function zoomInMap() {
    if (map.zoom < 13) {
        map.setZoom(13);
    }
}

function getScale(latLng) {
    var zoom = map.zoom + 1;
    return 156543.03392 * Math.cos(latLng.lat() * Math.PI / 180) / Math.pow(2, zoom)
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

function drawAccuracy() {
    if (customAccuracyMarker !== undefined) {
        var position = customAccuracyMarker.getPosition();
        var scale = getScale(position);
        var accuracyDiameter = customAccuracyMarker.accuracy / scale;
        var icon = {
            anchor: new google.maps.Point(accuracyDiameter/2, accuracyDiameter/2),
            scaledSize: new google.maps.Size(accuracyDiameter, accuracyDiameter),
            url: 'https://macpaw.github.io/sort-resources/Map/images/precision.svg'
        };
        customAccuracyMarker.setIcon(icon);
    }
}

// ----------------------- Used by clients -----------------------

function drawUserLocation(lat, lng, accuracy) {
    if (customGeoMarker === undefined) {
        customGeoMarker = new google.maps.Marker({
            map: map,
            position: {lat: 0, lng: 0},
            zIndex: 1,
            icon: {
                anchor: new google.maps.Point(9, 9),
                size: new google.maps.Size(18, 17),
                url: 'https://macpaw.github.io/sort-resources/Map/images/user-marker.svg'
            }
        });
    }

    if (lat !== undefined || lng !== undefined) {
        var position = new google.maps.LatLng(lat, lng);
        customGeoMarker.setPosition(position);
        map.panTo(position);
        zoomInMap();

        if (customAccuracyMarker !== undefined) {
            customAccuracyMarker.setPosition(position);
        }

        if (accuracy !== undefined) {
            if (customAccuracyMarker === undefined) {
                customAccuracyMarker = new google.maps.Marker({
                    map: map,
                    position: {lat: 0, lng: 0},
                    zIndex: 0,
                    icon: icon
                });
                customAccuracyMarker.setPosition(position);
            }
            customAccuracyMarker.accuracy = accuracy;

            drawAccuracy();
        }
    }
}

function resetMap() {
    transitionInfoToState('closed');
    map.fitBounds(allMarkersBounds);
    if (activeMarker != null) {
        activeMarker.deactivate();
    }
}

function activateMarker(coords) {
    var marker = allMarkers[coords];
    if (marker !== undefined) {
        marker.activate();
    }
}