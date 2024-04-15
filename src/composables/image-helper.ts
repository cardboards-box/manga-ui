type ImageError = {
    code: number;
    message: string;
}

export const useImageHelper = (
    src: Ref<string | undefined>,
    opts?: {
        onLoad?: (url: string) => void,
        onError?: (error: ImageError) => void,
        onAborted?: () => void,
        onBlob?: (blob: Blob) => void,
        imediate?: boolean
    }
) => {
    let abortCtrl: AbortController;
    const start = ref(Date.now());
    const pending = ref(false);
    const error = ref<ImageError>();
    const result = ref<string>();
    const duration = ref<number>();
    const size = ref<{ width: number, height: number }>();

    const state = computed(() => {
        if (pending.value) return 'loading';
        if (error.value) return 'error';
        if (result.value) return 'done';
        return 'default';
    });

    const abort = () => {
        if (!pending.value) return;
        abortCtrl?.abort();
    }

    const sizeFromBlob = async (blob: Blob) => {
        const btmp = await createImageBitmap(blob);
        const output = { width: btmp.width, height: btmp.height };
        btmp.close();
        return output;
    };

    const fetchImage = async () => {
        try {
            if (pending.value) return;

            error.value = undefined;
            pending.value = true;
            duration.value = undefined;
            start.value = Date.now();
            result.value = undefined;
            size.value = undefined;

            if (!src.value) {
                pending.value = false;
                return;
            }

            if (abortCtrl && !abortCtrl.signal.aborted) abortCtrl.abort();

            abortCtrl = new AbortController();

            const resp = await fetch(src.value, { signal: abortCtrl.signal });
            duration.value = Date.now() - start.value;

            if (!resp.ok) {
                error.value = { code: resp.status, message: resp.statusText };
                pending.value = false;
                opts?.onError?.(error.value);
                return;
            }

            const blob = new Blob([await resp.arrayBuffer()], {
                type: resp.headers.get('content-type') ?? 'image/png'
            });

            opts?.onBlob?.(blob);
            size.value = await sizeFromBlob(blob);
            result.value = URL.createObjectURL(blob);
            pending.value = false;
            opts?.onLoad?.(result.value);
        } catch (e) {
            if (abortCtrl?.signal.aborted) {
                error.value = { code: 500, message: 'Request aborted' };
                pending.value = false;
                opts?.onAborted?.();
                return;
            }

            error.value = { code: 500, message: e?.toString() ?? 'An unknown error occurred' };
            pending.value = false;
            opts?.onError?.(error.value);
        }
    }

    watch(() => src.value, fetchImage, { immediate: opts?.imediate ?? true });

    return {
        pending,
        error,
        result,
        start,
        state,
        size,
        duration,

        abort,
        refresh: fetchImage
    }
}
