import { PAGE_STYLES_LONGSTRIP, type PageStyle } from '~/models';

export const usePageStyleHelper = () => {
    const longStripPageStyles = PAGE_STYLES_LONGSTRIP.map(style => style.value);
    const isLongStripPageStyle = (style?: PageStyle) => !!style && longStripPageStyles.includes(style);

    return {
        isLongStripPageStyle,
        longStripPageStyles
    };
};
