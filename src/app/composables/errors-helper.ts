
export function useErrorsHelper() {
    const errors = useState<string[]>('errors', () => []);

    const add = (error: string) => {
        errors.value.push(error);
    }

    const clear = () => {
        errors.value = [];
    }

    return {
        errors,
        add,
        clear
    }
}
