import React from 'react';

import TranslationList from 'app/components/translationlist';
import fetchTranslations from 'app/actions/fetchTranslations';

class App extends React.Component {

  handleChange(event) {
    fetchTranslations(event.target.value)
  }

  render() {
    return (
      <div className="main">
        <h1>Longest Translation</h1>
        <input type="text" onChange={this.handleChange}/>
        <TranslationList />
      </div>
    )
  }
}

React.render(<App />, document.getElementById('main'))
