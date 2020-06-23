'use strict';

const path = require('path');
const MakerBase = require('@electron-forge/maker-base');

class MakerSnap extends MakerBase.default {
  constructor(...args) {
    super(...args);

    this.name = 'snap';
    this.defaultPlatforms = ['linux'];
    this.requiredExternalBinaries = ['snapcraft'];
  }

  isSupportedOnCurrentPlatform() {
    return true;
  }

  async make({ dir, makeDir, targetArch }) {
    const { build } = require('app-builder-lib');

    const outPath = path.resolve(makeDir, 'snap', targetArch);

    await this.ensureDirectory(outPath);

    return await build({
      prepackaged: dir,
      config: {
        directories: {
          output: outPath,
        },
        ...this.config,
      },
      linux: [`snap:${targetArch}`],
      publish: this.config.publish,
    });
  }
}

module.exports = MakerSnap;
