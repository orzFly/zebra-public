import { Transform, TransformCallback, TransformOptions, Writable } from "stream";
import { StringDecoder } from "string_decoder";

export class PrefixStream extends Transform {
  constructor(public prefix: string, opts?: TransformOptions) {
    super({ ...opts, decodeStrings: false })
  }

  decoder = new StringDecoder();
  buffer = "";

  newChunk(chunkStr: string) {
    let lineIndex;

    const result: string[] = [];
    do {
      lineIndex = chunkStr.indexOf(`\n`);

      if (lineIndex !== -1) {
        const line = this.buffer + chunkStr.substr(0, lineIndex);

        chunkStr = chunkStr.substr(lineIndex + 1);
        this.buffer = ``;

        result.push(`${this.prefix}${line}\n`);
      }
    } while (lineIndex !== -1);

    this.buffer += chunkStr;
    return result;
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
    const result = this.newChunk(this.decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)));
    callback(null, result.join(""))
  }

  _flush(callback: TransformCallback) {
    const result = this.newChunk(this.decoder.end());
    if (this.buffer) {
      result.push(`${this.prefix}${this.buffer}\n`);
    }
    this.buffer = '';
    callback(null, result.join(""))
  }
}

export function createPrefixStream(underlyingStream: Writable, prefix: string) {
  const stream = new PrefixStream(prefix);
  stream.pipe(underlyingStream);

  const streamEnd = new Promise((resolve) => {
    stream.on('finish', () => resolve())
  })
  return [stream, streamEnd] as const;
}
