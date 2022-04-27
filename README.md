# JustLogs Combiner
This JustLogs Combiner is a utility that finds for you the right JustLogs instance and forwards you to the right page.

## Installation

**Clone** the directory:
```bash
git clone https://github.com/Florian2807/FindLogsSite.git
```
**Set up** Node if you don't have it already:
```bash
curl -sL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs
```
**Install** the dependencies:
```bash
npm install
```
To **Run** the server:
```bash
node index.js
```


<br>



#### You also can use [PM2](https://www.npmjs.com/package/pm2) to run this application in the background:

How to install PM2:
```bash
npm install pm2 -g
```

To run the application:
```bash
pm2 start index.js
```