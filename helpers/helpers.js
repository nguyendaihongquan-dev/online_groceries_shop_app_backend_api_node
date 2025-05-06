const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

const app_debug_mode = true;
const timezone_name = "Asia/Kolkata";
const msg_server_internal_error = "Server Internal Error";

function serverDateTime(format) {
    const jun = moment(new Date());
    jun.tz(timezone_name).format();
    return jun.format(format);
}

function Dlog(log) {
    if (app_debug_mode) {
        console.log(log);
    }
}

function serverYYYYMMDDHHmmss() {
    return serverDateTime('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
    ImagePath: () => {
        return "http://localhost:3001/img/";
    },

    ThrowHtmlError: (err, res) => {
        Dlog("---------------------------- App is Helpers Throw Crash(" + serverYYYYMMDDHHmmss() + ") -------------------------");
        Dlog(err.stack);

        fs.appendFile('./crash_log/Crash' + serverDateTime('YYYY-MM-DD HH mm ss ms') + '.txt', err.stack, (err) => {
            if(err) {
                Dlog(err);
            }
        });

        if(res) {
            res.json({'status': '0', "message": msg_server_internal_error});
            return;
        }
    },

    ThrowSocketError: (err, client, eventName) => {
        Dlog("---------------------------- App is Helpers Throw Crash(" + serverYYYYMMDDHHmmss() + ") -------------------------");
        Dlog(err.stack);

        fs.appendFile('./crash_log/Crash' + serverDateTime('YYYY-MM-DD HH mm ss ms') + '.txt', err.stack, (err) => {
            if (err) {
                Dlog(err);
            }
        });

        if (client) {
            client.emit(eventName, { 'status': '0', "message": msg_server_internal_error });
            return;
        }
    },

    CheckParameterValid: (res, jsonObj, checkKeys, callback) => {
        let isValid = true;
        let missingParameter = "";

        checkKeys.forEach((key) => {
            if(!Object.prototype.hasOwnProperty.call(jsonObj, key)) {
                isValid = false;
                missingParameter += key + " ";
            }
        });

        if(!isValid) {
            if(!app_debug_mode) {
                missingParameter = "";
            }
            res.json({ 'status': '0', "message": "Missing parameter (" + missingParameter +")" });
        } else {
            return callback();
        }
    },

    CheckParameterValidSocket: (client, eventName, jsonObj, checkKeys, callback) => {
        let isValid = true;
        let missingParameter = "";

        checkKeys.forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(jsonObj, key)) {
                isValid = false;
                missingParameter += key + " ";
            }
        });

        if (!isValid) {
            if (!app_debug_mode) {
                missingParameter = "";
            }
            client.emit(eventName, { 'status': '0', "message": "Missing parameter (" + missingParameter + ")" });
        } else {
            return callback();
        }
    },

    createRequestToken: () => {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = '';
        for (let i = 20; i > 0; i--) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    },

    Dlog,
    serverDateTime,
    serverYYYYMMDDHHmmss,

    createNumber: (length = 4) => {
        const chars = "0123456789";
        let result = '';
        for (let i = length; i > 0; i--) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    },

    fileNameGenerate: (extension) => {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = '';
        for (let i = 10; i > 0; i--) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return serverDateTime('YYYYMMDDHHmmssms') + result + '.' + extension;
    }
};

process.on('uncaughtException', (err) => {

})