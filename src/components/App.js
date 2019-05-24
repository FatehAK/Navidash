/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React from 'react';

let myMap;

let polygon = null;

let placeMarkers = [];

let placeInfoWindow;

class App extends React.Component {

    constructor(props) {
        super(props);
        //retain object instance when used in the function
        this.initMap = this.initMap.bind(this);
        this.drawPolygon = this.drawPolygon.bind(this);
        this.searchBoxPlaces = this.searchBoxPlaces.bind(this);
        this.textSearchPlaces = this.textSearchPlaces.bind(this);
        this.hideMarkers = this.hideMarkers.bind(this);
        this.createMarkersForPlaces = this.createMarkersForPlaces.bind(this);
    }

    componentDidMount() {
        //connect the initMap() function within this class to the global context
        window.initMap = this.initMap;
        //load the maps script asynchronously and give reference to the global callback
        const ref = document.getElementsByTagName("script")[0];
        const script = document.createElement("script");
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDuqhcnldSASlaMVsvLvMc8DRewy0FzX4o&libraries=places,drawing,geometry&v=3&callback=initMap';
        script.async = true;
        ref.parentNode.insertBefore(script, ref);
    }

    initMap() {
        let self = this;

        //initializing our map
        let mapContainer = document.querySelector('.map-container');
        myMap = new google.maps.Map(mapContainer, {
            zoom: 6,
            mapTypeControl: false
        });

        //setting the default location
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: 'India' }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                myMap.setCenter(results[0].geometry.location);
            } else {
                alert('Location not found');
            }
        });

        //for zoom functionality
        const zoomAutoComplete = new google.maps.places.Autocomplete(document.querySelector('.address-input'));
        zoomAutoComplete.setComponentRestrictions({ country: ['IN'] });

        const zoomBtn = document.querySelector('.zoom');
        zoomBtn.addEventListener('click', function() {
            self.zoomToArea();
        });

        zoomAutoComplete.addListener('place_changed', function() {
            const place = this.getPlace();
            if (!place.geometry) {
                alert("Location not found");
            }
            else {
                myMap.setCenter(place.geometry.location);
                myMap.setZoom(14);
            }
        });

        //for drawing polylines on the map
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
                drawingModes: [
                    google.maps.drawing.OverlayType.POLYGON
                ]
            }
        });

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
            //got to bounds of poly on subsequent clicks
            if (polygon) {
                myMap.fitBounds(self.getPolyBounds());
            }
        });

        const clearBtn = document.querySelector('.clear-btn');
        clearBtn.addEventListener('click', function() {
            if (drawingManager.map) {
                drawingManager.setMap(null);
                //get rid of the polygon too and clean the references
                if (polygon) {
                    polygon.setMap(null);
                    polygon = null;
                }
                self.hideMarkers();
            }
        });

        //places search on btn click
        const searchBtn = document.querySelector('.search-btn');
        searchBtn.addEventListener('click', self.textSearchPlaces);
    }

    //geocode and zoom to address
    zoomToArea() {
        const geocoder = new google.maps.Geocoder();
        let address = document.querySelector('.address-input').value;
        if (address === '') {
            alert('Enter address');
        } else {
            geocoder.geocode({
                address: address,
                componentRestrictions: {
                    country: 'IN'
                }
            }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    myMap.setCenter(results[0].geometry.location);
                    myMap.setZoom(14);
                } else {
                    alert('Location not found');
                }
            });
        }
    }

    //hiding our markers and cleaning the array
    hideMarkers() {
        for (let i = 0; i < placeMarkers.length; i++) {
            placeMarkers[i].setMap(null);
        }
        placeMarkers = [];
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

        drawingManager.addListener('overlaycomplete', function(evt) {
            //once drawing is complete we go back to free hand movement mode
            drawingManager.setDrawingMode(null);
            drawingManager.setOptions({
                drawingControl: false
            });

            //creating an editable polygon
            polygon = evt.overlay;
            polygon.setEditable(true);

            //searchbox
            let searchInput = new google.maps.places.SearchBox(document.querySelector('.search-input'));
            searchInput.setBounds(self.getPolyBounds());

            //this listener if for when the users select the place from the picklist
            searchInput.addListener('places_changed', function() {
                self.searchBoxPlaces(searchInput);
            });

            //redo the search if the polygon is edited
            polygon.getPath().addListener('set_at', function() {
                self.textSearchPlaces();
            });
            polygon.getPath().addListener('insert_at', function() {
                self.textSearchPlaces();
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
            let self = this;
            //hide any place markers already set
            self.hideMarkers();
            //get all places from the query
            let places = searchBox.getPlaces();
            console.log(searchBox.getPlaces());
            //we create markers for the places
            self.createMarkersForPlaces(places);
            if (places.length === 0) {
                alert('No places found');
            }
        } else {
            alert('Please select area first');
        }
    }

    //display new places on resizing the polygon or on btn click
    textSearchPlaces() {
        if (polygon) {
            let self = this;
            //hide any place markers already set
            self.hideMarkers();
            const placesService = new google.maps.places.PlacesService(myMap);
            //initiate the place search
            placesService.textSearch({
                query: document.querySelector('.search-input').value,
                bounds: self.getPolyBounds()
            }, function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    self.createMarkersForPlaces(results);
                } else {
                    alert('No places found');
                }
            });
        } else {
            alert('Please select area first');
        }
    }

    //function that creates markers for each place found in places search
    createMarkersForPlaces(places) {
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
            let self = this;
            placeInfoWindow = new google.maps.InfoWindow();
            marker.addListener('click', function() {
                //avoid repeated opening of the placeInfoWindow
                if (placeInfoWindow.marker !== this) {
                    bounds.extend(this.position);
                    myMap.fitBounds(bounds);
                    myMap.setZoom(14);
                    self.getPlacesDetails(this, placeInfoWindow);
                }
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

        const service = new google.maps.places.PlacesService(myMap);
        service.getDetails({
            placeId: marker.id
        }, function(place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                console.log(place);
                infoWindow.marker = marker;

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
                    innerHTML += `<div class="info-star">${place.rating}<span>★</span></div>`;
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
                    innerHTML += `<div class="info-img-container"><button class="info-img-prev">&lt;</button><img class="info-img" src="${photos[0]}" alt="No image available"><button class="info-img-next">&gt;</button></div>`;
                }

                innerHTML += `<div class="info-btns"><button>Street View</button><button>Show route</button></div>`
                innerHTML += `</div>`;
                infoWindow.setContent(innerHTML);
                infoWindow.open(myMap, marker);

                //make sure the marker property is cleared if the infoWindow is closed
                infoWindow.addListener('closeclick', function() {
                    infoWindow.marker = null;
                    marker.setAnimation(null);
                });

                //for the photo carousel
                infoWindow.addListener('domready', function() {
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
                });
            }
        });
    }

    render() {
        return (
            <div className="container">
                <div className="heading">NaviDash</div>
                <div className="main">
                    <div className="main-content">
                        <div>
                            <input type="text" className="address-input" placeholder="Enter Area" />
                            <button className="zoom">Zoom</button>
                        </div>
                        <div>
                            <button className="draw-btn">Draw</button>
                            <button className="clear-btn">Clear</button>
                        </div>
                        <div>
                            <span>Search for nearby places</span>
                            <input className="search-input" type="text" placeholder="Ex: Pizza delivery in Chennai" />
                            <input className="search-btn" type="button" value="Go" />
                        </div>
                    </div>
                    <div className="map-container"></div>
                </div>

            </div>
        );
    }
}

export default App;
