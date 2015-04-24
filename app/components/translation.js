import React from 'react';

import './translation.css!';

export default class Translation extends React.Component {
  render() {
    return (<li className="translationlist__item" key={this.props.translation.name}>
      <div className="language">
        {this.props.translation.name}
      </div>
      <div className="translation">
        <div className="translation__bar" style={{width: ((parseFloat(this.props.translation.value.length) / this.props.largest) * 100) + "%"}}/>
        <div className="translation__value">{this.props.translation.value}</div>
      </div>
    </li>);
  }
}
