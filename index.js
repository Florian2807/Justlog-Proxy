const http = require('http')
const got = require('got')
const express = require('express')

const config = require('./config.json')
const loggedChannels = {}

const app = express()

app.get('/channels/instances/', (req, res) => {
    response.send(loggedChannels)
})

app.get('/channels', (request, response) => {
    response.send({channels: getAllChannels()})
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
server.listen(config.port, async () => {
    console.log(`Server listening on port ${config.port}`)

    await fetchLoggedChannels()
})

async function fetchLoggedChannels() {
    for (const justlogInstance in config.domains) {
        try {
            const {channels} = await got(`${config.domains[justlogInstance]}/channels`).json();
            loggedChannels[justlogInstance] = channels.map(i => {
                return {userID: i.userID, name: i.name}
            })
        } catch (e) {
            console.warn(`${justlogInstance}: ${e}`)
        }
    }
}

function getJustlogsDomain(channel) {
    const justlogInstance = Object.keys(config.domains).find(justlogInstance => loggedChannels[justlogInstance].includes(channel))
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
