import { ppath } from "@yarnpkg/fslib";
import { inspect } from "util";
import { PipelineAction, Project } from "./Project";
import { Solution } from "./Solution";

export type Tag =
  | { type: "solution", solution: Solution }
  | { type: "project", project: Project }
  | { type: "projectDependency", project: Project }
  | { type: "action", project: Project, action: PipelineAction }

export function makeTag(tag: Tag, inspector?: (this: Tag) => string ): Tag {
  Object.assign(tag, {
    toString: inspector,
    [inspect.custom]: inspector
  })
  return tag;
}

export function createSolutionTag(solution: Solution): Tag {
  return makeTag({
    type: "solution",
    solution
  }, () => ["<Solution>", ppath.basename(solution.solutionRoot)].join("#"));
}

export function createProjectTag(project: Project): Tag {
  return makeTag({
    type: "project",
    project
  }, () => ["<Project>", project.name].join("#"));
}

export function createProjectDependencyTag(project: Project): Tag {
  return makeTag({
    type: "projectDependency",
    project
  }, () => ["<ProjectDependency>", project.name].join("#"));
}

export function createActionTag(project: Project, action: PipelineAction) {
  return makeTag({
    type: "action",
    project, action,
  }, () => ["<Action>", project.name, action.name].join("#"));
}
