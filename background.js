const STORAGE_KEY = "youtubeResumeVideos";

browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === "GET_VIDEO") {
        const result = await browser.storage.local.get(STORAGE_KEY);
        const videos = result[STORAGE_KEY] || {};

        return videos[message.videoId] || null;
    }

    if (message.type === "SAVE_VIDEO") {
        const result = await browser.storage.local.get(STORAGE_KEY);
        const videos = result[STORAGE_KEY] || {};

        videos[message.videoId] = {
            ...videos[message.videoId],
            ...message.data,
            updatedAt: Date.now()
        };

        await browser.storage.local.set({
            [STORAGE_KEY]: videos
        });

        return { success: true };
    }

    if (message.type === "GET_ALL_VIDEOS") {
        const result = await browser.storage.local.get(STORAGE_KEY);
        const videos = result[STORAGE_KEY] || {};

        return Object.entries(videos)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }

    if (message.type === "DELETE_VIDEO") {
        const result = await browser.storage.local.get(STORAGE_KEY);
        const videos = result[STORAGE_KEY] || {};

        delete videos[message.videoId];

        await browser.storage.local.set({
            [STORAGE_KEY]: videos
        });

        return { success: true };
    }
});
