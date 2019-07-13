/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React from 'react';
import { Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import SearchPage from './SearchPage';
import style from '../json/mapstyle.json';

class App extends React.Component {

    componentDidMount() {
        //connect the initMap() function within this class to the global context
        window.initMap = this.initMap;
        const ref = document.getElementsByTagName('script')[0];
        const script = document.createElement('script');
        //load the maps script asynchronously and give reference to the global callback
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDuqhcnldSASlaMVsvLvMc8DRewy0FzX4o&libraries=places,drawing,geometry&v=3&language=en&region=in&callback=initMap';
        script.async = true;
        ref.parentNode.insertBefore(script, ref);
    }

    initMap = () => {
        let mapContainer = document.querySelector('.map-container');
        mapContainer.style.display = 'none';
        window.myMap = new google.maps.Map(mapContainer, {
            zoom: 6,
            styles: style,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            gestureHandling: 'greedy',
            controlSize: 33,
            scaleControl: false,
            disableDefaultUI: true
        });
    };

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
