import Reflux from 'reflux';
import fetchTranslations from 'app/actions/fetchTranslations';
import SuperAgent from 'superagent';

import enabledLanguages from 'countries.json!';

export default Reflux.createStore({
  translations: [],
  textToTranslate: '',
  enabledLanguages: enabledLanguages,

  init() {
    this.listenTo(fetchTranslations, this.newTranslation);
  },

  newTranslation(textToTranslate) {
    this.textToTranslate = textToTranslate;
    this.translations = [];
    this.output();

    if (!textToTranslate || textToTranslate.length < 3) {
      return;
    }

    console.log(enabledLanguages);

    Object.keys(this.enabledLanguages).forEach(key => {
      this.fetchTranslation({name: this.enabledLanguages[key], code: key}, textToTranslate);
    });

  },

  fetchTranslation(lang, textToTranslate) {

    SuperAgent.get('/translate')
    .query({'text': textToTranslate})
    .query({'lang': lang.code})
    .end((err, resp) => {
      if (err) {
        console.log(err);
        return;
      }

      let translation = resp.body.text[0];

      if ((translation !== '') && (this.textToTranslate === textToTranslate)) {
        this.translations.push({name: lang.name, value: translation});
        this.output();
      }

    });

  },

  output() {
    this.trigger(this.translations);
  }
});
