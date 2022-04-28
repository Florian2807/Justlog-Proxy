# Justlog Redirector
Small Node.js utility that finds the right [justlog](https://github.com/gempir/justlog) instance for a given channel and redirects to it.
Tries to maintain API parity, so you should be able to just give it any link that would work with a normal justlog instance.

Live instance: https://logs.florian2807.me

## Installation

Install [Node.js](https://nodejs.org/), if you dont have it already.

**Clone** the repository:
```bash
git clone https://github.com/Florian2807/FindLogsSite.git | cd FindLogsSite
```
**Install** the dependencies:
```bash
npm install
```
To **Run** the server:
```bash
node index.js
```

#### You also can use [PM2](https://www.npmjs.com/package/pm2) to run this application in the background:

**Install** PM2 as a global dependency:
```bash
npm install -g pm2
```

**Run** the application:
```bash
pm2 start index.js
```

## Configuration

Use the provided config.json file to set configuration options:

```js
{
    "domains": { //list of justlog instances to use
        "IVR": "https://logs.ivr.fi",
        "harambelogs": "https://harambelogs.pl"
    },
    "port": 5001 //port for the server to listen on
}
```
