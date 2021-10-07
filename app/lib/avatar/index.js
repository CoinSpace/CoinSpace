import crypto from 'crypto';
import { toSvg } from 'jdenticon';
import LS from 'lib/wallet/localStorage';
import details from 'lib/wallet/details';

export function getAvatar(size = 64) {
  const userInfo = details.get('userInfo');
  const email = (userInfo.email || '').trim().toLowerCase();
  let id;
  if (email) {
    const hash = crypto.createHash('md5').update(email).digest('hex');
    id = `gravatar:${hash}`;
  } else {
    const hash = crypto.createHmac('sha256', 'Coin Wallet').update(LS.getDetailsKey()).digest('hex');
    id = `identicon:${hash}`;
  }
  return {
    id,
    url: getAvatarUrl(id, size),
  };
}

export function getAvatarUrl(id, size) {
  const [type, hash] = id.split(':');
  if (type === 'gravatar') {
    return `https://www.gravatar.com/avatar/${hash}?size=${size}`;
  } else if (type === 'identicon') {
    return `data:image/svg+xml;base64,${Buffer.from(toSvg(hash, size, { padding: 0 })).toString('base64')}`;
  }
}

export default {
  getAvatar,
  getAvatarUrl,
};
