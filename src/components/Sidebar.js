/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';

class Sidebar extends React.Component {

    state = {
        opened: false
    };

    //refs
    sidebarRef = React.createRef();
    directionRef = React.createRef();

    //toggle the sidebar visibility
    toogleSide = () => {
        if (!this.state.opened) {
            this.setState({ opened: true });
            this.sidebarRef.current.style.width = '320px';
            document.getElementById('main').style.marginLeft = '320px';
        } else {
            this.sidebarRef.current.style.width = '0';
            document.getElementById("main").style.marginLeft = '0';
            this.setState({ opened: false });
        }
    };

    //close the sidebar
    closeSide = () => {
        this.sidebarRef.current.style.width = '0';
        document.getElementById('main').style.marginLeft = '0';
        this.setState({ opened: false });
    };

    //open the sidebar
    openSide = () => {
        this.sidebarRef.current.style.width = '320px';
        document.getElementById("main").style.marginLeft = '320px';
        this.setState({ opened: true });
    };

    render() {
        return (
            <div className="nav-wrap">
                <div className="sidenav" ref={this.sidebarRef}>
                    <a href="#" className="close-nav" onClick={() => this.closeSide()}><i className="fas fa-times"></i></a>
                    <div className="direction-ctn" ref={this.directionRef}><p className="direction-para">Select route to display directions</p></div>
                </div>
                <div className="nav-container">
                    <button className="open-nav animated slideInLeft faster" title="Directions" onClick={() => this.toogleSide()}><i className="fas fa-directions"></i></button>
                </div>
            </div>
        );
    }
}

export default Sidebar;
