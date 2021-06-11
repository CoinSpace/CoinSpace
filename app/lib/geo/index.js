import request from 'lib/request';
import details from 'lib/wallet/details';
import { translate } from 'lib/i18n';
import { getWallet } from 'lib/wallet';

async function save() {
  const { latitude, longitude } = await getLocation();
  const userInfo = details.get('userInfo');
  return request({
    url: `${process.env.SITE_URL}api/v2/mecto`,
    method: 'put',
    data: {
      username: userInfo.username,
      email: userInfo.email,
      avatarIndex: userInfo.avatarIndex,
      address: getWallet().getNextAddress(),
      lat: latitude,
      lon: longitude,
    },
    seed: 'public',
  });
}

async function search() {
  const { latitude, longitude } = await getLocation();
  const results = await request({
    url: `${process.env.SITE_URL}api/v2/mecto`,
    params: {
      lat: latitude,
      lon: longitude,
    },
    method: 'get',
    seed: 'public',
  });
  return results;
}

function remove() {
  return request({
    url: `${process.env.SITE_URL}api/v2/mecto`,
    method: 'delete',
    seed: 'public',
  }).catch(() => {});
}

async function getLocation() {
  return new Promise((resolve, reject) => {
    if (!window.navigator.geolocation) {
      return reject(new Error(translate('Your browser does not support geolocation')));
    }

    const options = process.env.BUILD_TYPE === 'electron' ? {
      enableHighAccuracy: true,
    } : {};

    const alert = navigator.notification ? navigator.notification.alert : window.alert;

    window.navigator.geolocation.getCurrentPosition(
      (position) => { resolve(position.coords); },
      () => {
        alert(
          'Access to the geolocation has been prohibited; please enable it in the Settings app to continue',
          () => {},
          'Coin'
        );
        reject(new Error(translate('Unable to retrieve your location')));
      },
      options
    );
  });
}

export default {
  search,
  save,
  remove,
};
