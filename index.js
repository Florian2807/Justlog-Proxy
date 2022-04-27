const http = require('http')
const got = require('got')

const express = require('express')

const app = express()
let logsChannels = {"apulxd": [], "IVR": [], "harambelogs": []}
updateLogsChannels()

app.get('*', (req, res) => {
    const regex = new RegExp("(?:\\?|&|\\/)channel(?:=|\\/)([a-zA-Z_0-9]+)")
    const path = req.originalUrl
    const channel = regex.exec(path)?.[1] ?? null
    if (!channel) {
        res.send("Channel not found")
        return
    }
    const url = getRightLogs(channel)
    res.redirect(`${url}${path}`)
})


const server = http.createServer(app)

server.listen(5000, () => {
    console.log('listening on port 5000')
})

setInterval(async () => {
    await updateLogsChannels()
}, 600000)

async function updateLogsChannels() {

    try {
        const {channels: channelsApulxd} = await got('https://logs.paauulli.me/channels').json();
        logsChannels.apulxd = channelsApulxd.map(i => i.name)
    } catch (e) {
        console.log(`apulxd: ${e}`)
    }

    try {
        const {channels: channelsIVR} = await got('https://logs.ivr.fi/channels').json();
        logsChannels.IVR = channelsIVR.map(i => i.name)
    } catch (e) {
        console.log(`IVR: ${e}`)
    }

    try {
        const {channels: channelsHarablelogs} = await got('https://logs.zneix.eu/channels').json();
        logsChannels.harambelogs = channelsHarablelogs.map(i => i.name)
    } catch (e) {
        console.log(`Harambelogs: ${e}`)
    }
}

function getRightLogs(channel) {
    let mainurl
    if (logsChannels['apulxd'].includes(channel)) {
        mainurl = "https://logs.paauulli.me"
    } else if (logsChannels['IVR'].includes(channel)) {
        mainurl = "https://logs.ivr.fi"
    } else if (logsChannels['harambelogs'].includes(channel)) {
        mainurl = "https://logs.zneix.eu"
    } else {
        mainurl = undefined
    }
    return mainurl
}