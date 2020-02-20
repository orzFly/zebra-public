import exitHook from 'exit-hook';

namespace ansiEscapes {
  export const eraseLine = '\x1B[2K';
  export const cursorDown = (count: number = 1) => `\x1B[${count}B`
  export const cursorUp = (count: number = 1) => `\x1B[${count}A`
  export const cursorTo = (x: number, y: number) => `\x1B[${y};${x}H`
  export const setTopBottomMargin = (top: number = 1, bottom?: number) => `\x1B[${top};${bottom || ""}r`
  export const resetTopBottomMargin = `\x1B[;r`

  export let cursorSavePosition = '\x1B7';
  export let cursorRestorePosition = '\x1B8';
}

interface ITermSize {
  rows: number;
  columns: number;
}

class MarlineLineArray {
  private readonly buffer: string[]
  private readonly dirty: boolean[]

  constructor(public readonly length: number) {
    this.buffer = new Array(length).fill("");
    this.dirty = new Array(length).fill(false);
  }

  public set(index: number, text?: string | null | undefined) {
    text = String(text || "");
    if (this.buffer[index] === text) return;
    this.buffer[index] = text;
    this.dirty[index] = true;
  }

  public get(index: number) {
    return this.buffer[index];
  }

  public isDirty(index: number) {
    return this.dirty[index];
  }

  /** @internal */
  public cleanDirty(index: number) {
    this.dirty[index] = false;
  }

  public clean() {
    this.dirty.fill(true);
    this.buffer.fill("");
  }
}

export type MarlineRenderCallback = (this: Marline, marline: Marline, width: number) => any

export class Marline {
  readonly stream: NodeJS.WriteStream;
  readonly marginBottom: number
  readonly marginTop: number
  readonly top: MarlineLineArray
  readonly bottom: MarlineLineArray
  readonly isAvailable: boolean
  private renderCallback?: MarlineRenderCallback

  constructor(options: {
    stream?: NodeJS.WriteStream,
    marginBottom?: number,
    marginTop?: number,
    render?: MarlineRenderCallback,
  } = {}) {
    this.stream = options.stream || process.stderr;
    this.isAvailable = false;
    do {
      if (!this.stream.isTTY) break;

      this._termSize = this.getTermSize();
      if (!this._termSize) break;

      this.isAvailable = true;
    } while (false);

    this.marginBottom = options.marginBottom === undefined ? 1 : options.marginBottom
    this.marginTop = options.marginTop === undefined ? 0 : options.marginTop

    this.top = new MarlineLineArray(this.marginTop);
    this.bottom = new MarlineLineArray(this.marginBottom);

    this.renderCallback = options.render;
  }

  private getTermSize() {
    if (this.stream && this.stream.columns && this.stream.rows) {
      return { columns: this.stream.columns, rows: this.stream.rows };
    }
    return undefined;
  }

  private _termSize?: ITermSize | undefined
  get termSize() {
    return this._termSize
  }

  get width() {
    return this._termSize ? this._termSize.columns : 0;
  }

  private handleStdoutResize$ = this.handleStdoutResize.bind(this)
  private handleStdoutResize() {
    if (!this.isAvailable) return;

    this._termSize = this.getTermSize();
    if (this._started) {
      this.setMargin();
      this.refresh(true);
    }
  }

  private _started: boolean = false
  get started() {
    return this._started;
  }

  private _resizeListened: boolean = false

  start() {
    if (!this.isAvailable) return;
    if (this._started) return;
    if (activeMarline) throw new Error('Another Marline instance is running.');
    installExitHook();
    this._started = true;
    activeMarline = this;
    if (!this._resizeListened) {
      this._resizeListened = true;
      this.stream.addListener('resize', this.handleStdoutResize$);
    }

    this.handleStdoutResize();
    this.setMargin();
    this.redrawInternal(true);
  }

  stop() {
    if (!this._started) return;
    this._started = false;
    activeMarline = null;

    if (this._resizeListened) {
      if (this.stream.removeListener) {
        try {
          this.stream.removeListener('resize', this.handleStdoutResize$);
          this._resizeListened = false;
        } catch (e) { }
      }
    }

    if (!this.isAvailable) return;
    this.resetMargin();
    this.top.clean();
    this.bottom.clean();
    this.redrawInternal(true);
  }

  private get canDraw() {
    return this.isAvailable && this._termSize;
  }

  private setMargin() {
    if (!this.canDraw) return;

    const seq: string[] = [];
    seq.push(ansiEscapes.cursorSavePosition);
    seq.push(ansiEscapes.resetTopBottomMargin);
    seq.push(ansiEscapes.cursorRestorePosition);
    if (this.marginBottom > 0) {
      seq.push(ansiEscapes.cursorSavePosition);
      for (let i = 0; i < this.marginBottom; i++) {
        seq.push(`\n`);
      }
      seq.push(ansiEscapes.cursorRestorePosition);
      seq.push(ansiEscapes.cursorDown(this.marginBottom));
      seq.push(ansiEscapes.cursorUp(this.marginBottom));
    }
    seq.push(ansiEscapes.cursorSavePosition);
    seq.push(ansiEscapes.setTopBottomMargin(1 + this.marginTop, this._termSize!.rows - this.marginBottom));
    seq.push(ansiEscapes.cursorRestorePosition);
    this.stream.write(seq.join(""));
  }

  private resetMargin() {
    if (!this.canDraw) return;

    const seq: string[] = [];
    seq.push(ansiEscapes.cursorSavePosition);
    seq.push(ansiEscapes.resetTopBottomMargin);
    seq.push(ansiEscapes.cursorRestorePosition);

    this.stream.write(seq.join(""));
  }

  public refresh(force: boolean = false) {
    if (!this._started) return;
    if (this.renderCallback) this.renderCallback.call(this, this, this.width);
    this.redrawInternal(force);
  }

  public redraw(force: boolean = false) {
    if (!this._started) return;
    this.redrawInternal(force);
  }

  private redrawInternal(force: boolean = false) {
    if (!this.canDraw) return;

    const seq: string[] = [];
    const topIndexes: number[] = [];
    const bottomIndexes: number[] = [];

    seq.push(ansiEscapes.cursorSavePosition);

    for (let i = 0; i < this.marginTop; i++) {
      if (!force && !this.top.isDirty(i)) continue;
      topIndexes.push(i);
      seq.push(this.redrawTopLineSeq(i));
    }

    for (let i = 0; i < this.marginBottom; i++) {
      if (!force && !this.bottom.isDirty(i)) continue;
      bottomIndexes.push(i);
      seq.push(this.redrawBottomLineSeq(i));
    }

    seq.push(ansiEscapes.cursorRestorePosition);

    if (topIndexes.length === 0 && bottomIndexes.length === 0) return;
    this.stream.write(seq.join(""));

    for (const i of topIndexes) this.top.cleanDirty(i);
    for (const i of bottomIndexes) this.bottom.cleanDirty(i);
  }

  private redrawTopLineSeq(index: number) {
    return ansiEscapes.cursorTo(1, index + 1) +
      ansiEscapes.eraseLine +
      this.top.get(index);
  }

  private redrawBottomLineSeq(index: number) {
    return ansiEscapes.cursorTo(1, this._termSize!.rows - this.marginBottom + index + 1) +
      ansiEscapes.eraseLine +
      this.bottom.get(index);
  }
}

let activeMarline: Marline | null = null;
let exitHookInstalled = false;
function installExitHook() {
  if (exitHookInstalled) return;

  exitHookInstalled = true;
  exitHook(() => {
    if (activeMarline) activeMarline.stop();
  })
}