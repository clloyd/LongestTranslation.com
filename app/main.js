import React from 'react';

import TranslationList from 'app/components/translationlist';
import fetchTranslations from 'app/actions/fetchTranslations';

import 'app/main.css!';

class App extends React.Component {

  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();

    fetchTranslations(this.refs.original.getDOMNode().value);
  }

  render() {
    return (
      <div className="main">
        <h1 className="main__title">Longest Translation</h1>
        <form className="form" onSubmit={this.handleSubmit}>
          <input type="text" ref="original" className="form__input" onChange={this.handleChange}/>
          <input type="submit" className="form__submit" />
        </form>
        <TranslationList />
      </div>
    );
  }
}

React.render(<App />, document.getElementById('main'))
