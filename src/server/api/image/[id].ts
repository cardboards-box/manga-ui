
export default defineEventHandler(async (event) => {
    const { apiUrl, imageUrl } = useRuntimeConfig().public;
    let proxyUrl = imageUrl || apiUrl;
    if (proxyUrl.endsWith('/')) {
        proxyUrl = proxyUrl.slice(0, -1);
    }

    const id = event.context.params?.id
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing image id' })
    }

    const response = await fetch(`${proxyUrl}/image/${id}`)
    if (!response.ok) {
        throw createError({ statusCode: response.status, statusMessage: 'Image not found' })
    }

    event.node.res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    event.node.res.setHeader('Cache-Control', response.headers.get('cache-control') || 'public, max-age=31536000');
    return response.body
})
