/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React from 'react';

class App extends React.Component {

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
        let mapContainer = document.querySelector('.map-container');
        let myMap = new google.maps.Map(mapContainer, {
            center: { lat: 13.067439, lng: 80.237617 },
            zoom: 14,
            mapTypeControl: false
        });
    }

    render() {
        return (
            <div className="container">
                <div className="heading">NaviDash</div>
                <div className="main">
                    <div className="main-content">Test</div>
                    <div className="map-container"></div>
                </div>

            </div>
        );
    }
}

export default App;
