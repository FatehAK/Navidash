/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React from 'react';

let myMap;

let polygon = null;

let placeMarkers = [];

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
        // Connect the initMap() function within this class to the global window context,
        window.initMap = this.initMap;
        // Asynchronously load the Google Maps script, passing in the callback reference
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
                alert('Could not find location');
            }
        });

        //>>Drawing
        //for drawing polylines on the map
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            //the drawing buttons
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
                drawingModes: [
                    google.maps.drawing.OverlayType.POLYGON
                ]
            }
        });

        //for drawing functionality
        const drawBtn = document.querySelector('.draw-btn');
        drawBtn.addEventListener('click', function() {

            //toggle the drawing buttons
            if (drawingManager.map) {
                alert('already drawing');
            } else {
                //set initial drawing mode
                drawingManager.setDrawingMode('polygon');
                drawingManager.setOptions({
                    drawingControl: true
                });
                drawingManager.setMap(myMap);
            }

            self.drawPolygon(drawingManager);
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

        //>>Place Search
        const searchBtn = document.querySelector('.search-btn');
        searchBtn.addEventListener('click', self.textSearchPlaces);

        //>>Intial Zoom
        const zoomAutoComplete = new google.maps.places.Autocomplete(document.querySelector('.address-input'));
        //for zoom functionality
        const zoomBtn = document.querySelector('.zoom');
        zoomBtn.addEventListener('click', function() {
            self.zoomToArea();
        });
    }

    //geocode and zoom to address
    zoomToArea() {
        //initializing the geocoder
        const geocoder = new google.maps.Geocoder();
        let address = document.querySelector('.address-input').value;
        if (address === '') {
            alert('Enter address');
        } else {
            //geocode the address and center the map
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
            //initiate the search
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

    //function that creates markers for each place found in either places search
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
            let placeInfoWindow = new google.maps.InfoWindow();
            //if a marker is clicked, do a place details search
            marker.addListener('click', function() {
                //avoid repeated opening of the placeInfoWindow
                if (placeInfoWindow.marker !== this) {
                    getPlacesDetails(this, placeInfoWindow);
                }
            });
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
            this.searchInPolygon();
        }
        myMap.fitBounds(bounds);
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
        for (let i = 0; i < placeMarkers.length; i++) {
            //check if the polygon encolses any markers
            if (google.maps.geometry.poly.containsLocation(placeMarkers[i].position, polygon)) {
                //display the enclosed markers
                placeMarkers[i].setMap(myMap);
            } else {
                //hide the rest
                placeMarkers[i].setMap(null);
            }
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
