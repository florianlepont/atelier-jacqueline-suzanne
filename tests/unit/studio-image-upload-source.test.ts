import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IMAGE_UPLOAD_CONFIG } from '../../sanity/editorial/imageUploadConfig';
import type { ImageUploadNotice } from '../../sanity/editorial/imageUploadLogic';
import type { ProcessResult } from '../../sanity/editorial/imageUploadProcessor';
import {
  PROCESSING_TIMEOUT_MS,
  TIMED_OUT,
  createProcessingUploaderClass,
  createSerialQueue,
  resolveImageAssetSources,
  withImageProcessing,
  withTimeout,
} from '../../sanity/editorial/imageUploadSource';
import {
  emitUploadNotice,
  subscribeToUploadNotices,
} from '../../sanity/editorial/uploadNoticeChannel';
import type { UploadNoticeEvent } from '../../sanity/editorial/uploadNoticeChannel';

// The root project does not resolve the 'sanity' package, so derive the Studio
// types from the module under test instead of importing them.
type AssetSource = Parameters<typeof withImageProcessing>[0];
type BaseClass = Parameters<typeof createProcessingUploaderClass>[0];
type BaseUploader = InstanceType<BaseClass>;
type UploadFile = ReturnType<BaseUploader['getFiles']>[number];
type UploadEvent = Parameters<Parameters<BaseUploader['subscribe']>[0]>[0];
type UploadOptions = Parameters<BaseUploader['upload']>[1];

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

class FakeBaseUploader implements BaseUploader {
  static instances: FakeBaseUploader[] = [];

  uploadCalls: { files: File[]; options: UploadOptions }[] = [];
  abortCalls: (UploadFile | undefined)[] = [];
  updateCalls: { id: string; data: unknown }[] = [];
  resetCalls = 0;
  files: UploadFile[] = [];
  throwOnUpload: Error | null = null;
  private subscribers = new Set<(event: UploadEvent) => void>();

  constructor() {
    FakeBaseUploader.instances.push(this);
  }

  upload(files: File[], options?: UploadOptions): UploadFile[] {
    if (this.throwOnUpload) throw this.throwOnUpload;
    this.uploadCalls.push({ files, options });
    this.files = files.map((file, index) => ({
      id: `inner-${index}`,
      file,
      progress: 0,
      status: 'uploading',
    }));
    return this.files;
  }

  abort(file?: UploadFile) {
    this.abortCalls.push(file);
  }

  getFiles() {
    return this.files;
  }

  subscribe(subscriber: (event: UploadEvent) => void) {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  updateFile(id: string, data: unknown) {
    this.updateCalls.push({ id, data });
  }

  reset() {
    this.resetCalls += 1;
  }

  emit(event: UploadEvent) {
    for (const subscriber of [...this.subscribers]) subscriber(event);
  }
}

function makeFile(name = 'photo.jpg') {
  return new File([new Uint8Array(10)], name, { type: 'image/jpeg' });
}

function processedResult(file: File, name = 'out.jpg'): ProcessResult {
  return {
    status: 'processed',
    file: new File([new Uint8Array(4)], name, { type: 'image/jpeg' }),
    original: { width: 6000, height: 4000, bytes: file.size },
    output: { width: 2400, height: 1600, bytes: 4 },
    resized: true,
    signed: true,
  };
}

interface Setup {
  Uploader: ReturnType<typeof createProcessingUploaderClass>;
  notices: UploadNoticeEvent[];
  process: ReturnType<typeof vi.fn<(file: File) => Promise<ProcessResult>>>;
  queue: ReturnType<typeof createSerialQueue>;
}

function setup(
  implementation: (file: File) => Promise<ProcessResult> = (file) =>
    Promise.resolve(processedResult(file)),
  timeoutMs?: number,
): Setup {
  const notices: UploadNoticeEvent[] = [];
  const process = vi.fn(implementation);
  const queue = createSerialQueue(() => notices.push({ kind: 'idle' }));
  const Uploader = createProcessingUploaderClass(FakeBaseUploader, {
    process,
    queue,
    notify: (event) => notices.push(event),
    timeoutMs,
  });
  return { Uploader, notices, process, queue };
}

function collectEvents(uploader: BaseUploader) {
  const events: UploadEvent[] = [];
  uploader.subscribe((event) => events.push(event));
  return events;
}

beforeEach(() => {
  FakeBaseUploader.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('upload notice channel', () => {
  it('delivers events to every listener in subscription order and stops after unsubscribe', () => {
    const received: string[] = [];
    const first = subscribeToUploadNotices((event) => received.push(`first:${event.kind}`));
    const second = subscribeToUploadNotices((event) => received.push(`second:${event.kind}`));
    emitUploadNotice({ kind: 'idle' });
    first();
    emitUploadNotice({ kind: 'idle' });
    second();
    emitUploadNotice({ kind: 'idle' });
    expect(received).toEqual(['first:idle', 'second:idle', 'second:idle']);
  });

  it('isolates a throwing listener', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const received: string[] = [];
    const noisy = subscribeToUploadNotices(() => {
      throw new Error('listener bug');
    });
    const quiet = subscribeToUploadNotices((event) => received.push(event.kind));
    expect(() => emitUploadNotice({ kind: 'idle' })).not.toThrow();
    expect(received).toEqual(['idle']);
    noisy();
    quiet();
  });

  it('is a no-op without listeners', () => {
    expect(() => emitUploadNotice({ kind: 'idle' })).not.toThrow();
  });
});

describe('createSerialQueue', () => {
  it('never overlaps tasks, even after a rejection, and returns each result', async () => {
    const queue = createSerialQueue();
    const first = deferred<string>();
    const log: string[] = [];
    const a = queue.enqueue(async () => {
      log.push('a:start');
      const value = await first.promise;
      log.push('a:end');
      return value;
    });
    const b = queue.enqueue(async () => {
      log.push('b:start');
      throw new Error('b failed');
    });
    const c = queue.enqueue(async () => {
      log.push('c:start');
      return 'c';
    });
    await flush();
    expect(log).toEqual(['a:start']);
    first.resolve('a');
    await expect(a).resolves.toBe('a');
    await expect(b).rejects.toThrow('b failed');
    await expect(c).resolves.toBe('c');
    expect(log).toEqual(['a:start', 'a:end', 'b:start', 'c:start']);
  });

  it('fires the idle callback once per batch, after the last task settled', async () => {
    const log: string[] = [];
    const queue = createSerialQueue(() => log.push('idle'));
    await Promise.all([
      queue.enqueue(async () => log.push('one')),
      queue.enqueue(async () => log.push('two')),
    ]);
    await flush();
    expect(log).toEqual(['one', 'two', 'idle']);
    await queue.enqueue(async () => log.push('three'));
    await flush();
    expect(log).toEqual(['one', 'two', 'idle', 'three', 'idle']);
  });

  it('survives a throwing idle callback', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const queue = createSerialQueue(() => {
      throw new Error('idle bug');
    });
    await expect(queue.enqueue(async () => 'ok')).resolves.toBe('ok');
    await expect(queue.enqueue(async () => 'again')).resolves.toBe('again');
  });
});

describe('withTimeout', () => {
  it('resolves with the value when the promise settles first and clears its timer', async () => {
    vi.useFakeTimers();
    await expect(withTimeout(Promise.resolve('done'), 1000)).resolves.toBe('done');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('resolves with the timeout marker when the promise does not settle', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<string>(() => undefined), 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toBe(TIMED_OUT);
  });

  it('uses a 30 s default processing timeout', () => {
    expect(PROCESSING_TIMEOUT_MS).toBe(30000);
  });
});

describe('createProcessingUploaderClass', () => {
  it('returns pending placeholders synchronously and uploads the processed file afterwards', async () => {
    const gate = deferred<ProcessResult>();
    const { Uploader, process } = setup(() => gate.promise);
    const uploader = new Uploader();
    const inner = FakeBaseUploader.instances[0];
    const file = makeFile();
    const options = { onChange: vi.fn() };

    const placeholders = uploader.upload([file], options);
    expect(placeholders).toHaveLength(1);
    expect(placeholders[0]).toMatchObject({ status: 'pending', progress: 0 });
    expect(placeholders[0].file).toBe(file);
    expect(uploader.getFiles()).toEqual(placeholders);
    expect(inner.uploadCalls).toHaveLength(0);

    const result = processedResult(file);
    gate.resolve(result);
    await flush();

    expect(process).toHaveBeenCalledWith(file, IMAGE_UPLOAD_CONFIG);
    expect(inner.uploadCalls).toHaveLength(1);
    expect(inner.uploadCalls[0].files).toEqual([(result as { file: File }).file]);
    expect(inner.uploadCalls[0].options).toBe(options);
    // After delegation getFiles reflects the inner uploader.
    expect(uploader.getFiles()).toBe(inner.files);
  });

  it('emits a processed notice before the task resolves, then idle', async () => {
    const { Uploader, notices } = setup();
    const uploader = new Uploader();
    uploader.upload([makeFile('IMG_1.jpg')], {});
    await flush();
    expect(notices).toEqual([
      {
        kind: 'processed',
        fileName: 'IMG_1.jpg',
        original: { width: 6000, height: 4000, bytes: 10 },
        output: { width: 2400, height: 1600, bytes: 4 },
        resized: true,
        signed: true,
      },
      { kind: 'idle' },
    ]);
  });

  it('delegates the original file and stays silent on a skipped result', async () => {
    const file = makeFile('anim.gif');
    const { Uploader, notices } = setup(() =>
      Promise.resolve({ status: 'skipped', file, reason: 'unsupported-type' }),
    );
    const uploader = new Uploader();
    uploader.upload([file], {});
    await flush();
    expect(FakeBaseUploader.instances[0].uploadCalls[0].files).toEqual([file]);
    expect(FakeBaseUploader.instances[0].uploadCalls[0].files[0]).toBe(file);
    expect(notices.filter((notice) => notice.kind !== 'idle')).toEqual([]);
  });

  it('delegates the original, warns and logs once on a failed result', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const file = makeFile();
    const { Uploader, notices } = setup(() =>
      Promise.resolve({ status: 'failed', file, reason: 'decode-failed', detail: 'bad' }),
    );
    new Uploader().upload([file], {});
    await flush();
    expect(FakeBaseUploader.instances[0].uploadCalls[0].files[0]).toBe(file);
    expect(notices[0]).toEqual({
      kind: 'fallback',
      fileName: 'photo.jpg',
      reason: 'decode-failed',
    });
    expect(consoleError).toHaveBeenCalledTimes(1);
    const logged = String(consoleError.mock.calls[0][0]);
    expect(logged).toContain('[image-upload]');
    expect(logged).toContain('photo.jpg');
    expect(logged).toContain('decode-failed');
    expect(logged).toContain('bad');
  });

  it.each([
    ['throws', () => Promise.reject(new Error('kaput'))],
    [
      'throws synchronously',
      () => {
        throw new Error('kaput');
      },
    ],
  ])('treats a process that %s as an unexpected failure', async (_label, implementation) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const file = makeFile();
    const { Uploader, notices } = setup(implementation);
    new Uploader().upload([file], {});
    await flush();
    expect(FakeBaseUploader.instances[0].uploadCalls[0].files[0]).toBe(file);
    expect(notices[0]).toEqual({ kind: 'fallback', fileName: 'photo.jpg', reason: 'unexpected' });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('cuts a process that never settles and lets the queue proceed', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const stuck = makeFile('stuck.jpg');
    const fine = makeFile('fine.jpg');
    const { Uploader, notices } = setup((file) =>
      file === stuck
        ? new Promise<ProcessResult>(() => undefined)
        : Promise.resolve(processedResult(file)),
    );
    new Uploader().upload([stuck], {});
    new Uploader().upload([fine], {});
    await vi.advanceTimersByTimeAsync(PROCESSING_TIMEOUT_MS);
    expect(notices[0]).toEqual({ kind: 'fallback', fileName: 'stuck.jpg', reason: 'timeout' });
    expect(FakeBaseUploader.instances[0].uploadCalls[0].files[0]).toBe(stuck);
    expect(notices[1]).toMatchObject({ kind: 'processed', fileName: 'fine.jpg' });
    expect(FakeBaseUploader.instances[1].uploadCalls).toHaveLength(1);
  });

  it('honours a custom timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { Uploader, notices } = setup(() => new Promise<ProcessResult>(() => undefined), 50);
    new Uploader().upload([makeFile()], {});
    await vi.advanceTimersByTimeAsync(50);
    expect(notices[0]).toMatchObject({ kind: 'fallback', reason: 'timeout' });
  });

  it('processes the files of one call one by one and uploads them together, in order', async () => {
    const order: string[] = [];
    const { Uploader } = setup(async (file) => {
      order.push(`start:${file.name}`);
      await flush();
      order.push(`end:${file.name}`);
      return processedResult(file, `out-${file.name}`);
    });
    const uploader = new Uploader();
    uploader.upload([makeFile('a.jpg'), makeFile('b.jpg')], {});
    await flush();
    await flush();
    await flush();
    expect(order).toEqual(['start:a.jpg', 'end:a.jpg', 'start:b.jpg', 'end:b.jpg']);
    expect(FakeBaseUploader.instances[0].uploadCalls[0].files.map((file) => file.name)).toEqual([
      'out-a.jpg',
      'out-b.jpg',
    ]);
  });

  it('forwards inner events to subscribers until they unsubscribe', () => {
    const { Uploader } = setup();
    const uploader = new Uploader();
    const received: UploadEvent[] = [];
    const unsubscribe = uploader.subscribe((event) => received.push(event));
    const event: UploadEvent = { type: 'all-complete', files: [] };
    FakeBaseUploader.instances[0].emit(event);
    unsubscribe();
    FakeBaseUploader.instances[0].emit(event);
    expect(received).toEqual([event]);
  });

  it('delegates updateFile and reset to the inner uploader', () => {
    const { Uploader } = setup();
    const uploader = new Uploader();
    uploader.updateFile('x', { progress: 50 });
    uploader.reset();
    expect(FakeBaseUploader.instances[0].updateCalls).toEqual([
      { id: 'x', data: { progress: 50 } },
    ]);
    expect(FakeBaseUploader.instances[0].resetCalls).toBe(1);
  });

  it('marks the class so it is never wrapped twice', () => {
    const { Uploader } = setup();
    expect(Uploader.imageProcessing).toBe(true);
  });

  describe('abort', () => {
    it('stops a file that is being processed and tells subscribers', async () => {
      const gate = deferred<ProcessResult>();
      const { Uploader, notices } = setup(() => gate.promise);
      const uploader = new Uploader();
      const events = collectEvents(uploader);
      const placeholders = uploader.upload([makeFile()], {});

      uploader.abort();
      expect(events.map((event) => event.type)).toEqual(['abort', 'all-complete']);
      for (const event of events) {
        if (event.type === 'abort' || event.type === 'all-complete') {
          expect(event.files).toEqual(placeholders);
          expect(event.files.every((file) => file.status === 'aborted')).toBe(true);
        }
      }

      gate.resolve(processedResult(placeholders[0].file));
      await flush();
      expect(FakeBaseUploader.instances[0].uploadCalls).toHaveLength(0);
      expect(notices.filter((notice) => notice.kind !== 'idle')).toEqual([]);
      expect(uploader.getFiles()).toEqual([]);
    });

    it('skips process entirely for a queued task', async () => {
      const gate = deferred<ProcessResult>();
      const first = makeFile('first.jpg');
      const second = makeFile('second.jpg');
      const { Uploader, process } = setup((file) =>
        file === first ? gate.promise : Promise.resolve(processedResult(file)),
      );
      new Uploader().upload([first], {});
      const queued = new Uploader();
      queued.upload([second], {});
      queued.abort();
      gate.resolve(processedResult(first));
      await flush();
      await flush();
      expect(process).toHaveBeenCalledTimes(1);
      expect(FakeBaseUploader.instances[0].uploadCalls).toHaveLength(1);
      expect(FakeBaseUploader.instances[1].uploadCalls).toHaveLength(0);
    });

    it('forwards abort to the inner uploader after delegation', async () => {
      const { Uploader } = setup();
      const uploader = new Uploader();
      uploader.upload([makeFile()], {});
      await flush();
      const target = FakeBaseUploader.instances[0].files[0];
      uploader.abort(target);
      uploader.abort();
      expect(FakeBaseUploader.instances[0].abortCalls).toEqual([target, undefined]);
    });
  });

  it('surfaces a synchronous inner upload failure as error then all-complete', async () => {
    const { Uploader } = setup();
    const uploader = new Uploader();
    const failure = new Error('inner broke');
    FakeBaseUploader.instances[0].throwOnUpload = failure;
    const events = collectEvents(uploader);
    uploader.upload([makeFile()], {});
    await flush();
    expect(events.map((event) => event.type)).toEqual(['error', 'all-complete']);
    const [errorEvent] = events;
    if (errorEvent.type !== 'error') throw new Error('unreachable');
    expect(errorEvent.files[0]).toMatchObject({ status: 'error', error: failure });
  });

  it('wraps a non-Error inner failure', async () => {
    const { Uploader } = setup();
    const uploader = new Uploader();
    const inner = FakeBaseUploader.instances[0];
    inner.upload = () => {
      throw 'plain string';
    };
    const events = collectEvents(uploader);
    uploader.upload([makeFile()], {});
    await flush();
    const [errorEvent] = events;
    if (errorEvent.type !== 'error') throw new Error('unreachable');
    expect(errorEvent.files[0].error?.message).toBe('plain string');
  });

  it('does not let a throwing notify break the upload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Uploader = createProcessingUploaderClass(FakeBaseUploader, {
      process: (file) => Promise.resolve(processedResult(file)),
      queue: createSerialQueue(),
      notify: () => {
        throw new Error('toast bug');
      },
    });
    new Uploader().upload([makeFile()], {});
    await flush();
    expect(FakeBaseUploader.instances[0].uploadCalls).toHaveLength(1);
  });

  it('shares the queue between instances and emits idle once, after both notices', async () => {
    let running = 0;
    let maxRunning = 0;
    const { Uploader, notices } = setup(async (file) => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await flush();
      running -= 1;
      return processedResult(file);
    });
    new Uploader().upload([makeFile('a.jpg')], {});
    new Uploader().upload([makeFile('b.jpg')], {});
    await flush();
    await flush();
    await flush();
    await flush();
    expect(maxRunning).toBe(1);
    expect(notices.map((notice) => notice.kind)).toEqual(['processed', 'processed', 'idle']);
  });

  it('uses the module-level queue and notice channel by default', async () => {
    const received: UploadNoticeEvent[] = [];
    const unsubscribe = subscribeToUploadNotices((event) => received.push(event));
    const file = makeFile('default.jpg');
    const Uploader = createProcessingUploaderClass(FakeBaseUploader, {
      process: () =>
        Promise.resolve({
          status: 'processed',
          file,
          original: { width: 1, height: 1, bytes: 1 },
          output: { width: 1, height: 1, bytes: 1 },
          resized: false,
          signed: true,
        }),
    });
    new Uploader().upload([file], {});
    await flush();
    unsubscribe();
    expect(received.map((event) => event.kind)).toEqual(['processed', 'idle']);
    const notice = received[0] as ImageUploadNotice;
    expect(notice.kind === 'processed' && notice.fileName).toBe('default.jpg');
  });
});

describe('withImageProcessing and resolveImageAssetSources', () => {
  const component = () => null;
  const icon = () => null;
  const openInSource = () => undefined;
  const defaultSource = (): AssetSource => ({
    name: 'sanity-default',
    title: 'Téléverser',
    i18nKey: 'asset-source.dataset.title',
    component,
    icon,
    Uploader: FakeBaseUploader,
    uploadMode: 'picker',
    openInSource,
  });

  it('returns a new source with only the Uploader replaced', () => {
    const source = defaultSource();
    const wrapped = withImageProcessing(source);
    expect(wrapped).not.toBe(source);
    expect(wrapped.name).toBe('sanity-default');
    expect(wrapped.title).toBe(source.title);
    expect(wrapped.i18nKey).toBe(source.i18nKey);
    expect(wrapped.component).toBe(component);
    expect(wrapped.icon).toBe(icon);
    expect(wrapped.uploadMode).toBe('picker');
    expect(wrapped.openInSource).toBe(openInSource);
    expect(wrapped.Uploader).not.toBe(FakeBaseUploader);
  });

  it('leaves sources without an Uploader or in component mode untouched', () => {
    const noUploader: AssetSource = { name: 'media', component };
    const componentMode: AssetSource = { ...defaultSource(), uploadMode: 'component' };
    expect(withImageProcessing(noUploader)).toBe(noUploader);
    expect(withImageProcessing(componentMode)).toBe(componentMode);
  });

  it('is idempotent', () => {
    const once = withImageProcessing(defaultSource());
    expect(withImageProcessing(once)).toBe(once);
  });

  it('preserves length and order and wraps only the eligible entries', () => {
    const eligible = defaultSource();
    const other: AssetSource = { name: 'other', component };
    const result = resolveImageAssetSources([other, eligible]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(other);
    expect(result[1].name).toBe('sanity-default');
    expect(result[1].Uploader).not.toBe(FakeBaseUploader);
  });

  it('keeps the identity of the Studio default source properties', () => {
    const studioSource: AssetSource = {
      name: 'sanity-default',
      component,
      icon,
      Uploader: FakeBaseUploader,
    };
    const [resolved] = resolveImageAssetSources([studioSource]);
    expect(resolved.name).toBe(studioSource.name);
    expect(resolved.component).toBe(studioSource.component);
    expect(resolved.icon).toBe(studioSource.icon);
    expect(resolved.Uploader).not.toBe(studioSource.Uploader);
  });
});
