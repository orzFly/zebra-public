import { FakeFS, PortablePath, ppath, ProxiedFS } from "@yarnpkg/fslib";

const S_IFDIR = 0o040000;
const S_IFREG = 0o100000;
export class ZipDirFS extends ProxiedFS<PortablePath, PortablePath> {
  constructor(protected baseFs: FakeFS<PortablePath>) {
    super(ppath);
  }

  async statPromise(p: PortablePath) {
    const result = await this.baseFs.statPromise(this.mapToBase(p));
    if (ppath.extname(p).toLowerCase() === '.zip' && result.mode & S_IFREG) {
      result.mode = result.mode ^ S_IFREG | S_IFDIR;
    }
    return result;
  }

  statSync(p: PortablePath) {
    const result = this.baseFs.statSync(this.mapToBase(p));
    if (ppath.extname(p).toLowerCase() === '.zip' && result.mode & S_IFREG) {
      result.mode = result.mode ^ S_IFREG | S_IFDIR;
    }
    return result;
  }

  async lstatPromise(p: PortablePath) {
    const result = await this.baseFs.lstatPromise(this.mapToBase(p));
    if (ppath.extname(p).toLowerCase() === '.zip' && result.mode & S_IFREG) {
      result.mode = (result.mode ^ S_IFREG) | S_IFDIR;
    }
    return result;
  }

  lstatSync(p: PortablePath) {
    const result = this.baseFs.lstatSync(this.mapToBase(p));
    if (ppath.extname(p).toLowerCase() === '.zip' && result.mode & S_IFREG) {
      result.mode = (result.mode ^ S_IFREG) | S_IFDIR;
    }
    return result;
  }

  protected mapToBase(path: PortablePath): PortablePath {
    return path;
  }

  protected mapFromBase(path: PortablePath): PortablePath {
    return path;
  }
}
