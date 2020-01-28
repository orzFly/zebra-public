% This rule will prevent all workspaces from depending on tslib
gen_enforced_dependency(WorkspaceCwd, 'tslib', null, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, 'tslib', _, DependencyType).

% This rule will prevent all workspaces from depending on stub packages
gen_enforced_dependency(WorkspaceCwd, '@types/axios', null, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, '@types/axios', _, DependencyType).

gen_enforced_field(WorkspaceCwd, license, 'UNLICENSED') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, license, _).

gen_enforced_field(WorkspaceCwd, 'scripts.clean', 'invoke pipeline clean') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false).

gen_enforced_field(WorkspaceCwd, 'scripts.build', 'invoke pipeline build') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false).

gen_enforced_field(WorkspaceCwd, 'scripts.watch', 'invoke pipeline watch') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false).

gen_enforced_field(WorkspaceCwd, 'scripts.cleanbuild', 'invoke pipeline cleanbuild') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false).

gen_enforced_field(WorkspaceCwd, 'scripts.cleanwatch', 'invoke pipeline cleanwatch') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false).

gen_enforced_field(WorkspaceCwd, 'scripts.lint', 'invoke pipeline lint') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false).

gen_enforced_field(WorkspaceCwd, 'scripts.fix', 'invoke pipeline fix') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false).

gen_enforced_field(WorkspaceCwd, 'invoke/pipeline.typescript.build', 'tsc') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.typescript', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.$auto', false).

gen_enforced_field(WorkspaceCwd, 'invoke/pipeline.typescript.watch', 'tsc --watch --preserveWatchOutput') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.typescript', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.$auto', false).

gen_enforced_field(WorkspaceCwd, 'invoke/pipeline.typescript.clean', 'rimraf lib') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.typescript', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.$auto', false).

gen_enforced_field(WorkspaceCwd, 'invoke/pipeline.typescript.lint', 'tslint --project tsconfig.json --config tslint.json') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.typescript', false),
    \+ workspace_field(WorkspaceCwd, 'invoke/pipeline.$auto', false).
