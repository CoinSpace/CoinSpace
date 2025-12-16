import delay from 'delay';
import fee from './fee.js';
import github from './github.js';
import pForever from 'p-forever';

function cacheFees(interval) {
  return pForever(async () => {
    await fee.updateFees().catch(error('cacheFees'));
    await delay(interval);
  });
}

function cacheGithubReleases(interval) {
  return pForever(async () => {
    await github.sync().catch(error('cacheGithubReleases'));
    await delay(interval);
  });
}

function error(work) {
  return (e) => {
    e.message = `${work}: ${e.message}`;
    console.error(e);
  };
}

export default {
  cacheFees,
  cacheGithubReleases,
};
