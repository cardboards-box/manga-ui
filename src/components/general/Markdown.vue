<template>
<ClientOnly>
    <div class="markdown" v-html="markdown"></div>
</ClientOnly>
</template>

<script setup>
import * as marked from 'marked';
import * as hljs from 'highlight.js';

const { content } = defineProps({ content: String });

const markdown = ref('');
    
onMounted(() => {
    marked.setOptions({
        highlight: (code, lang) => {
            return hljs.default.highlight(lang, code).value;
        }
    });

    try {
        markdown.value = marked.parse(content || '');
    } catch {
        markdown.value = content;
    }
})

</script>