const STORAGE_KEY = "youtubeResumeVideos";

async function getVideo(videoId) {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const videos = result[STORAGE_KEY] || {};

    return videos[videoId] || null;
}

async function saveVideo(videoId, videoData) {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const videos = result[STORAGE_KEY] || {};

    videos[videoId] = {
        ...videos[videoId],
        ...videoData,
        updatedAt: Date.now()
    };

    await browser.storage.local.set({
        [STORAGE_KEY]: videos
    });
}

async function getAllVideos() {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const videos = result[STORAGE_KEY] || {};

    return Object.entries(videos)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
}

async function deleteVideo(videoId) {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const videos = result[STORAGE_KEY] || {};

    delete videos[videoId];

    await browser.storage.local.set({
        [STORAGE_KEY]: videos
    });
}
