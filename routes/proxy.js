var cacheKeys = {};
var express = require('express');
var router = express.Router();

(function () {
    "use strict";
    router.get('/', function (req, res, next) {
        res.send('usage: /write/uniqueKey && /read/uniqueKey');
    });

    router.all('/write/*', function (req, res, next) {
        let chunks = req.url.split("/");
        switch (chunks.length) {
            default:
                res.send('<h1>usage: /write/channel/uniqueKey && /read/channel/uniqueKey</h1>');
                return;
            case 4:
                let userId = getUserId(chunks);
                let channel = getChannel(chunks);
                let cacheKey = userId + channel;
                if (firstRequestToCache(userId, channel)) {
                    cacheKeys[cacheKey] = [];
                    cacheKeys[userId + channel + "pointer"] = 0;
                }

                if (isRequestPopulated(req.body)) {
                    cacheKeys[cacheKey].push(req.body);
                    if (cacheKeys[cacheKey].length > 1000) {
                        cacheKeys[cacheKey] = cacheKeys[cacheKey].splice(-100);
                        cacheKeys[userId + channel + "pointer"] = 0;
                    }
                    res.send(cacheKey);
                } else {
                    res.send("no request received");
                }
        }
    });

    router.get('/read-all(*)', function (req, res, next) {
        let chunks = req.url.split("/");
        let response = {};
        let channel;

        switch (chunks.length) {
            default:
                res.send(JSON.stringify(cacheKeys));
                return;
            case 3:
                channel = (chunks.length > 1) ? getChannel(chunks) : "";
                for (const key in cacheKeys) {
                    if (key.indexOf(channel) !== -1) {
                        response[key] = cacheKeys[key];
                    }
                }
                break;
            case 4:
                channel = (chunks.length > 1) ? getChannel(chunks) : "";
                let userId = (chunks.length > 2) ? getUserId(chunks) : "";
                for (const key in cacheKeys) {
                    if (key.indexOf(userId + channel) !== -1) {
                        response[key] = cacheKeys[key];
                    }
                }
        }
        res.send(JSON.stringify(response));
    });

    router.get('/read/*', function (req, res, next) {
        let chunks = req.url.split("/");
        switch (chunks.length) {
            default:
                res.send('<h1>usage: /write/channel/uniqueKey && /read/channel/uniqueKey</h1>');
                return;
            case 4:
                let userId = getUserId(chunks);
                let channel = getChannel(chunks);
                let actualUsersPointer = getActualUserPointer(userId + channel) || 0;
                let cacheKey = cacheKeys[userId + channel] || [];
                let response = cacheKey[actualUsersPointer] || null;
                if (response !== null) {
                    cacheKeys[userId + channel + "pointer"] = actualUsersPointer + 1;
                } else {
                    response = "";
                }

                res.send(response);
        }
    });

    module.exports = router;


    function getChannel(chunks) {
        return chunks[2] || "";
    }

    function getUserId(chunks) {
        return chunks[3] || "";
    }

    function getActualUserPointer(userIdWithChannel) {
        return cacheKeys[userIdWithChannel + "pointer"];
    }

    function firstRequestToCache(userId, channel) {
        return !cacheKeys[userId + channel];
    }

    function isRequestPopulated(body) {
        return Object.getOwnPropertyNames(body).length > 0;
    }
})();
