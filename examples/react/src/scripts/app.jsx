'use strict';

var Hello = require('./hello');
var World = require('./world');
var React = require('react');

var App = React.createClass({
    render: function() {
        return (
            <div>
                <Hello />
                <World />
                <div className='soundrop-logo' />
                <div className='spotify-logo' />
            </div>
        );
    }
});

React.renderComponent(<App />, document.getElementById('app'));
