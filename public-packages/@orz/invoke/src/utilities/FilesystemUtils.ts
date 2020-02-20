import { Filename, PortablePath, ppath, xfs } from '@yarnpkg/fslib';

export function getParentPath(path: PortablePath) {
  const parent = ppath.dirname(path)
  if (parent === path) return null;
  return parent;
}

export async function discoverSymbolFile({
  startingDir,
  symbol,
  discoveryAcrossFilesystem = false,
  anchorDir
}: {
  startingDir: PortablePath;
  symbol: Filename;
  discoveryAcrossFilesystem?: boolean;
  anchorDir?: PortablePath;
}) {
  // TODO: put discoveryAcrossFilesystem in env
  // Git: "fatal: Not a git repository (or any parent up to mount parent /home/kozi) Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set)."

  // https://linux.die.net/man/2/stat
  // The st_dev field describes the device on which this file resides. (The major(3) and minor(3) macros may be useful to decompose the device ID in this field.)

  let current = await xfs.realpathPromise(startingDir);
  const currentDev = discoveryAcrossFilesystem ? 0 : (await xfs.statPromise(anchorDir ? await xfs.realpathPromise(anchorDir) : current)).dev;
  while (!await xfs.existsPromise(ppath.resolve(current, symbol))) {
    let parent = getParentPath(current)
    if (parent === null) return null;

    parent = await xfs.realpathPromise(parent);
    const parentDev = discoveryAcrossFilesystem ? 0 : (await xfs.statPromise(parent)).dev;
    if (parentDev !== currentDev) return null;

    current = parent;
  }
  return current;
}
