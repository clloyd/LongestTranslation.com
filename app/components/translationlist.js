import React from 'react';
import Translation from 'app/components/translation';
import TranslationsStore from 'app/stores/translations';

var compareLength = function compare(a,b) {
  if (a.value.length < b.value.length)
     return 1;
  if (a.value.length > b.value.length)
    return -1;
  return 0;
}

export default class TranslationList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {translations: []};

    TranslationsStore.listen(translations => {
      this.setState({translations: translations});
    });

  }

  render() {

    if (!this.state.translations || this.state.translations.length === 0) {
      return null;
    }

    return (
      <ul>
        {this.state.translations.sort(compareLength).map(translation => {
          return (<li key={translation.name}>{translation.name} - {translation.value}</li>);
        })}
      </ul>
    );
  }
}
