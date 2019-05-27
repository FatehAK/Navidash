/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-unused-vars */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
import React from 'react';
import { Link } from 'react-router-dom';

//these variables include nested objects
let polygon = null;

let placeMarkers = [];

let placeInfoWindow;

let routeMarker;

let directionsDisplay;

let drawingManager;

//for ensuring functions are called only once
let carousel = false;

let sCalled = false;

let opened = false;

class App extends React.Component {

    constructor(props) {
        super(props);
        //retain object instance when used in the function
        this.textSearchPlaces = this.textSearchPlaces.bind(this);
    }

    componentDidMount() {
        let mapContainer = document.querySelector('.map-container');
        mapContainer.style.display = 'block';
    }

    componentWillUnmount() {
        let mapContainer = document.querySelector('.map-container');
        mapContainer.style.display = 'none';
        sCalled = false;
        this.clearAll();
    }

    initSearch() {
        sCalled = true
        let self = this;
        //for drawing polylines on the map
        if (!drawingManager) {
            drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_LEFT,
                    drawingModes: [
                        google.maps.drawing.OverlayType.POLYGON
                    ]
                },
                polygonOptions: {
                    fillColor: '#202020',
                    fillOpacity: 0.2,
                    strokeWeight: 3,
                    strokeColor: '#7447df',
                    clickable: false,
                    editable: true,
                }
            });
        }

        const drawBtn = document.querySelector('.draw-btn');
        drawBtn.addEventListener('click', function() {
            //initialize drawing mode only if not already drawing
            if (!drawingManager.map) {
                //set initial drawing mode
                drawingManager.setDrawingMode('polygon');
                drawingManager.setOptions({
                    drawingControl: true
                });
                drawingManager.setMap(myMap);
                self.drawPolygon(drawingManager);
            }
            //goto bounds of poly on subsequent clicks
            if (polygon) {
                myMap.fitBounds(self.getPolyBounds());
            }
        });

        const clearBtn = document.querySelector('.clear-btn');
        clearBtn.addEventListener('click', function() {
            self.clearAll();
        });

        //for the place search button
        const searchBtn = document.querySelector('.search-btn');
        searchBtn.addEventListener('click', self.textSearchPlaces);

        //for sidebar navigation
        const openNav = document.querySelector('.open-nav');
        openNav.addEventListener('click', self.toogleSide);

        const closeNav = document.querySelector('.close-nav');
        closeNav.addEventListener('click', function() {
            document.querySelector(".sidenav").style.width = "0";
            document.getElementById("main").style.marginLeft = "0";
            opened = false;
        });

        const directionCtn = document.querySelector('.direction-display');
        directionCtn.innerHTML = '<p class="direction-para">Select route to display directions<p>';
    }

    //toggle the sidebar visibility
    toogleSide() {
        if (!opened) {
            opened = true;
            document.querySelector(".sidenav").style.width = "350px";
            document.getElementById("main").style.marginLeft = "350px";
        } else {
            document.querySelector(".sidenav").style.width = "0";
            document.getElementById("main").style.marginLeft = "0";
            opened = false;
        }
    }

    //clear all data
    clearAll() {
        const searchInput = document.querySelector('.search-input');
        searchInput.setAttribute('placeholder', 'Click on the draw icon and define the region');
        searchInput.value = '';
        if (drawingManager) {
            if (drawingManager.map) {
                drawingManager.setMap(null);
                //get rid of the polygon too and clean the references
                if (polygon) {
                    polygon.setMap(null);
                    polygon = null;
                }
                this.hideMarkers();
            }
        }
        //clearing the set listeners and route marker
        if (routeMarker) {
            routeMarker.setMap(null);
            routeMarker = null;
        }
        google.maps.event.clearListeners(myMap, 'click');
        if (polygon) {
            google.maps.event.clearListeners(polygon, 'click');
        }
        this.resetState();
        if (opened) {
            document.querySelector(".sidenav").style.width = "0";
            document.getElementById("main").style.marginLeft = "0";
            opened = false;
        }
        const directionCtn = document.querySelector('.direction-display');
        directionCtn.innerHTML = '<p class="direction-para">Select route to display directions<p>';
    }

    //hiding our markers and cleaning the array
    hideMarkers() {
        for (let i = 0; i < placeMarkers.length; i++) {
            placeMarkers[i].setMap(null);
        }
        placeMarkers = [];
    }

    //reset our state on clear
    resetState() {
        carousel = false;
        if (placeInfoWindow) {
            google.maps.event.clearListeners(placeInfoWindow, 'domready');
        }
        if (directionsDisplay) {
            directionsDisplay.setMap(null);
            directionsDisplay = null;
        }
    }

    //calculates the bounds of the polygon
    getPolyBounds() {
        let polyBounds = new google.maps.LatLngBounds();
        polygon.getPath().forEach(function(element) {
            polyBounds.extend(element);
        });
        return polyBounds;
    }

    //draw the polygon on the map
    drawPolygon(drawingManager) {
        let self = this;

        google.maps.event.addListenerOnce(drawingManager, 'overlaycomplete', function(evt) {
            //once drawing is complete we go back to free hand movement mode
            drawingManager.setDrawingMode(null);
            drawingManager.setOptions({
                drawingControl: false
            });

            //creating an editable polygon
            polygon = evt.overlay;
            polygon.setEditable(true);

            //searchbox
            const searchInput = document.querySelector('.search-input');
            searchInput.setAttribute('placeholder', 'Search places eg. pizza, salon, rentals');

            let searchBox = new google.maps.places.SearchBox(searchInput);
            searchBox.setBounds(self.getPolyBounds());

            //this listener if for when the users select the place from the picklist
            searchBox.addListener('places_changed', function() {
                self.searchBoxPlaces(searchBox);
            });
            //redo the search if the polygon is edited
            polygon.getPath().addListener('set_at', function() {
                if (searchInput.value) {
                    self.textSearchPlaces();
                }
            });
            polygon.getPath().addListener('insert_at', function() {
                if (searchInput.value) {
                    self.textSearchPlaces();
                }
            });
        });
    }

    //search for markers in the polygon
    searchInPolygon() {
        //determines whether the location is found or not
        let found = false;
        for (let i = 0; i < placeMarkers.length; i++) {
            //check if the polygon encolses any markers
            if (google.maps.geometry.poly.containsLocation(placeMarkers[i].position, polygon)) {
                found = true;
                //display the enclosed markers
                placeMarkers[i].setMap(myMap);
            } else {
                //show atmost one marker even if its out of bounds
                if (placeMarkers.length === 1) {
                    found = true;
                    placeMarkers[0].setMap(myMap);
                } else {
                    //hide the rest
                    myMap.fitBounds(this.getPolyBounds());
                    placeMarkers[i].setMap(null);
                }
            }
        }
        if (!found) {
            //this alert occurs too fast so slow it down for polygon editing to complete
            setTimeout(() => alert('Please expand your selection or select new area'), 600);
        }
    }

    //function that handles the suggested place
    searchBoxPlaces(searchBox) {
        if (polygon) {
            //hide any place markers already set
            this.hideMarkers();
            //we get places from the searchbox
            let places = searchBox.getPlaces();
            //we create markers for the places
            this.createMarkersForPlaces(places);
            if (places.length === 0) {
                alert('No places found');
            }
        } else {
            const searchInput = document.querySelector('.search-input');
            searchInput.setAttribute('placeholder', 'Click on the draw icon and define the region');
            searchInput.value = '';
            alert('Please select area first');
        }
    }

    //display new places on resizing the polygon or on btn click
    textSearchPlaces() {
        let self = this;
        if (polygon) {
            //hide any place markers already set
            self.hideMarkers();
            const placesService = new google.maps.places.PlacesService(myMap);
            //initiate the place search
            let query = document.querySelector('.search-input').value
            if (query) {
                placesService.textSearch({
                    query: query,
                    bounds: self.getPolyBounds()
                }, function(results, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        self.createMarkersForPlaces(results);
                    } else {
                        alert('No places found');
                    }
                });
            } else {
                alert('Enter search query');
            }
        } else {
            const searchInput = document.querySelector('.search-input');
            searchInput.setAttribute('placeholder', 'Click on the draw icon and define the region');
            searchInput.value = '';
            alert('Please select area first');
        }
    }

    //function that creates markers for each place found in places search
    createMarkersForPlaces(places) {
        let self = this;
        //set marker bounds
        let bounds = new google.maps.LatLngBounds();

        for (let i = 0; i < places.length; i++) {
            let place = places[i];
            let icon = {
                url: place.icon,
                size: new google.maps.Size(35, 35),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(15, 34),
                scaledSize: new google.maps.Size(25, 25)
            };

            //create a marker for each place.
            let marker = new google.maps.Marker({
                icon: icon,
                title: place.name,
                position: place.geometry.location,
                id: place.place_id,
                animation: google.maps.Animation.DROP
            });

            placeMarkers.push(marker);

            //creating a shared place info window
            placeInfoWindow = new google.maps.InfoWindow();
            marker.addListener('click', function() {
                //avoid repeated opening of the placeInfoWindow
                if (placeInfoWindow.marker !== this) {
                    bounds.extend(this.position);
                    myMap.fitBounds(bounds);
                    myMap.setZoom(14);
                    self.getPlacesDetails(this, placeInfoWindow);
                }
                //clearing the set listeners
                self.resetState();
                document.querySelector(".sidenav").style.width = "0";
                document.getElementById("main").style.marginLeft = "0";
                opened = false;
            });

            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        }
        myMap.fitBounds(bounds);
        myMap.setZoom(14);

        //initiate the search once markers are added to array
        this.searchInPolygon();
    }

    //get more details on a particular place whose marker is clicked
    getPlacesDetails(marker, infoWindow) {
        let self = this;
        //setting marker bounce effect
        for (let i in placeMarkers) {
            //bounce only the marker which matches the current clicked marker
            if (placeMarkers[i].id === marker.id) {
                placeMarkers[i].setAnimation(google.maps.Animation.BOUNCE);
            } else {
                //if no match then reset other bouncy markers
                placeMarkers[i].setAnimation(null);
            }
        }

        //create a place service to get details on the places
        const service = new google.maps.places.PlacesService(myMap);
        service.getDetails({
            placeId: marker.id
        }, function(place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                infoWindow.marker = marker;

                let [photos, currentIndex] = self.populateInfoWindow(place, infoWindow);
                infoWindow.open(myMap, marker);

                //dynamically attach event listeners to btns once infowindow is ready
                google.maps.event.addListener(infoWindow, 'domready', function() {
                    //for the photo carousel
                    if (!carousel) {
                        self.initCarousel(photos, currentIndex);
                    }
                    //for fetching the street view
                    self.initStreetView(place, infoWindow);
                    //for checking marker and displaying the route
                    self.checkMarker(place, infoWindow);
                });

                //clearing marker on closing infowindow
                google.maps.event.addListenerOnce(infoWindow, 'closeclick', function() {
                    infoWindow.marker = null;
                    marker.setAnimation(null);
                    //clearing the set listeners
                    self.resetState();
                    document.querySelector(".sidenav").style.width = "0";
                    document.getElementById("main").style.marginLeft = "0";
                    opened = false;
                });
            }
        });
    }

    //function that builds the infowindow
    populateInfoWindow(place, infoWindow) {
        let innerHTML = `<div class="info-main">`;

        if (place.name) {
            innerHTML += `<div class="info-head">${place.name}</div>`;
        }
        if (place.formatted_address) {
            innerHTML += `<div class="info-address"><span>Address: </span>${place.formatted_address}</div>`;
        }
        if (place.formatted_phone_number) {
            innerHTML += `<div class="info-phn"><span>Phone: </span>${place.formatted_phone_number}</div>`;
        }
        if (place.rating) {
            innerHTML += `<div class="info-star">${place.rating}<li><i class="fa fa-star"></i></li></div>`;
        }
        if (place.reviews && place.url) {
            let review = [];
            place.reviews.forEach((element) => {
                review.push(element.text.split(' ').splice(0, 30));
            });
            //pad reviews with > 30 words
            let str = review[0].join(" ");
            if (str.split(' ').length >= 30) {
                innerHTML += `<div class="info-review">'${str.padEnd(str.length + 3, '.')}'<a class="info-link" href=${place.url} target="_blank">View more</a></div>`;
            } else {
                innerHTML += `<div class="info-review">'${str}'<a class="info-link" href=${place.url} target="_blank">View more</a></div>`;
            }
        }
        let photos = [];
        let currentIndex;
        if (place.photos) {
            place.photos.forEach((element) => {
                photos.push(element.getUrl({ maxHeight: 100, maxWidth: 200 }));
            });
            currentIndex = 0;
            innerHTML += `<div class="info-img-container"><button class="info-img-prev"><li><i class="fa fa-chevron-left"></i></li></button><img class="info-img" src="${photos[0]}" alt="No image available"><button class="info-img-next"><li><i class="fa fa-chevron-right"></i></li></button></div>`;
        }

        innerHTML += `<div class="info-btns"><button class="btn-street">Street View</button><button class="btn-route">Show route</button></div>`
        innerHTML += `</div>`;

        infoWindow.setContent(innerHTML);
        return [photos, currentIndex];
    }

    //function that implements the photo carousel
    initCarousel(photos, currentIndex) {
        const nextImage = document.querySelector('.info-img-next');
        const prevImage = document.querySelector('.info-img-prev');
        const infoImg = document.querySelector('.info-img');

        if (nextImage && prevImage && infoImg) {
            nextImage.addEventListener('click', function() {
                if (currentIndex < photos.length - 1) {
                    let nextIndex = currentIndex + 1;
                    infoImg.src = photos[nextIndex];
                    currentIndex = nextIndex;
                }
            });
            prevImage.addEventListener('click', function() {
                if (currentIndex > 0) {
                    let prevIndex = currentIndex - 1;
                    infoImg.src = photos[prevIndex];
                    currentIndex = prevIndex;
                }
            });
        }
    }

    //functions that starts and embeds the street view
    initStreetView(place, infoWindow) {
        let self = this;
        const streetBtn = document.querySelector('.btn-street');

        if (streetBtn) {
            streetBtn.addEventListener('click', function() {
                carousel = true;
                let streetViewService = new google.maps.StreetViewService();
                //get the nearest street view from position at radius of 50 meters
                let radius = 50;
                //this function is used to get panorama shot for the given location
                streetViewService.getPanoramaByLocation(place.geometry.location, radius, function(data, status) {
                    if (status === google.maps.StreetViewStatus.OK) {
                        //the location
                        let location = data.location.latLng;
                        let heading = google.maps.geometry.spherical.computeHeading(location, place.geometry.location);
                        infoWindow.setContent(`<div class="street-main"><div class="street-top"><button class="back-btn"><li><i class="fa fa-arrow-left"></i></li></button><div class="street-head">${place.name}</div></div><div class="street-info">Nearest Streetview</div><div class="street-pano"><div id="pano"></div></div></div>`);
                        let panoramaOptions = {
                            position: location,
                            pov: {
                                heading: heading,
                                pitch: 10
                            },
                            controlSize: 27,
                            motionTrackingControl: false,
                            motionTracking: false,
                            linksControl: false,
                            panControl: false,
                            enableCloseButton: false
                        };
                        let panorama = new google.maps.StreetViewPanorama(document.querySelector('#pano'), panoramaOptions);
                    } else {
                        infoWindow.setContent(`<button class="back-btn"><li><i class="fa fa-arrow-left"></i></li></button><span class="street-head">${place.name}</span><p align="center">No Street View Found</p>`);
                    }
                    //for the back btn
                    const backBtn = document.querySelector('.back-btn');
                    if (backBtn) {
                        backBtn.addEventListener('click', function() {
                            carousel = false;
                            self.populateInfoWindow(place, infoWindow);
                        });
                    }
                });
            });
        }
    }

    //function that handles whether marker should be created or not
    checkMarker(place, infoWindow) {
        let self = this;
        const btnRoute = document.querySelector('.btn-route');

        if (btnRoute) {
            btnRoute.addEventListener('click', function() {
                carousel = true;
                if (!routeMarker) {
                    infoWindow.setContent('Please select your origin');
                } else {
                    infoWindow.setContent(`<div class="route-main"><select id="mode"><option value="DRIVING">Drive</option><option value="WALKING">Walk</option><option value="BICYCLING">Bike</option><option value="TRANSIT">Transit</option></select><button class="show-btn">Show</button></div>`);
                    self.getRoute(place, infoWindow);
                }
                myMap.addListener('click', function(evt) {
                    if (!routeMarker) {
                        self.createMarker(place, infoWindow, evt);
                    }
                });
                if (polygon) {
                    polygon.addListener('click', function(evt) {
                        if (!routeMarker) {
                            self.createMarker(place, infoWindow, evt);
                        }
                    });
                }
            });
        }
    }

    //function that actually creates the marker
    createMarker(place, infoWindow, evt) {
        routeMarker = new google.maps.Marker({
            position: evt.latLng,
            map: myMap,
        });
        this.getRoute(place, infoWindow);
    }

    getRoute(place, infoWindow) {
        let self = this;
        if (routeMarker) {
            //remove marker on clicking it
            google.maps.event.addListenerOnce(routeMarker, 'click', function() {
                if (routeMarker) {
                    infoWindow.setContent('Please select your origin');
                    routeMarker.setMap(null);
                    routeMarker = null;
                    if (directionsDisplay) {
                        directionsDisplay.setMap(null);
                        directionsDisplay.setPanel(null);
                        directionsDisplay = null;
                    }
                }
            });

            infoWindow.setContent(`<div class="route-main"><select id="mode"><option value="DRIVING">Drive</option><option value="WALKING">Walk</option><option value="BICYCLING">Bike</option><option value="TRANSIT">Metro</option></select><button class="show-btn">Show</button></div>`);
            const showBtn = document.querySelector('.show-btn');
            if (showBtn) {
                showBtn.addEventListener('click', function() {
                    let mode = document.getElementById('mode').value;
                    const directionsService = new google.maps.DirectionsService();
                    //get the direction between the route and destination
                    directionsService.route({
                        origin: routeMarker.position,
                        destination: place.geometry.location,
                        travelMode: google.maps.TravelMode[mode]
                    }, function(response, status) {
                        if (status === google.maps.DirectionsStatus.OK) {
                            directionsDisplay = new google.maps.DirectionsRenderer({
                                map: myMap,
                                directions: response,
                                draggable: false,
                                suppressMarkers: true,
                                hideRouteList: true,
                                polylineOptions: {
                                    strokeColor: 'green',
                                    strokeWeight: 4,
                                    editable: false,
                                    zIndex: 10,
                                }
                            });
                            let result = response.routes[0].legs[0];
                            if (place.name && result.duration.text && result.distance.text) {
                                infoWindow.setContent(`<span class="place-name">${place.name}</span> is <span class="place-duration">${result.duration.text}</span> away, at <span class="place-distance">${result.distance.text}</span><div class="direction-btn-ctn"><button class="direction-btn">Directions</button></div>`);
                            } else {
                                infoWindow.setContent('<span>Route not available for this place');
                            }
                            if (directionsDisplay) {
                                const dirBtn = document.querySelector('.direction-btn');
                                if (dirBtn) {
                                    dirBtn.addEventListener('click', function() {
                                        const directionCtn = document.querySelector('.direction-display');
                                        directionCtn.innerHTML = "";
                                        directionsDisplay.setPanel(document.querySelector('.direction-display'));
                                        opened = true;
                                        document.querySelector(".sidenav").style.width = "350px";
                                        document.getElementById("main").style.marginLeft = "350px";
                                    });
                                }
                            }
                        } else {
                            alert('Unable to get direction for that location');
                        }
                    });
                });
            }
        }
    }

    render() {
        return (
            <div className="search-page" onFocus={() => (!sCalled) && (this.initSearch())}>
                <div className="sidenav">
                    <a href="#" className="close-nav"><i class="fas fa-times"></i></a>
                    <div className="direction-display"></div>
                </div>
                <div className="nav-container"><button className="open-nav" title="Directions"><i class="fas fa-directions"></i></button></div>
                <div className="main-content">
                    <div className="search-btn-container">
                        <Link to="/" className="goback-btn" onClick={() => this.clearAll()}><i className="fas fa-chevron-left"></i></Link>
                        <input className="search-input" type="text" placeholder="Click on the draw icon and define the region" />
                        <button className="search-btn"><i className="fas fa-search"></i></button>
                    </div>
                    <div className="buttons-container">
                        <a href="#" className="buttons draw-btn" tooltip="Draw"><i className="fas fa-draw-polygon"></i></a>
                        <a href="#" className="buttons clear-btn" tooltip="Clear"><i className="fas fa-undo"></i></a>
                        <a className="buttons" href="#"></a>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
