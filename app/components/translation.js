import React from 'react';

export default class Translation extends React.Component {
  render() {

    console.log(this.props.translation)
    return <p>this.props.translation.value</p>;
  }
}
