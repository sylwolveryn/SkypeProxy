var express = require('express');
var router = express.Router();
var cache = require('memory-cache');
var users = new Set();
var cacheKeys = [];

router.get('/', function (req, res, next) {
    res.send('usage: /write/uniqueKey && /read/uniqueKey');
});

router.all('/write/*', function (req, res, next) {
    var userId = req.url.split("/")[2] || "";
    var userIdIndex = CalculateUserIdIndex(userId);
    var cacheKey = userId + userIdIndex;
    users.add(userId);
    cacheKeys.push(cacheKey);
    cache.put(cacheKey, req.body);
    res.send(JSON.stringify(cacheKeys));
});

router.get('/read/*', function (req, res, next) {
    var userId = getUserId(req);
    var firstUserIndex = getFirstUserId(userId);
    var requestToSend = cache.get(firstUserIndex);
    cache.del(firstUserIndex);
    cacheKeys.splice(cacheKeys.indexOf(firstUserIndex), 1);
    res.send(requestToSend);
});

module.exports = router;


function getUserId(req) {
    return req.url.split("/")[2] || "";
}

function CalculateUserIdIndex(userId) {
    var lastUserId = cacheKeys.reverse().find( function (element) {
        return element.indexOf(userId) !== -1;
    }) || "0";
    cacheKeys.reverse();
    var nextIndex = Number(lastUserId.match(/\d+$/)[lastUserId.match(/\d+$/).length-1]) + 1;
    return nextIndex;
}

function getFirstUserId(userId) {
    return cacheKeys.find(function (element) {
        return element.indexOf(userId) !== -1;
    }) || "";
}