import { toAtom, toUnitString } from 'lib/convert';
import { showInfo, showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { getWalletCoin } from 'lib/wallet';

export async function validateSend(options) {
  const amount = toAtom(options.amount);
  const { wallet } = options;
  const { to } = options;
  const fee = toAtom(options.fee);
  let tx = null;

  try {
    if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(wallet.networkName) !== -1) {
      tx = wallet.createTx(to, amount, fee);
    } else if (['ethereum', 'binance-smart-chain'].includes(wallet.networkName)) {
      tx = wallet.createTx(to, amount);
    } else if (wallet.networkName === 'ripple') {
      tx = await wallet.createTx(to, amount, options.tag, options.invoiceId);
    } else if (wallet.networkName === 'stellar') {
      tx = wallet.createTx(to, amount, options.memo, !options.destinationInfo.isActive);
    } else if (wallet.networkName === 'eos') {
      tx = wallet.createTx(to, amount, options.memo);
    } else if (wallet.networkName === 'monero') {
      tx = await wallet.createTx(to, amount, fee);
    }
    options.tx = tx;
  } catch (err) {
    if (/Invalid address/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Please enter a valid address to send to'),
      });
    } else if (/Invalid tag/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Please enter a valid destination tag'),
      });
    } else if (/Invalid invoiceID/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Please enter a valid invoice ID'),
      });
    } else if (/Invalid memo/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Please enter a valid memo'),
      });
    } else if (/Inactive account/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        // eslint-disable-next-line max-len
        message: translate("Your wallet isn't activated. To activate it please send greater than minimum reserve (:minReserve :denomination) to your wallet address.", {
          minReserve: toUnitString(wallet.minReserve),
          denomination: wallet.denomination,
        }),
      });
    } else if (/Destination address equal source address/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Please enter an address other than your wallet address'),
      });
    } else if (/Invalid value/.test(err.message)) {
      if (/Less than minimum reserve/.test(err.details)) {
        showError({
          title: translate('Uh Oh...'),
          // eslint-disable-next-line max-len
          message: translate("Recipient's wallet isn't activated. You can send only amount greater than :minReserve :denomination.", {
            minReserve: toUnitString(wallet.minReserve),
            denomination: wallet.denomination,
          }),
        });
      } else {
        showError({
          title: translate('Uh Oh...'),
          message: translate('Please enter an amount above', {
            dust: `${toUnitString(err.dustThreshold)} ${wallet.denomination}`,
          }),
        });
      }
    } else if (/Invalid gasLimit/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Please enter Gas Limit greater than zero'),
      });
    } else if (/Invalid fee/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        // TODO add translation when inplemented in wallets
        message: 'Please enter valid fee',
      });
    } else if (/Transaction too large/.test(err.message)) {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Transaction too large'),
      });
      // eslint-disable-next-line max-len
    } else if (/Insufficient funds for token transaction/.test(err.message) && ['ethereum', 'binance-smart-chain'].includes(wallet.networkName)) {
      // eslint-disable-next-line max-len
      showError({
        title: translate('Uh Oh...'),
        message: translate('You do not have enough funds to pay transaction fee (:required).', {
          required: `${toUnitString(err.required, 18)} ${wallet.baseDenomination}`,
        }),
      });
    } else if (/Insufficient funds/.test(err.message)) {
      if (/Additional funds confirmation pending/.test(err.details)) {
        showError({
          title: translate('Uh Oh...'),
          // eslint-disable-next-line max-len
          message: translate('Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first.'),
        });
        // eslint-disable-next-line max-len
      } else if (/Attempt to empty wallet/.test(err.details) && ['ethereum', 'binance-smart-chain'].includes(wallet.networkName)) {
        // eslint-disable-next-line max-len
        const message = translate('It seems like you are trying to empty your wallet. Taking transaction fee into account, we estimated that the max amount you can send is. We have amended the value in the amount field for you', {
          sendableBalance: toUnitString(err.sendableBalance),
        });
        showInfo({ message });
      } else if (/Attempt to empty wallet/.test(err.details) && wallet.networkName === 'eos') {
        // eslint-disable-next-line max-len
        const message = translate('It seems like you are trying to empty your wallet. Max amount you can send is. We have amended the value in the amount field for you', {
          sendableBalance: toUnitString(err.sendableBalance),
        });
        showInfo({ message });
      // eslint-disable-next-line max-len
      } else if (/Attempt to empty wallet/.test(err.details) && (wallet.networkName === 'ripple' || wallet.networkName === 'stellar')) {
        // eslint-disable-next-line max-len
        const message = translate('It seems like you are trying to empty your wallet. Taking transaction fee and minimum reserve into account, we estimated that the max amount you can send is. We have amended the value in the amount field for you', {
          sendableBalance: toUnitString(err.sendableBalance),
          minReserve: toUnitString(wallet.minReserve),
          denomination: wallet.denomination,
        });
        showInfo({ message });
      } else {
        showError({
          title: translate('Uh Oh...'),
          message: translate('You do not have enough funds in your wallet (incl. fee)'),
        });
      }
    } else if (err.message === 'cs-node-error') {
      showError({
        title: translate('Uh Oh...'),
        message: translate('Network node error. Please try again later.', {
          network: getWalletCoin(wallet).name,
        }),
      });
    } else {
      console.error(`not translated error: ${err.message}`);
      showError({
        title: translate('Uh Oh...'),
        message: err.message,
      });
    }

    throw err;
  }
}

export default validateSend;
