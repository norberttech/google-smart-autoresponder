'use strict';


const expect = require('expect.js');
const main = require('./../src/responder');

describe('Smart Auto Responder', () => {

    it('should delete all properties when its inactive', () => {

        var propertiesDeleted = false;

        global.PropertiesService = {
            getUserProperties: function() {
                return {
                    deleteAllProperties: function() {
                        propertiesDeleted = true;
                    }
                }
            }
        };

        global.Utilities = {
            formatDate: function(date, timezone, format) {
                if (format === 'H') {
                    return 10;
                }

                if (format === 'u') {
                    return 1;
                }

                throw Error('Unknown format: ' + format);
            }
        };
        global.CalendarApp = {getTimeZone: function() { return 'Europe/Warsaw'; }};

        global.GmailApp = {search: function() {return [];}};

        main();
        expect(propertiesDeleted).to.be(true);
    });

    it('should send notification only once', () => {

        var properties = {};
        var receiverEmail = null;
        var subjectEmail  = null;
        var emailSent = 0;

        global.PropertiesService = {
            getUserProperties: function() {
                return {
                    getProperty: function(property) {
                        if (typeof properties[property] !== 'undefined') {
                            return properties[property]
                        }

                        return null;
                    },
                    setProperty: function(key, value) {
                        properties[key] = value;
                    }
                }
            }
        };

        global.Utilities = {
            formatDate: function(date, timezone, format) {
                if (format === 'H') {
                    return 7; // responder still active
                }

                if (format === 'u') {
                    return 1;
                }

                if (format === 'hh:mm a') {
                    return new Date().getHours() + ':' + new Date().getMinutes() + ' am';
                }

                throw Error('Unknown format: ' + format);
            }
        };
        global.CalendarApp = {getTimeZone: function() { return 'Europe/Warsaw'; }};

        global.GmailApp = {
            sendEmail: function(receiver, subject, body) {
                receiverEmail = receiver;
                subjectEmail  = subject;
                emailSent += 1;
            },
            search: function() {
                return [
                    {
                        getLastMessageDate: function() {
                            return new Date();
                        },
                        getMessages: function() {
                            return [
                                {
                                    getFrom: function() {
                                        return 'norbert@orzechowicz.pl'
                                    }
                                }
                            ];
                        },
                    }
                ];
            }
        };

        main();
        main();

        expect(receiverEmail).to.be('norbert@orzechowicz.pl');
        expect(subjectEmail).to.be('Smart Auto Responder');
        expect(emailSent).to.be(1);
    });
});