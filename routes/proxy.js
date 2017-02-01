var cacheKeys = {};
var express = require('express');
var router = express.Router();

(function () {
    "use strict";

    router.get('/', function (req, res, next) {
        res.send('usage: /write/channel/userId && /read/channel/userId');
    });

    router.get('/read', function (req, res, next) {
        res.send('<h1>usage: /read/channel/userId</h1>');
    });

    router.all('/write', function (req, res, next) {
        res.send('<h1>usage: /write/channel/userId</h1>');
    });

    router.all('/write/:channel/:userId', function (req, res, next) {
        let channel = req.params["channel"];
        let userId = req.params["userId"];

        let cacheKey = userId + channel;
        if (firstRequestToCache(cacheKey)) {
            cacheKeys[cacheKey] = [];
            cacheKeys[cacheKey + "pointer"] = 0;
        }

        if (isRequestPopulated(req.body)) {
            cacheKeys[cacheKey].push(req.body);
            if (cacheKeys[cacheKey].length > 1000) {
                cacheKeys[cacheKey] = cacheKeys[cacheKey].splice(-100);
                cacheKeys[cacheKey + "pointer"] = 0;
            }
            res.send(cacheKey);
        } else {
            res.send("no request received");
        }
    });


    router.get('/read/:channel/:userId', function (req, res, next) {
        let channel = req.params["channel"];
        let userId = req.params["userId"];

        let actualUsersPointer = getActualUserPointer(userId + channel) || 0;
        let cacheKey = cacheKeys[userId + channel] || [];
        let response = cacheKey[actualUsersPointer] || null;
        if (response !== null) {
            cacheKeys[userId + channel + "pointer"] = actualUsersPointer + 1;
        } else {
            response = "";
        }

        res.send(response);
    });


    router.get('/read-all', function (req, res, next) {
        let channel = req.query["channel"] || "";
        let userId = req.query["userId"] || "";
        let response = {};

        if (notFiltered(channel, userId)) {
            response = cacheKeys;
        } else  if (filteredByChannelAndUserId(channel, userId)) {
            response = searchInCacheFor(userId + channel);
        } else if (isFilteredBy(userId)) {
            response = searchInCacheFor(userId);
        } else if (isFilteredBy(channel)) {
            response = searchInCacheFor(channel);
        }

        res.send(JSON.stringify(response));
    });

    module.exports = router;

    function getActualUserPointer(userIdWithChannel) {
        return cacheKeys[userIdWithChannel + "pointer"];
    }

    function firstRequestToCache(cacheKey) {
        return !cacheKeys[cacheKey];
    }

    function isRequestPopulated(body) {
        return Object.getOwnPropertyNames(body).length > 0;
    }

    function filteredByChannelAndUserId(channel, userId) {
        return channel !== "" && userId !== "";
    }

    function notFiltered(channel, userId) {
        return channel === "" && userId === "";
    }

    function isFilteredBy(filter) {
        return filter != "";
    }

    function searchInCacheFor(sought) {
        let response = {};
        for (const key in cacheKeys) {
            if (key.indexOf(sought) !== -1) {
                response[key] = cacheKeys[key];
            }
        }
        return response;
    }
})();
