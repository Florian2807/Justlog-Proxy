const http = require('http')
const got = require('got')
const express = require('express')
const config = require('./config.json')
const loggedChannels = {}

const request = require('request');
const app = express()

app.get('/instances/', (req, res) => {
    console.log(`${date()} request: ${req.url}`)
    res.send(loggedChannels)
})
app.get('/channels', (req, res) => {
    res.set("Access-Control-Allow-Origin", "*")
    res.send({channels: getAllChannels().sort((a, b) => a.name.localeCompare(b.name))})
})

app.get('/list', (req, res) => {
    res.set("Access-Control-Allow-Origin", "*")
    const channel = /[?&/]channel[=/]([a-zA-Z_0-9]+)/.exec(req.originalUrl)?.[1]
    const justlogDomain = getJustlogsDomain("name", channel)
    if(!justlogDomain) {
        res.sendStatus(404)
        return
    }
    req.pipe(request(`${justlogDomain}/${req.url}`)).pipe(res);
})

app.get('/channel/:channelName/user/:userName*', (req, res) => {
    res.set("Access-Control-Allow-Origin", "*")
    console.log(`${date()} request: ${req.url}`)
    requestChannelAndUser(req, res)
})
app.get('/channel/:channelName/userid/:userName*', (req, res) => {
    console.log(`${date()} request: ${req.url}`)
    res.set("Access-Control-Allow-Origin", "*")
    requestChannelAndUser(req, res)
})
app.get('/channelid/:channelName/userid/:userName*', (req, res) => {
    console.log(`${date()} request: ${req.url}`)
    res.set("Access-Control-Allow-Origin", "*")
    requestChannelAndUser(req, res)
})

app.get('/channelid/:channelName*', (req, res) => {
    console.log(`${date()} request: ${req.url}`)
    res.set("Access-Control-Allow-Origin", "*")
    requestChannel(req, res)
})
app.get('/channel/:channelName*', (req, res) => {
    console.log(`${date()} request: ${req.url}`)
    res.set("Access-Control-Allow-Origin", "*")
    requestChannel(req, res)
})
app.get('/channelid/:channelName*', (req, res) => {
    console.log(`${date()} request: ${req.url}`)
    res.set("Access-Control-Allow-Origin", "*")
    requestChannel(req, res)
})


function requestChannel(req, res) {

    const channel = req.params.channelName

    let justlogDomain
    if (!channel) {
        console.log("no channel specified")
        res.sendStatus(404)
        return
    }

    const channelRegex = /\/([a-zA-Z_0-9]+)\/([a-zA-Z_0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)/

    const regexTest = channelRegex.exec(req.url)
    if (!regexTest) {
        res.redirect(`${req.url}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`)
    }

    const urlPath = req.url.split('?')[0].split('/').filter(i => i !== '')
    switch (urlPath[0]?.toLowerCase()) {
        case 'channel':
            justlogDomain = getJustlogsDomain("name", channel)
            break
        case 'channelid':
            justlogDomain = getJustlogsDomain("id", channel)
    }

    if (!justlogDomain) {
        console.log('404 Channel not found')
        res.status(404).send("could not load logs")
        return
    }
    const requestUrl = `${justlogDomain}/${req.originalUrl}`
    req.pipe(request(requestUrl)).pipe(res);
    res.url = requestUrl
}

function requestChannelAndUser(req, res) {

    const channel = req.params.channelName

    let justlogDomain
    if (!channel) {
        console.log("no channel specified")
        res.sendStatus(404)
        return
    }

    const channelRegex = /\/([a-zA-Z_0-9]+)\/([a-zA-Z_0-9]+)\/([0-9]+)\/([0-9]+)/

    const regexTest = channelRegex.exec(req.url)
    if (!regexTest) {
        res.redirect(`${req.url}/${new Date().getFullYear()}/${new Date().getMonth() + 1}`)
    }

    const urlPath = req.url.split('?')[0].split('/').filter(i => i !== '')
    switch (urlPath[0]?.toLowerCase()) {
        case 'channel':
            justlogDomain = getJustlogsDomain("name", channel)
            break
        case 'channelid':
            justlogDomain = getJustlogsDomain("id", channel)
    }
    if (!justlogDomain) {
        console.log('404 Channel not found')
        // res.sendStatus(404)
        return
    }
    const requestUrl = `${justlogDomain}/${req.originalUrl}`
    req.pipe(request(requestUrl)).pipe(res);
    res.url = requestUrl
}


const server = http.createServer(app)

server.listen(config.port, async () => {
    console.log(`${date()}: Server listening on port ${config.port}`)

    await fetchLoggedChannels()
})

async function fetchLoggedChannels() {
    let allChannels = {}
    for (const justlogInstance in config.domains) {
        try {
            const {channels} = await got(`${config.domains[justlogInstance]}/channels`, {retry: {limit: 2}}).json();
            allChannels[justlogInstance] = channels.map(i => {
                if (!Object.values(allChannels).flat().map(c => {
                    return c?.name
                }).includes(i.name)) {
                    return {userID: i.userID, name: i.name}
                } else {
                    return undefined
                }
            })
            loggedChannels[justlogInstance] = allChannels[justlogInstance].filter(i => i)
        } catch (e) {

            console.warn(`${date()} ${justlogInstance}: ${e}`)
        }
    }
}

function getJustlogsDomain(source, channel) {
    if (source === "name") {
        const justlogInstance = Object.keys(config.domains).find(justlogInstance => loggedChannels[justlogInstance]?.map(c => c.name).includes(channel))
        return config.domains[justlogInstance]
    } else if (source === "id") {
        const justlogInstance = Object.keys(config.domains).find(justlogInstance => loggedChannels[justlogInstance]?.map(c => c.userID).includes(channel))
        return config.domains[justlogInstance]
    }
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

function date() {
    return new Intl.DateTimeFormat("de-de", {
        dateStyle: "medium",
        timeStyle: "medium",
    }).format(new Date());
}

setInterval(async () => {
    await fetchLoggedChannels()
}, 600000)
