# You Resume

A lightweight Firefox extension that saves your YouTube playback position locally and lets you pick up where you left off without signing into YouTube.

I built this because I use YouTube without an account and wanted a way to keep track of where I left off watching videos without having to remember the timestamp myself.

## Features

- Automatically saves video playback positions.
    
- Prompts you to resume a video from where you left off.
    
- Tracks videos individually using their YouTube video IDs.
    
- Displays recently watched videos, channel names, and saved timestamps.
    
- Lets you reopen videos or remove them from your saved history.
    
- Stores playback history locally using Firefox's extension storage API.
    
- Works without a YouTube account.
    
- Doesn't require a backend, database server, or external service.
    

## How It Works

You Resume uses Firefox's WebExtensions API to interact with YouTube and store playback information locally.

### Playback Tracking

When you open a YouTube video, the extension identifies it using its video ID from the URL.

It then accesses the page's HTML video element to monitor playback progress. The current playback position is saved periodically and when the video is paused.

The extension stores the following information for each video:

- YouTube video ID
    
- Video title
    
- Channel name
    
- Video URL
    
- Last saved playback position
    
- Video duration
    
- Last updated timestamp
    

### Resuming Videos

When you revisit a video with a previously saved position, the extension displays a prompt with two options:

- **Resume:** Continue from the saved timestamp.
    
- **Start over:** Return to the beginning.
    

The extension also accounts for YouTube's single-page application behavior, where navigating between videos doesn't necessarily reload the entire page.

### Local Storage

Playback information is stored using `browser.storage.local`.

No external database or account is required, and the extension doesn't send your viewing history to an external server.

Your saved history belongs to your local Firefox browser profile. It isn't automatically synchronized between browsers or computers.

## Installation

### Requirements

- Firefox 128 or later.
    
- A local copy of this repository.
    

No additional dependencies or build tools are required.

### Temporary Installation

This method is useful for development and testing.

1. Clone the repository:
    
    ```
    git clone <repository-url>
    ```
    
2. Navigate into the project directory:
    
    ```
    cd you-resume
    ```
    
3. Open Firefox and navigate to:
    
    ```
    about:debugging#/runtime/this-firefox
    ```
    
4. Click **Load Temporary Add-on**.
    
5. Select the `manifest.json` file from the project directory.
    

The extension will be available until Firefox restarts. You'll need to load it again after restarting.

### Permanent Installation

To install You Resume permanently in standard Firefox without publicly listing it on the Firefox Add-ons website, you can use Mozilla's unlisted self-distribution process.

1. Create or sign in to your account on the [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/).
    
2. Package the extension files into a ZIP archive. Include the extension's `manifest.json`, JavaScript, HTML, and CSS files.
    
3. In the Developer Hub, choose **Submit a New Add-on**.
    
4. Select **On your own** as the distribution method rather than listing the extension publicly.
    
5. Follow Mozilla's submission and signing process.
    
6. Once approved and signed, download the generated `.xpi` file.
    
7. In Firefox, open the Add-ons Manager by navigating to:
    
    ```
    about:addons
    ```
    
8. Open the Add-ons Manager's settings menu and select **Install Add-on From File**.
    
9. Select the signed `.xpi` file and confirm the installation.
    

You Resume should now remain installed when Firefox restarts.

**Important:** Unlisted extensions still need to meet Mozilla's extension policies and pass its signing checks. If you update the extension later, you'll need to submit the updated version for signing as well.

For details, see Mozilla's documentation on [signing and dist](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)..[ributing extensions](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/) and [installing self-distributed extensions](https://extensionworkshop.com/documentation/publish/install-self-distributed/).

## Project Structure

```
you-resume/
├── manifest.json
├── background.js
├── content.js
├── storage.js
├── popup.html
├── popup.css
└── popup.js
```

|File|Purpose|
|---|---|
|`manifest.json`|Defines the extension, permissions, and configuration.|
|`background.js`|Handles storage requests from the content script and popup.|
|`content.js`|Detects YouTube videos, tracks playback, saves channel information, and handles resume prompts.|
|`storage.js`|Contains storage helper functions. The current implementation handles storage directly in `background.js`, so this file isn't required at runtime.|
|`popup.html`|Defines the extension popup.|
|`popup.css`|Styles the popup interface.|
|`popup.js`|Loads saved videos and handles the popup actions.|

## Permissions

You Resume requests the following permissions:

|Permission|Reason|
|---|---|
|`storage`|Saves and retrieves playback history locally.|
|YouTube host access|Allows the content script to read video information and interact with YouTube's video player.|

The extension doesn't require access to your browsing history or YouTube account credentials.

## Privacy

You Resume is designed to keep playback history local.

- No YouTube sign-in is required.
    
- No backend or external database is used.
    
- Playback history is stored in Firefox's local extension storage.
    
- Video titles, channel names, and timestamps are not intentionally transmitted to external services by the extension.
    

Your saved history may be lost if you remove the extension's data or delete the relevant Firefox profile. Back up your data if you want to preserve it.

## Limitations

- The extension currently targets `www.youtube.com`.
    
- Channel names depend on the information available in YouTube's page structure.
    
- YouTube changes its interface periodically, which may require updates to the extension.
    
- Temporary installations must be loaded again after Firefox restarts.
    
- Playback history is local to the Firefox profile and isn't automatically synchronized across devices.
    
- The extension saves playback positions periodically, so the saved timestamp may be a few seconds behind the exact point where playback stopped.
    
## Development

No build process is required. The extension uses plain JavaScript, HTML, and CSS.

To test changes:

1. Edit the relevant files.
    
2. Open `about:debugging#/runtime/this-firefox`.
    
3. Reload the extension.
    
4. Open a YouTube video and verify the changes.
    
When debugging, Firefox's Browser Console and the YouTube page's Web Developer Tools can help identify errors.

## Disclaimer

You Resume is an independent, open-source project and is not affiliated with, endorsed by, or sponsored by YouTube or Google.

YouTube is a trademark of Google LLC. All YouTube-related names, trademarks, and content belong to their respective owners.

This extension is intended to help users keep track of their own video playback progress. It does not download or redistribute YouTube videos.
