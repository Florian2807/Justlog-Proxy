const http = require("http");
const got = require("got");
const express = require("express");
const request = require("request");

const config = require("./config.json");

const loggedChannels = {};
const app = express();

app.get("/instances/", (req, res) => {
    console.log(`${date()} request: ${req.url}`);
    res.send(loggedChannels);
});
app.get("/channels", (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.send({
        channels: getAllChannels().sort((a, b) => a.name.localeCompare(b.name)),
    });
});

app.get("/favicon.ico", (req, res) => res.status(204));

app.get("/list", (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    const channel = /[?&/]channel[=/]([a-zA-Z_0-9]+)/.exec(
        req.originalUrl
    )?.[1];
    const justlogDomain = getJustlogsDomain("name", channel);
    if (!justlogDomain) {
        res.sendStatus(404);
        return;
    }
    req.pipe(request(`${justlogDomain}/${req.url}`)).pipe(res);
});

app.get("/*", async (req, res) => {
    res.type("text/plain");
    const url = new URL(
        req.protocol + "://" + req.get("host") + req.originalUrl
    );

    const path = url.pathname.split("/");
    path.shift();
    if (/\/(channel|channelid)\/\w+\/?$/gm.test(url.pathname)) {
        await parseUrl(path, req, res);
    } else if (
        /\/(channel|channelid)\/\w+\/(user|userid)\/\w+\/?$/gm.test(
            url.pathname
        )
    ) {
        await parseUrl(path, req, res);
    } else if (
        /\/(channel|channelid)\/\w+\/\d+\/\d{1,2}/gm.test(req.url) ||
        /\/(channel|channelid)\/\w+\/(user|userid)\/\w+\/\d+\/\d{1,2}/gm.test(
            req.url
        )
    ) {
        // /channel/:channelName/:year/:month/:day
        requestChannel(path, req, res);
    } else {
        res.send("404 page not found").status(404);
    }
});

async function parseUrl(path, req, res) {
    if (!path[1]?.toLowerCase()) {
        console.log("no channel specified");
        res.send("could not load logs").status(404);
        return;
    }

    let justlogDomain;
    switch (path[0]?.toLowerCase()) {
        case "channel":
            justlogDomain = getJustlogsDomain("name", path[1]?.toLowerCase());
            break;
        case "channelid":
            justlogDomain = getJustlogsDomain("id", path[1]?.toLowerCase());
    }

    if (!justlogDomain) {
        console.log("404 Channel not found");
        res.send("could not load logs").status(404);
        return;
    }
    const requestUrl = `${justlogDomain}/${req.originalUrl}`;
    const redirectPath = new URL((await got(requestUrl, {retry: { limit: 2 }})).redirectUrls[1])
        .pathname;
    console.log(redirectPath);
    return res.redirect(redirectPath);
}

function requestChannel(path, req, res) {
    const channel = path[1]?.toLowerCase();

    let justlogDomain;
    if (!channel) {
        console.log("no channel specified");
        res.sendStatus(404);
        return;
    }

    switch (path[0]?.toLowerCase()) {
        case "channel":
            justlogDomain = getJustlogsDomain("name", channel);
            break;
        case "channelid":
            justlogDomain = getJustlogsDomain("id", channel);
    }
    if (!justlogDomain) {

        console.log("404 Channel not found");
        res.sendStatus(404);
        return;
    }
    const requestUrl = `${justlogDomain}/${req.originalUrl}`;
    req.pipe(request(requestUrl)).pipe(res);
    res.url = requestUrl;
}

const server = http.createServer(app);

server.listen(config.port, async () => {
    console.log(`${date()}: Server listening on port ${config.port}`);

    await fetchLoggedChannels();
});

async function fetchLoggedChannels() {
    let allChannels = {};
    for (const justlogInstance in config.domains) {
        try {
            const { channels } = await got(
                `${config.domains[justlogInstance]}/channels`,
                { retry: { limit: 2 } }
            ).json();
            allChannels[justlogInstance] = channels.map((i) => {
                if (
                    !Object.values(allChannels)
                        .flat()
                        .map((c) => {
                            return c?.name;
                        })
                        .includes(i.name)
                ) {
                    return { userID: i.userID, name: i.name };
                } else {
                    return undefined;
                }
            });
            loggedChannels[justlogInstance] = allChannels[
                justlogInstance
            ].filter((i) => i);
        } catch (e) {
            console.warn(`${date()} ${justlogInstance}: ${e}`)
        }
    }
}

function getJustlogsDomain(source, channel) {
    if (source === "name") {
        const justlogInstance = Object.keys(config.domains).find(
            (justlogInstance) =>
                loggedChannels[justlogInstance]
                    ?.map((c) => c.name)
                    .includes(channel)
        );
        return config.domains[justlogInstance];
    } else if (source === "id") {
        const justlogInstance = Object.keys(config.domains).find(
            (justlogInstance) =>
                loggedChannels[justlogInstance]
                    ?.map((c) => c.userID)
                    .includes(channel)
        );
        return config.domains[justlogInstance];
    }
}

function getAllChannels() {
    let allChannels = [];
    Object.keys(loggedChannels).forEach((instances) => {
        loggedChannels[instances].forEach((channel) => {
            allChannels.push(channel);
        });
    });
    return allChannels;
}

function date() {
    return new Intl.DateTimeFormat("de-de", {
        dateStyle: "medium",
        timeStyle: "medium",
    }).format(new Date());
}

setInterval(async () => {
    await fetchLoggedChannels();
}, 600000);
