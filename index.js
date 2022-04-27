const http = require('http')
const got = require('got')

const express = require('express')
const config = require('./config.json')
const app = express()
let logsChannels = {}

Object.keys(config.justLogs).forEach(justLog => {
    logsChannels[justLog] = config.justLogs[justLog]
})

updateLogsChannels()

app.get('*', (req, res) => {
    const regex = new RegExp("[?&/]channel[=/]([a-zA-Z_0-9]+)")
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

server.listen(config.port, () => {
    console.log(`listening on port ${config.port.toString()}`)
})

setInterval(async () => {
    await updateLogsChannels()
}, 600000)

async function updateLogsChannels() {
    for (const channel in config.justLogs) {
        try {
            const {channels} = await got(`${config.justLogs[channel]}/channels`).json();
            logsChannels[channel] = channels.map(i => i.name)
        } catch (e) {
            console.warn(`${channel}: ${e}`)
        }
    }
}

function getRightLogs(channel) {
    return config.justLogs[Object.keys(config.justLogs).find(justLog => logsChannels[justLog].includes(channel))]
}