import crypto from 'crypto';

function sign(urls) {
  return urls.map((url) => {
    const signature = crypto
      .createHmac('sha256', process.env.MOONPAY_API_SECRET)
      .update(new URL(url).search)
      .digest('base64');
    return `${url}&signature=${encodeURIComponent(signature)}`;
  });
}

export default {
  sign,
};
