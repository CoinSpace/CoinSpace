import request from 'lib/request';
import details from 'lib/wallet/details';
import { getWallet } from 'lib/wallet';
import Avatar from 'lib/avatar';

async function save() {
  const { latitude, longitude } = await getLocation();
  const userInfo = details.get('userInfo');
  return request({
    url: `${process.env.SITE_URL}api/v3/mecto`,
    method: 'put',
    data: {
      username: userInfo.username,
      avatarId: Avatar.getAvatar().id,
      address: getWallet().getNextAddress(),
      lat: latitude,
      lon: longitude,
    },
    seed: 'public',
    hideFlashError: true,
  });
}

async function search() {
  const { latitude, longitude } = await getLocation();
  const results = await request({
    url: `${process.env.SITE_URL}api/v3/mecto`,
    params: {
      lat: latitude,
      lon: longitude,
    },
    method: 'get',
    seed: 'public',
    hideFlashError: true,
  });
  return results;
}

function remove() {
  return request({
    url: `${process.env.SITE_URL}api/v3/mecto`,
    method: 'delete',
    seed: 'public',
    hideFlashError: true,
  });
}

async function getLocation() {
  return new Promise((resolve, reject) => {
    if (!window.navigator.geolocation) {
      return reject(new Error('Your browser does not support geolocation'));
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
          'Coin Wallet'
        );
        reject(new Error('Unable to retrieve your location'));
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
