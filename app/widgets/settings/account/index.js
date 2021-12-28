import Ractive from 'lib/ractive';
import showRemoveConfirmation from 'widgets/modals/confirm-remove-account';
import { showError } from 'widgets/modals/flash';
import CS from 'lib/wallet';
import details from 'lib/wallet/details';
import template from './index.ract';
import { translate } from 'lib/i18n';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      username: '',
      email: '',
    },
  });
  let isLoading = false;

  ractive.on('before-show', () => {
    const user = details.get('userInfo');
    ractive.set('username', user.username);
    ractive.set('email', user.email);
  });

  ractive.on('save', async () => {
    if (isLoading) return;
    const username = ractive.get('username').trim();
    const email = ractive.get('email').trim();
    if (!username) {
      return showError({ message: translate('A name is required to set your profile') });
    }
    isLoading = true;
    try {
      const safeUsername = await CS.setUsername(username);
      await details.set('userInfo', {
        username: safeUsername,
        email,
      });
      ractive.fire('change-step', { step: 'main', userInfo: details.get('userInfo') });
    } catch (err) {
      if (err.status === 400) {
        showError({ message: translate('Username not available') });
      } else {
        console.error(err);
      }
    }
    isLoading = false;
  });

  ractive.on('remove', showRemoveConfirmation);


  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  return ractive;
}
