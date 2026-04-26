/*
AI Disclosure; 
This file was created entirely by AI (ChatGPT), because I am too lazy.
*/

/**
 * The various settings for parallel operations
 */
export type ParallelForEachSettings<T, TResult> = {
    /**
     * The first item index that is eligible to be processed.
     * Items before this index are skipped entirely.
     * Defaults to 0.
     */
    startIndex?: number;

    /**
     * The index to begin processing from within the eligible range.
     * Processing continues to the end, then wraps back to startIndex.
     * Defaults to startIndex.
     */
    startFromIndex?: number;

    /**
     * Controls cancellation for the operation.
     * Defaults to undefined.
     */
    abortController?: AbortController | undefined;

    /**
     * The maximum number of items to process in parallel.
     * Defaults to 5.
     */
    maxDegreesOfParallelism?: number;

    /**
     * Whether or not to throw errors if any of the starting
     * parameters are invalid. Defaults will be used if false.
     * Defaults to false.
     */
    throwParameterErrors?: boolean | undefined;

    /**
     * Called when an item completes successfully.
     */
    onItemCompleted?: (args: ParallelItemCompletedEventArgs<T, TResult>) => void | Promise<void>;

    /**
     * Called when an item fails.
     */
    onItemFailed?: (args: ParallelItemFailedEventArgs<T>) => void | Promise<void>;
};

export type ParallelItemCompletedEventArgs<T, TResult> = {
    item: T;
    index: number;
    result: TResult;
    completedCount: number;
    failedCount: number;
    processedCount: number;
    totalCount: number;
};

export type ParallelItemFailedEventArgs<T> = {
    item: T;
    index: number;
    error: unknown;
    completedCount: number;
    failedCount: number;
    processedCount: number;
    totalCount: number;
};

/**
 * Error thrown when an operation is aborted.
 */
export class AbortError extends Error {
    public constructor(message = "The operation was aborted.") {
        super(message);
        this.name = "AbortError";
    }
}

/**
 * Throws if the given abort signal has been aborted.
 * @param signal The abort signal to inspect.
 */
function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new AbortError();
    }
}

/**
 * Runs an asynchronous action for each item in the collection using a limited degree of parallelism.
 *
 * Work is scheduled from the optional startFromIndex, then wraps back to startIndex.
 * As soon as one task completes, the next queued item begins automatically.
 *
 * Individual item failures do not stop the overall operation.
 * Results are returned in source order for the processed range.
 * Exceptions thrown by completion/failure callbacks are propagated to the caller.
 *
 * @typeParam T The input item type.
 * @typeParam TResult The result type returned by the action.
 * @param items The items to process.
 * @param action The async action to run for each item.
 * @param settings Optional execution settings.
 * @returns A settled result for each processed item, in source order.
 */
export async function parallelForEachAsync<T, TResult>(
    items: readonly T[],
    action: (item: T, index: number, signal?: AbortSignal) => Promise<TResult>,
    settings?: ParallelForEachSettings<T, TResult>
): Promise<PromiseSettledResult<TResult>[]> {
    let startIndex = settings?.startIndex ?? 0;
    let startFromIndex = settings?.startFromIndex ?? startIndex;
    let maxDegreesOfParallelism = settings?.maxDegreesOfParallelism ?? 5;
    const throwParameterErrors = settings?.throwParameterErrors ?? false;
    const abortController = settings?.abortController;
    const onItemCompleted = settings?.onItemCompleted;
    const onItemFailed = settings?.onItemFailed;
    const signal = abortController?.signal;

    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex > items.length) {
        if (throwParameterErrors)
            throw new RangeError(`startIndex must be an integer between 0 and ${items.length}.`);
        startIndex = 0;
    }

    if (!Number.isInteger(startFromIndex) || startFromIndex < startIndex || startFromIndex > items.length) {
        if (throwParameterErrors)
            throw new RangeError(`startFromIndex must be an integer between ${startIndex} and ${items.length}.`);
        startFromIndex = startIndex;
    }

    if (!Number.isInteger(maxDegreesOfParallelism) || maxDegreesOfParallelism < 1) {
        if (throwParameterErrors)
            throw new RangeError("maxDegreesOfParallelism must be a positive integer.");
        maxDegreesOfParallelism = 5;
    }

    throwIfAborted(signal);

    const totalCount = items.length - startIndex;
    if (totalCount <= 0) {
        return [];
    }

    const orderedIndexes = [
        ...Array.from({ length: items.length - startFromIndex }, (_, offset) => startFromIndex + offset),
        ...Array.from({ length: startFromIndex - startIndex }, (_, offset) => startIndex + offset)
    ];

    const results = new Array<PromiseSettledResult<TResult>>(totalCount);
    let nextIndex = 0;
    let completedCount = 0;
    let failedCount = 0;

    async function worker(): Promise<void> {
        while (true) {
            throwIfAborted(signal);

            const queueIndex = nextIndex++;
            if (queueIndex >= orderedIndexes.length) {
                return;
            }

            const currentIndex = orderedIndexes[queueIndex]!;
            const currentItem = items[currentIndex]!;
            const resultIndex = currentIndex - startIndex;

            let result: TResult;

            try {
                result = await action(currentItem, currentIndex, signal);
            } catch (error) {
                throwIfAborted(signal);

                failedCount++;
                const processedCount = completedCount + failedCount;

                results[resultIndex] = {
                    status: "rejected",
                    reason: error
                };

                await onItemFailed?.({
                    item: currentItem,
                    index: currentIndex,
                    error,
                    completedCount,
                    failedCount,
                    processedCount,
                    totalCount
                });
                continue;
            }

            completedCount++;
            const processedCount = completedCount + failedCount;

            results[resultIndex] = {
                status: "fulfilled",
                value: result
            };

            await onItemCompleted?.({
                item: currentItem,
                index: currentIndex,
                result,
                completedCount,
                failedCount,
                processedCount,
                totalCount
            });
        }
    }

    const workerCount = Math.min(maxDegreesOfParallelism, totalCount);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return results;
}

/**
 * Runs an asynchronous action for each item in the collection using a limited degree of parallelism.
 *
 * This overload does not collect action results, but it still continues after individual item failures
 * and returns settled results for each processed item.
 * Exceptions thrown by completion/failure callbacks are propagated to the caller.
 *
 * @typeParam T The input item type.
 * @param items The items to process.
 * @param action The async action to run for each item.
 * @param settings Optional execution settings.
 * @returns A settled result for each processed item, in source order.
 */
export async function parallelForEachVoidAsync<T>(
    items: readonly T[],
    action: (item: T, index: number, signal?: AbortSignal) => Promise<void>,
    settings?: ParallelForEachSettings<T, void>
): Promise<PromiseSettledResult<void>[]> {
    return await parallelForEachAsync<T, void>(items, action, settings);
}