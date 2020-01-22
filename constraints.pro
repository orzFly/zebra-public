% This rule will prevent all workspaces from depending on tslib
gen_enforced_dependency(WorkspaceCwd, 'tslib', null, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, 'tslib', _, DependencyType).

% This rule will prevent all workspaces from depending on stub packages
gen_enforced_dependency(WorkspaceCwd, '@types/axios', null, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, '@types/axios', _, DependencyType).

gen_enforced_field(WorkspaceCwd, license, 'UNLICENSED') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, license, _).

gen_enforced_field(WorkspaceCwd, 'scripts.clean', 'rimraf dist') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'orz.builder', false).

gen_enforced_field(WorkspaceCwd, 'scripts.build', 'tsc') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'orz.builder', false).

gen_enforced_field(WorkspaceCwd, 'scripts.watch', 'tsc --watch --preserveWatchOutput') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'orz.builder', false).

gen_enforced_field(WorkspaceCwd, 'scripts.cleanbuild', 'run-s clean build') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'orz.builder', false).

gen_enforced_field(WorkspaceCwd, 'scripts.cleanwatch', 'run-s clean watch') :-
    workspace(WorkspaceCwd),
    \+ workspace_field(WorkspaceCwd, 'orz.builder', false).
