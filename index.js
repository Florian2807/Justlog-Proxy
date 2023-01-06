const http = require('http')
const got = require('got')
const express = require('express')

const config = require('./config.json')
const loggedChannels = {}

const app = express()

app.get('/instances/', (req, res) => {
    res.send(loggedChannels)
})

app.get('/channels', (request, response) => {
    response.send({channels: getAllChannels().sort((a, b) => a.name.localeCompare(b.name))})
})

app.get('*', (request, response) => {
    const channelRegex = /[?&/]channel[=/]([a-zA-Z_0-9]+)/

    const channel = channelRegex.exec(request.originalUrl)?.[1]
    const justlogDomain = getJustlogsDomain(channel)

    if (!justlogDomain) {
        response.sendStatus(404)
        return
    }

    response.redirect(justlogDomain + request.originalUrl)
})

const server = http.createServer(app)
const date = new Intl.DateTimeFormat("de-de", {
    dateStyle: "medium",
    timeStyle: "medium",
}).format(new Date());
server.listen(config.port, async () => {
    console.log(`${date}: Server listening on port ${config.port}`)

    await fetchLoggedChannels()
})

async function fetchLoggedChannels() {
    for (const justlogInstance in config.domains) {
        try {
            const {channels} = await got(`${config.domains[justlogInstance]}/channels`, {retry: {limit: 2}}).json();
            loggedChannels[justlogInstance] = channels.map(i => {
                if (!Object.values(loggedChannels).flat().map(c => {
                    return c?.name
                }).includes(i.name)) {
                    return {userID: i.userID, name: i.name}
                } else {
                    return undefined
                }
            })
            loggedChannels[justlogInstance] = loggedChannels[justlogInstance].filter(i => i !== undefined)
        } catch (e) {
            const date = new Intl.DateTimeFormat("de-de", {
                dateStyle: "medium",
                timeStyle: "medium",
            }).format(new Date());
            console.warn(`${date} ${justlogInstance}: ${e}`)
        }
    }
}

function getJustlogsDomain(channel) {
    const justlogInstance = Object.keys(config.domains).find(justlogInstance => loggedChannels[justlogInstance].map(c => c.name).includes(channel))
    return config.domains[justlogInstance]
}

function getAllChannels() {
    let allChannels = [];
    Object.keys(loggedChannels).forEach(instances => {
        loggedChannels[instances].forEach(channel => {
            allChannels.push(channel);
        })
    })
    return allChannels
}

setInterval(async () => {
    await fetchLoggedChannels()
}, 600000)
