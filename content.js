(() => {
    if (window.youtubeResumeInitialized) {
        return;
    }

    window.youtubeResumeInitialized = true;

    let currentVideoId = null;
    let currentVideo = null;
    let saveInterval = null;
    let channelObserver = null;
    let channelRetryInterval = null;
    let promptElement = null;
    let lastSavedPosition = -1;
    let navigationVersion = 0;

    const SAVE_INTERVAL_MS = 5000;
    const MIN_RESUME_SECONDS = 5;

    function getVideoId() {
        const url = new URL(window.location.href);

        if (url.pathname === "/watch") {
            return url.searchParams.get("v");
        }

        return null;
    }

    function getVideoTitle() {
        return document.querySelector(
            "h1.ytd-watch-metadata"
        )?.textContent?.trim() || document.title;
    }

    function getChannelName() {
        const selectors = [
            "ytd-video-owner-renderer #channel-name a",
            "#owner #channel-name a",
            "ytd-video-owner-renderer a.yt-simple-endpoint",
            "ytd-channel-name a",
            "#upload-info #channel-name a"
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);

            for (const element of elements) {
                const channelName = element.textContent?.trim();

                if (
                    channelName &&
                    channelName !== "Unknown channel"
                ) {
                    return channelName;
                }
            }
        }

        return "";
    }

    function sendMessage(message) {
        return browser.runtime.sendMessage(message);
    }

    function removePrompt() {
        if (promptElement) {
            promptElement.remove();
            promptElement = null;
        }
    }

    function stopChannelDetection() {
        if (channelObserver) {
            channelObserver.disconnect();
            channelObserver = null;
        }

        if (channelRetryInterval) {
            clearInterval(channelRetryInterval);
            channelRetryInterval = null;
        }
    }

    function startChannelDetection(videoId) {
        stopChannelDetection();

        let attempts = 0;
        const maxAttempts = 30;

        async function updateChannel() {
            if (videoId !== currentVideoId) {
                stopChannelDetection();
                return;
            }

            const channel = getChannelName();

            if (channel) {
                try {
                    const savedData = await sendMessage({
                        type: "GET_VIDEO",
                        videoId
                    });

                    if (videoId !== currentVideoId) {
                        return;
                    }

                    // Keep the latest channel name without resetting progress.
                    await sendMessage({
                        type: "SAVE_VIDEO",
                        videoId,
                        data: {
                            title: getVideoTitle(),
                            channel,
                            url: `https://www.youtube.com/watch?v=${videoId}`,
                            position: currentVideo?.currentTime ??
                                savedData?.position ?? 0,
                            duration: currentVideo &&
                                Number.isFinite(currentVideo.duration)
                                ? currentVideo.duration
                                : savedData?.duration ?? 0
                        }
                    });

                    stopChannelDetection();
                    return;
                } catch (error) {
                    console.error(
                        "You Resume: Failed to save channel name.",
                        error
                    );
                }
            }

            attempts++;

            if (attempts >= maxAttempts) {
                stopChannelDetection();
            }
        }

        // Check periodically because YouTube renders the channel asynchronously.
        channelRetryInterval = setInterval(updateChannel, 1000);

        // Also check whenever YouTube changes its page content.
        channelObserver = new MutationObserver(() => {
            if (!getChannelName()) {
                return;
            }

            updateChannel();
        });

        const target = document.querySelector(
            "ytd-watch-metadata"
        ) || document.querySelector("#above-the-fold") ||
            document.body;

        channelObserver.observe(target, {
            childList: true,
            subtree: true,
            characterData: true
        });

        updateChannel();
    }

    async function savePosition() {
        if (!currentVideo || !currentVideoId) {
            return;
        }

        const video = currentVideo;
        const videoId = currentVideoId;
        const position = video.currentTime;

        if (!Number.isFinite(position) || position < 0) {
            return;
        }

        if (Math.abs(position - lastSavedPosition) < 1) {
            return;
        }

        lastSavedPosition = position;

        try {
            const data = {
                title: getVideoTitle(),
                url: `https://www.youtube.com/watch?v=${videoId}`,
                position,
                duration: Number.isFinite(video.duration)
                    ? video.duration
                    : 0
            };

            const channel = getChannelName();

            // Don't overwrite a saved channel name with an empty value.
            if (channel) {
                data.channel = channel;
            }

            await sendMessage({
                type: "SAVE_VIDEO",
                videoId,
                data
            });
        } catch (error) {
            console.error(
                "You Resume: Failed to save position.",
                error
            );
        }
    }

    function formatTime(seconds) {
        seconds = Math.floor(seconds);

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
        }

        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    function createPrompt(savedPosition) {
        removePrompt();

        const container = document.createElement("div");

        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            width: 300px;
            padding: 18px;
            border-radius: 12px;
            background: #181818;
            color: white;
            font: 14px Arial, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;

        const heading = document.createElement("div");
        heading.textContent = "Resume video?";

        heading.style.cssText = `
            font-size: 17px;
            font-weight: bold;
            margin-bottom: 8px;
        `;

        const description = document.createElement("div");
        description.textContent =
            `You left off at ${formatTime(savedPosition)}.`;

        description.style.marginBottom = "14px";

        const buttons = document.createElement("div");

        buttons.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const resumeButton = document.createElement("button");
        resumeButton.textContent = "Resume";

        resumeButton.style.cssText = `
            flex: 1;
            padding: 9px;
            border: none;
            border-radius: 6px;
            background: #ff0033;
            color: white;
            cursor: pointer;
        `;

        const startButton = document.createElement("button");
        startButton.textContent = "Start over";

        startButton.style.cssText = `
            flex: 1;
            padding: 9px;
            border: none;
            border-radius: 6px;
            background: #383838;
            color: white;
            cursor: pointer;
        `;

        resumeButton.addEventListener("click", () => {
            if (currentVideo && currentVideo.duration > 0) {
                currentVideo.currentTime = Math.min(
                    savedPosition,
                    Math.max(0, currentVideo.duration - 1)
                );

                lastSavedPosition = -1;
            }

            removePrompt();
        });

        startButton.addEventListener("click", async () => {
            if (currentVideo) {
                currentVideo.currentTime = 0;
                lastSavedPosition = -1;

                await savePosition();
            }

            removePrompt();
        });

        buttons.append(resumeButton, startButton);
        container.append(heading, description, buttons);

        document.body.appendChild(container);
        promptElement = container;
    }

    async function handleVideo(videoId) {
        if (!videoId || videoId === currentVideoId) {
            return;
        }

        const version = ++navigationVersion;

        await savePosition();

        clearInterval(saveInterval);
        stopChannelDetection();
        removePrompt();

        currentVideoId = videoId;
        currentVideo = null;
        lastSavedPosition = -1;

        let video = document.querySelector("video");

        for (let attempt = 0; !video && attempt < 20; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 250));

            if (version !== navigationVersion) {
                return;
            }

            video = document.querySelector("video");
        }

        if (version !== navigationVersion || !video) {
            return;
        }

        currentVideo = video;

        try {
            const savedData = await sendMessage({
                type: "GET_VIDEO",
                videoId
            });

            if (
                version !== navigationVersion ||
                currentVideo !== video
            ) {
                return;
            }

            const hasSavedPosition =
                savedData &&
                Number.isFinite(savedData.position) &&
                savedData.position >= MIN_RESUME_SECONDS &&
                (
                    !Number.isFinite(savedData.duration) ||
                    savedData.duration === 0 ||
                    savedData.position < savedData.duration - 10
                );

            if (hasSavedPosition) {
                if (video.readyState >= 1) {
                    createPrompt(savedData.position);
                } else {
                    video.addEventListener("loadedmetadata", () => {
                        if (
                            version === navigationVersion &&
                            currentVideo === video &&
                            video.duration > savedData.position + 1
                        ) {
                            createPrompt(savedData.position);
                        }
                    }, { once: true });
                }
            }
        } catch (error) {
            console.error(
                "You Resume: Failed to retrieve position.",
                error
            );
        }

        if (version !== navigationVersion) {
            return;
        }

        video.addEventListener("pause", savePosition);

        video.addEventListener("ended", async () => {
            await savePosition();
        });

        saveInterval = setInterval(savePosition, SAVE_INTERVAL_MS);

        startChannelDetection(videoId);
    }

    function detectNavigation() {
        const videoId = getVideoId();

        if (videoId && videoId !== currentVideoId) {
            handleVideo(videoId);
        }
    }

    const observer = new MutationObserver(detectNavigation);

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    window.addEventListener("yt-navigate-finish", detectNavigation);
    window.addEventListener("pagehide", savePosition);

    detectNavigation();
})();
