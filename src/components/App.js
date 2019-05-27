/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React from 'react';
import { Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import SearchPage from './SearchPage';

class App extends React.Component {

    constructor(props) {
        super(props);
        //retain object instance when used in the function
        this.initMap = this.initMap.bind(this);
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
        let mapContainer = document.querySelector('.map-container');
        mapContainer.style.display = 'none';

        window.myMap = new google.maps.Map(mapContainer, {
            zoom: 6,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            gestureHandling: 'greedy',
            controlSize: 33,
            scaleControl: false,
            disableDefaultUI: true
        });
    }

    render() {
        return (
            <div className="app">
                <Route exact path="/" render={({ history }) => (
                    <LandingPage historyObj={history} />
                )} />
                <Route path="/search" render={() => (
                    <SearchPage />
                )} />
            </div>
        );
    }
}

export default App;
