/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React from 'react';
import Swal from 'sweetalert2';

//make sure the init function is called only once
let lCalled = false;

class LandingPage extends React.Component {

    initLanding() {
        lCalled = true;
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
                Swal.fire('Location not found try a different area?');
            }
            else {
                myMap.setCenter(place.geometry.location);
                myMap.setZoom(14);
                lCalled = false;
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
                    lCalled = false;
                    self.props.historyObj.push('/search');
                } else {
                    Swal.fire('Location not found try a different area?');
                }
            });
        } else {
            Swal.fire('Please enter your city first');
        }
    }

    render() {
        return (
            <div className="landing-page">
                <div className="header-ctn animated slideInDown fast"><h1 className="header">NAVIGO</h1></div>
                <div className="hero-content">
                    <div className="hero-content-main">Your Personal Navigator<i className="fas fa-route"></i></div>
                    <div className="hero-content-sub">
                        <div className="hero-content-sub-img animated rotateIn faster"></div>
                        <span className="hero-content-sub-info">TO PLACES AROUND YOU</span>
                    </div>
                </div>
                <div className="address-ctn">
                    <input type="text" className="address-input" placeholder="Search city" onFocus={() => (!lCalled) && (this.initLanding())} />
                    <button className="zoom-btn" onClick={() => this.zoomToArea()}><i className="fas fa-search"></i></button>
                </div>
                <div className="footer">Crafted with <i className="fas fa-heart"></i> by Fateh</div>
            </div>
        );
    }
}

export default LandingPage;
