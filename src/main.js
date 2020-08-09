import Vue from 'vue';
import App from '@/App.vue';
import vuetify from '@/plugins/vuetify';
import VueTextareaAutosize from 'vue-textarea-autosize';
import firebase from 'firebase/app';
import 'firebase/firestore';
import config from '@/config';

Vue.use(VueTextareaAutosize);

Vue.config.productionTip = false;

firebase.initializeApp(config.firebase);

// eslint-disable-next-line import/prefer-default-export
export const firestore = firebase.firestore();

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
