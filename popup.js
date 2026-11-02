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

async function loadVideos() {
    const list = document.getElementById("video-list");

    let videos;

    try {
        videos = await browser.runtime.sendMessage({
            type: "GET_ALL_VIDEOS"
        });
    } catch (error) {
        list.replaceChildren();

        const message = document.createElement("p");
        message.className = "empty";
        message.textContent = "Unable to load playback history.";

        list.appendChild(message);
        return;
    }

    list.replaceChildren();

    if (!videos || videos.length === 0) {
        const message = document.createElement("p");
        message.className = "empty";
        message.textContent = "No saved videos yet.";

        list.appendChild(message);
        return;
    }

    for (const video of videos) {
        const item = document.createElement("article");
        item.className = "video";

        const title = document.createElement("div");
        title.className = "video-title";
        title.textContent = video.title || "Untitled video";

        const channel = document.createElement("div");
        channel.className = "video-channel";
        channel.textContent = video.channel || "Channel not saved";

        const position = document.createElement("div");
        position.className = "video-position";
        position.textContent =
            `Last position: ${formatTime(video.position || 0)}`;

        const actions = document.createElement("div");
        actions.className = "actions";

        const openButton = document.createElement("button");
        openButton.className = "open";
        openButton.textContent = "Open video";

        openButton.addEventListener("click", () => {
            browser.tabs.create({
                url: `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`
            });
        });

        const forgetButton = document.createElement("button");
        forgetButton.className = "forget";
        forgetButton.textContent = "Forget";

        forgetButton.addEventListener("click", async () => {
            try {
                await browser.runtime.sendMessage({
                    type: "DELETE_VIDEO",
                    videoId: video.id
                });

                await loadVideos();
            } catch (error) {
                console.error("You Resume: Failed to delete video.", error);
            }
        });

        actions.append(openButton, forgetButton);
        item.append(title, channel, position, actions);

        list.appendChild(item);
    }
}

document.addEventListener("DOMContentLoaded", loadVideos);
