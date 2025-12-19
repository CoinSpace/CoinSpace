import { MakerBase } from '@electron-forge/maker-base';
import path from 'path';

export default class MakerSnap extends MakerBase {
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
    const { build } = await import('app-builder-lib');

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
