/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React from 'react';

//make sure the init function is called only once
let called = false;

class LandingPage extends React.Component {

    initLanding() {
        called = true;
        let self = this;

        //our places autocomplete
        const zoomAutoComplete = new google.maps.places.Autocomplete(document.querySelector('.address-input'));
        zoomAutoComplete.setComponentRestrictions({
            country: ['IN']
        });

        //on place changed we zoom and display the map
        zoomAutoComplete.addListener('place_changed', function() {
            const place = this.getPlace();
            if (!place.geometry) {
                alert("Location not found");
            }
            else {
                myMap.setCenter(place.geometry.location);
                myMap.setZoom(14);
                window.mapDisplay = true;
                called = false;
                self.props.historyObj.push('/search');
            }
        });
    }

    //zoom on the area specified
    zoomToArea() {
        let self = this;
        const geocoder = new google.maps.Geocoder();
        let address = document.querySelector('.address-input').value;
        if (address) {
            geocoder.geocode({
                address: address,
                componentRestrictions: {
                    country: 'IN'
                }
            }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    myMap.setCenter(results[0].geometry.location);
                    myMap.setZoom(14);
                    window.mapDisplay = true;
                    called = false;
                    self.props.historyObj.push('/search');
                } else {
                    alert('Location not found');
                }
            });
        } else {
            alert('Enter your city');
        }
    }

    render() {
        return (
            <div className="landing-page">
                <h3>Landing Page</h3>
                <input type="text" className="address-input" placeholder="Search city" onFocus={() => (!called) && (this.initLanding())} />
                <button className="-btn" onClick={() => this.zoomToArea()}>Search</button>
            </div>
        );
    }
}

export default LandingPage;
