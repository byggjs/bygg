'use strict';

var React = require('react');

var Hello = React.createClass({
    render: function() {
        return (
            <div className='hello'>
                <div>Hello</div>
                <button onClick={this._onClick}>Click Me</button>
            </div>
        );
    },
    _onClick: function () {
        console.log('click!');
        oops.foo = 1337;
    }
});

module.exports = Hello;
