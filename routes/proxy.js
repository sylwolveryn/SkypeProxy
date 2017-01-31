var express = require('express');
var router = express.Router();
var cacheKeys = {};

router.get('/', function (req, res, next) {
    res.send('usage: /write/uniqueKey && /read/uniqueKey');
});

router.all('/write/*', function (req, res, next) {
    "use strict";
    let chunks = req.url.split("/");
    switch (chunks.length) {
        case 0:
        case 1:
        case 2:
        case 3:
        default:
            res.send('<h1>usage: /write/<b>channel</b>/uniqueKey && /read/<b>channel</b>/uniqueKey</h1>');
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
                res.send(cacheKey);
            } else {
                res.send("no request received");
            }
    }
});

router.get('/read/*', function (req, res, next) {
    "use strict";
    let chunks = req.url.split("/");
    switch (chunks.length) {
        case 0:
        case 1:
        case 2:
        case 3:
        default:
            res.send('<h1>usage: /write/<b>channel</b>/uniqueKey && /read/<b>channel</b>/uniqueKey</h1>');
            return;
        case 4:
            let userId = getUserId(chunks);
            let channel = getChannel(chunks);
            let actualUsersPointer = getActualUserPointer(userId + channel) || 0;
            console.log("actualUsersPointer: " + actualUsersPointer);
            let cacheKey = cacheKeys[userId + channel] || [];
            let requestToSend = cacheKey[actualUsersPointer] || null;
            if (requestToSend !== null) {
                cacheKeys[userId + channel + "pointer"] = actualUsersPointer + 1;
            } else {
                requestToSend = "";
            }

            res.send(requestToSend);
    }
});

module.exports = router;


function getChannel(chunks) {
    "use strict";
    return chunks[2] || "";
}

function getUserId(chunks) {
    "use strict";
    return chunks[3] || "";
}

function getActualUserPointer(userIdWithChannel) {
    "use strict";
    return cacheKeys[userIdWithChannel + "pointer"];
}

function firstRequestToCache(userId, channel) {
    "use strict";
    return !cacheKeys[userId + channel];
}

function isRequestPopulated(body) {
    return Object.getOwnPropertyNames(body).length > 0;
}
