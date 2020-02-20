import { EventEmitter } from "events";
import { LazyGetter } from 'lazy-get-decorator';
import PQueue from 'p-queue';
import TypedEmitter from 'typed-emitter';
import { Defer } from '../utilities/Defer';
import { Assert } from "./Assert";
import { DepMap, map, resolve } from "./DependencyGraph";

export interface ExecutionQueueEvents {
  jobQueued(tag: any): void
  jobFinished(tag: any): void
}

export class DependencyExecutor<T, R> extends (EventEmitter as new () => TypedEmitter<ExecutionQueueEvents>) {
  constructor(
    public readonly depMap: DepMap<T>,
    public readonly jobRunner: (tag: T) => Promise<R>,
    public readonly queue = new PQueue({}),
  ) {
    super();
  }

  public readonly jobMap = new Map<T, Promise<R>>();
  public readonly finishedJobSet = new Set<T>();
  public execute(tag: T) {
    if (this.jobMap.has(tag)) return this.jobMap.get(tag)!;

    const steps = this.executionPlan.get(tag)!
    Assert(steps, `No execution plan found for ${tag}`)
    Assert(steps.length >= 1, `Invalid execution plan ${tag}`);
    Assert(steps[steps.length - 1] === tag, `Invalid execution plan ${tag}`);

    const defer = new Defer<R>();
    this.jobMap.set(tag, defer.promise);
    this.emit('jobQueued', tag)

    void (async () => {
      try {
        const children = steps.slice(0, steps.length - 1)
        if (children.length > 0) {
          await Promise.all(children.map((i) => this.execute(i)))
        }

        defer.resolve(await this.queue.add(() => this.jobRunner(tag)))
      } catch (e) {
        defer.reject(e);
      } finally {
        this.finishedJobSet.add(tag)
        this.emit('jobFinished', tag)
      }
    })();

    return defer.promise;
  }

  @LazyGetter()
  public get resolved() { return resolve(this.depMap) }

  @LazyGetter()
  public get executionPlan() { return map(this.resolved) }

}
