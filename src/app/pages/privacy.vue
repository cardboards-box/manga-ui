<template>
    <div class="max-width flex row margin-top scroll-y">
        <h2>Privacy Policy</h2>
        <p>Effective Date: March 15th, 2025</p>

        <p class="margin-top">
            This privacy policy governs the manner in which MangaBox collects, uses, maintains and discloses information
            collected from users (each, a "User") of the MangaBox website ("Site") or the MangaBox Disocrd Bot.
            This privacy policy applies to the Site, Discord Bot and all products and services offered by MangaBox.
        </p>

        <h2 class="margin-top">Information Collection:</h2>
        <p>
            MangaBox collects the following information to operate effectively and provide it's services.
            The following scenarios outline when information will be collected and what it is used for:
        </p>
        <h3 class="margin-top">(Bot) Discord Guild/Server Configuration</h3>
        <p>
            When the bot is added to a server/guild, it will collect and store the ID of the server/guild in question.
            This is used to store preferences and settings for the server/guild, as well as to provide context to lookup requests.
        </p>
        <h3 class="margin-top">(Bot) Image Lookup Requests</h3>
        <p>
            In general, for every image lookup request the discord bot preforms, the ID of the message the image is within will be stored,
            along with the ID of the user who sent the message, the user who performed the lookup, and the URL of the image.
            <br>
            The URL of the image, in this case, is either a URL gleamed from the message content, or the URL of the attachment itself (given by discord).
            <br>
            The contents of the message, other than the image URL, is not stored within the bot.
            <br>
            <br>
            When a user performs an emoji/reaction lookup, the ID of the user and the ID of the message will be stored regardless of whether or not a lookup is preformed.
            This is a measure to prevent duplicate lookup requests for the same image, as well as a spam/abuse prevention measure.
            <br>
            <br>
            The binary data of the image being lookup will be stored temporarily while the lookup is being performed.
            However, the binary data will be deleted once the lookup is completed (regardless of success or failure).
            We do not store images long-term.
        </p>
        <h3 class="margin-top">(Website) Image Lookup Requests</h3>
        <p>
            When a user performs an image lookup request on the website, the image's binary data or URL
            (depending on lookup method) will be stored temporarily while the lookup is being performed.
            However, the binary data will be deleted once the lookup is completed (regardless of success or failure).
            We do not store images long-term.
            <br>
            <br>
            The user's IP address may be stored temporarily to prevent abuse of the service (this is a feature of Cloudflare and not something handled locally).
        </p>
        <h3 class="margin-top">General Data Storage Practices</h3>
        <p>
            MangaBox does not store any personal information, such as names, email addresses, or payment details, about users regardless of the service being used.
            <br>
            MangaBox does not store usernames or guild/server names of discord users who interact with the server, just their Discord IDs.
            <br>
            MangaBox does not store discord Message content, only the image URLs are stored.
        </p>

        <h2 class="margin-top">Sharing Information</h2>
        <p>
            MangaBox does not sell, trade, or rent information to others.
            <br>
            If required by law, we may share data with legal authorities.
            <br>
            MangaBox uses third-party services, such as MangaDex, Google Vision, and SauceNAO, to provide it's services.
            These services have their own privacy policies and data sharing policies, and you are encouraged to review them.
        </p>
        <h2 class="margin-top">Security Measures</h2>
        <p>
            We take reasonable steps to protect your data from unauthorized access, loss, or misuse.
            However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>
        <h2 class="margin-top">Changes to this policy</h2>
        <p>
            We may update this Privacy Policy from time to time.
            Changes will be posted here, and your continued use of MangaBox after changes are made constitutes your acceptance of the updated policy.
        </p>
        <h2 class="margin-top">Contact Us</h2>
        <p>
            If you have any questions, comments or conerns regarding this policy, you may reach out to us via one of the following methods:

        </p>
        <ul>
            <li>The Discord Server linked on the sidebar.</li>
            <li>The GitHub Repository (issues) linked on the sidebar.</li>
        </ul>
        <p>We do not have a dedicated email address for privacy concerns at this time (nor do we plan to).</p>
    </div>

</template>
