import AuthView from '../../views/Auth/AuthView.vue';
import UnlockView from '../../views/Unlock/UnlockView.vue';

const auth = [
  {
    path: '/',
    name: 'auth',
    component: AuthView,
  },
  {
    path: '/',
    name: 'unlock',
    component: UnlockView,
  },
];

export default auth;
