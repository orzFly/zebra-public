import { PortablePath, xfs } from '@yarnpkg/fslib';

export enum PipelineStage {
  build = "build",
  watch = "watch",
  clean = "clean",
  lint = "lint",
  fix = "fix",
  dev = "dev",
  dist = "dist",
}

export enum PipelineVirtualStage {
  rebuild = "rebuild",
  cleanbuild = "cleanbuild",
  cleanwatch = "cleanwatch",
}

export type PipelineStageCommands = {
  [K in PipelineStage]?: string
}

export interface PipelineMetaConfig {
  $requires?: string | string[] | null
}

export interface PackageManifest {
  name: string
  workspaces?: string[]

  dependencies?: Record<string, any>
  devDependencies?: Record<string, any>
  peerDependencies?: Record<string, any>

  "invoke/pipeline"?: Record<string, PipelineMetaConfig & PipelineStageCommands>
}

function stripBOM(content: string) {
  if (content.charCodeAt(0) === 0xFEFF) {
    return content.slice(1);
  } else {
    return content;
  }
}

export async function loadPackageManifest(file: PortablePath): Promise<PackageManifest> {
  const body = await xfs.readFilePromise(file, "utf8")
  return JSON.parse(stripBOM(body))
}
