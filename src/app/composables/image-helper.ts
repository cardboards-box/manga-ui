import type { MbImage } from "~/models";

type ImageError = {
    code: number;
    message: string;
}

export const useImageHelper = (
    src: Ref<string | undefined | MbImage>,
    opts?: {
        cover?: Ref<boolean> | boolean,
        onLoad?: (url: string) => void,
        onError?: (error: ImageError) => void,
        onAborted?: () => void,
        onBlob?: (blob: Blob) => void,
        imediate?: boolean
    }
) => {
    const { get } = useImageCache();

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

            const resp = await get(src.value, abortCtrl);
            duration.value = Date.now() - start.value;

            if (!resp.image) {
                error.value = { code: resp.code, message: resp.message };
                pending.value = false;
                opts?.onError?.(error.value);
                return;
            }

            const blob = resp.image.blob;

            opts?.onBlob?.(blob);
            size.value = { 
                width: resp.image.width,
                height: resp.image.height 
            };
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
