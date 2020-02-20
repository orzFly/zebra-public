// https://github.com/C5H8NNaO4/node-resolve-dependency-graph/blob/master/src/libs/resolve.js

type Nodes<T> = Map<T, Node<T>>

type Node<T> = { edges: Node<T>[], name: T }

const Node = <T>(name: T): Node<T> => ({
  edges: [],
  name
});

function addEdges<T>(nodes: Nodes<T>, key: T, edges: T[]) {
  const node = nodes.get(key)!;
  for (const edge of edges) {
    if (!nodes.has(edge)) throw new Error(`Unmet dependency '${edge}' at node ${node.name}`)
    node.edges.push(nodes.get(edge)!);
  }
}

function resolveDependencies<T>(node: Node<T>, resolved: Node<T>[], unresolved: Node<T>[]) {
  unresolved.push(node);
  for (const edge of node.edges) {
    if (!~resolved.indexOf(edge)) {
      if (!!~unresolved.indexOf(edge)) throw new Error(`Circular dependency '${edge}' at node '${node.name}`);
      resolveDependencies(edge, resolved, unresolved)
    }
  }
  resolved.push(node)
  unresolved.splice(resolved.indexOf(node), 1)
  return resolved;
}

function genNodes<T>(graph: DepMap<T>) {
  const nodes: Nodes<T> = new Map<T, Node<T>>();
  for (const key of graph.keys()) {
    nodes.set(key, Node(key))
  }
  for (const [key, edges] of graph) {
    const node = nodes.get(key)!
    if (node) addEdges(nodes, key, edges);
  }
  return nodes;
}

const list = <T>(result: NodeResult<T>) => result.map((resolved) => resolved.map((node) => node.name));

export const flat = <T>(result: Result<T>) => result
  .reduce((flat, cur) => [...flat, ...cur])
  .reverse().filter((e, i, a) => !~a.indexOf(e, i + 1)).reverse()

export const map = <T>(result: Result<T>) => result
  .map((sub) => sub.slice(0))
  .reduce((map, result) => map.set(result[result.length - 1], result), new Map<T, T[]>());

type Tree<T> = Map<T, Tree<T> | null>
export const tree = <T>(result: Result<T>) => {
  const tmp = map(result);
  const tree = new Map() as Tree<T>;
  for (const [key, flat] of tmp) {
    const first = flat.length == 1 ? null : new Map() as Tree<T>;
    let node = first;
    for (let i = 0; i < flat.length - 1; i++) {
      const cur = flat[i];
      const val = i == flat.length - 2 ? null : new Map() as Tree<T>;
      node!.set(cur, val);
      node = val;
    }
    tree.set(key, first)
  }
  return tree;
}

export function newDepMap<T>(): DepMap<T> {
  return new Map();
}

export function mergeDepMap<T>(target: DepMap<T>, source: DepMap<T>) {
  for (const [key, edges] of source) {
    if (!target.has(key)) target.set(key, []);
    target.get(key)!.push(...edges);
  }
  return target;
}

export type DepMap<T> = Map<T, T[]>
type NodeResult<T> = Array<Node<T>[]>
type Result<T> = Array<T[]>

export const resolve = <T>(depMap: DepMap<T>) => {
  const result: NodeResult<T> = [], nodes = genNodes(depMap);
  for (const [, node] of nodes) {
    const resolved = resolveDependencies(node, [], []);
    result.push(resolved);
  }
  return list(result);
}

export const resolveMap = <T>(depMap: DepMap<T>) => {
  return map(resolve(depMap))
}