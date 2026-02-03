import crypto from 'node:crypto';
import fs from 'node:fs';
import nodemailer from 'nodemailer';

import db from './db.js';

const COLLECTION = 'invitations';
const LIMIT = parseInt(process.env.INVITATIONS_LIMIT) || 300;

const { GOOGLE_APPLICATION_CREDENTIALS, TRUSTPILOT_AFS_EMAIL } = process.env;
let transporter;
if (GOOGLE_APPLICATION_CREDENTIALS && TRUSTPILOT_AFS_EMAIL) {
  const key = JSON.parse(fs.readFileSync(GOOGLE_APPLICATION_CREDENTIALS));
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'mailer@coin.space',
      serviceClient: key.client_id,
      privateKey: key.private_key,
      scope: 'https://mail.google.com/',
    },
  });
}

async function status() {
  return {
    enabled: await isEnabled(),
  };
}

async function send(email) {
  const enabled = await isEnabled();
  if (!enabled) return;

  const invitations = db.collection(COLLECTION);
  const emailSha = crypto.createHash('sha1')
    .update(email + process.env.TRUSTPILOT_AFS_EMAIL)
    .digest('hex');
  const now = new Date();

  try {
    await invitations.insertOne({
      _id: emailSha,
      timestamp: now,
    });
    if (transporter) {
      await transporter.sendMail({
        from: 'mailer@coin.space',
        to: TRUSTPILOT_AFS_EMAIL,
        subject: 'invitation',
        text: `
          <!-- <script type="application/json+trustpilot">
            {
              "recipientName": "User",
              "recipientEmail": "${email}",
              "referenceId": "cs${now.getTime()}"
            }
          </script> -->`,
      });
    }
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) return;
    await invitations.deleteOne({ _id: emailSha });
    console.log(err);
    throw err;
  }
}

async function isEnabled() {
  const invitations = db.collection(COLLECTION);
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const count = await invitations.countDocuments({
    timestamp: { $gte: start, $lt: end },
  });
  return count < LIMIT;
}

export default {
  status,
  send,
};
