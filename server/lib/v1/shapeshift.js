import axios from 'axios';

// eslint-disable-next-line max-len
const Authorization = 'Basic ' + Buffer.from(process.env.SHAPESHIFT_CLIENT_ID + ':' + process.env.SHAPESHIFT_CLIENT_SECRET).toString('base64');

function revokeToken(token) {
  return axios({
    method: 'post',
    url: 'https://auth.shapeshift.io/oauth/token/revoke',
    headers: {
      Authorization,
    },
    data: {
      token,
    },
  });
}

function getAccessToken(code) {
  return axios({
    method: 'post',
    url: 'https://auth.shapeshift.io/oauth/token',
    headers: {
      Authorization,
    },
    data: {
      code,
      grant_type: 'authorization_code',
    },
  }).then((response) => {
    const accessToken = response.data && response.data.access_token || '';
    return axios({
      method: 'get',
      url: 'https://auth.shapeshift.io/oauth/token/details',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    }).then((response) => {
      const isVerified = response.data && response.data.user.verificationStatus !== 'NONE';
      return isVerified ? accessToken : 'is_not_verified';
    });
  });
}

export default {
  revokeToken,
  getAccessToken,
};
