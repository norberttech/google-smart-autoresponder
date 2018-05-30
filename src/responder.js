/*
    Smart Autoresponder Script created by Norbert Orzechowicz.
    Mail goal of this script is to notify your coworkers from different timezones
    that you might be already away from your lapopt and do it only once per day to not
    spam each conversation.
*/

var AUTORESPONDER_START_HOUR = 20;           // When auto responder should be started 0-23 hour
var AUTORESPONDER_END_HOUR = 8;              // When auto responder should be ended 0-23 hour
var IMPORTANT_DOMAINS = [];                  // Activate only when email received from those domains [can be empty]
var IGNORED_DOMAIN = [];                     // Ignore emails from those domains [can be empty]
var IGNORED_EMAILS = [];                     // Ignore those email senders [can be empty]

var DELIEVERED_IN_LAST_MINUTES = 10;
var NO_REPLY_EMAIL = ['noreply', 'no-reply', 'mailer'];

function main()
{
    if (AUTORESPONDER_END_HOUR > AUTORESPONDER_START_HOUR) {
        throw new Error('Autoresponder end hour can\'t be greated than start hour.');
    }

    if (!isResponderActive()) {
        // Clear cache from previous activity
        PropertiesService.getUserProperties().deleteAllProperties();

        return;
    }

    var threads = GmailApp.search("to:me is:unread in:inbox newer_than:1d");

    threads
        .reduce(function (previousThreads, nextThread) {
            if (!threadExistsIn(previousThreads, nextThread)) {
                previousThreads.push(nextThread);
            }

            return previousThreads;
        }, [])
        .filter(function (thread) {
            return getMinutesSinceDelivered(thread) <= DELIEVERED_IN_LAST_MINUTES;
        })
        .filter(function (thread) {
            if (!IMPORTANT_DOMAINS.length) {
                return true;
            }

            return arrayExists(IMPORTANT_DOMAINS, getEmailDomain(getSenderEmail(thread)));
        })
        .filter(function (thread) {
            return !arrayExists(IGNORED_DOMAIN, getEmailDomain(getSenderEmail(thread)));
        })
        .filter(function (thread) {
            return !arrayExists(NO_REPLY_EMAIL, getEmailLocalPart(getSenderEmail(thread)));
        })
        .filter(function (thread) {
            return !arrayExists(IGNORED_EMAILS, getSenderEmail(thread));
        })
        .filter(function (thread) {
            return !wasNotifiedToday(getSenderEmail(thread));
        })
        .forEach(function (thread) {
            notifySender(thread);
        });
}

function threadExistsIn(threads, thread)
{
    return undefined !== arrayFind(threads, function (existingThread) {
        return getSenderEmail(existingThread) === getSenderEmail(thread);
    })
}

function getEmailLocalPart(email)
{
    return email.substring(0, email.lastIndexOf("@"));
}

function getEmailDomain(email)
{
    return email.substring(email.lastIndexOf("@") + 1, email.length);
}

function getSenderEmail(thread)
{
    if (getSender(thread).lastIndexOf("<") !== -1) {
        return getSender(thread).substring(getSender(thread).lastIndexOf("<") + 1, getSender(thread).lastIndexOf(">"));
    } else {
        return getSender(thread);
    }
}

function getSender(thread)
{
    return thread.getMessages().pop().getFrom().toLowerCase();
}

function isResponderActive()
{
    return !isWeekend() && ((currentHour() >= AUTORESPONDER_START_HOUR) || (currentHour() <= AUTORESPONDER_END_HOUR));
}

function isWeekend()
{
    return currentWeekDay() === 6 || currentWeekDay() === 7;
}

function getMinutesSinceDelivered(thread)
{
    return Math.floor((new Date().getTime() - thread.getLastMessageDate().getTime()) / 60000);
}

function currentHour()
{
    return parseInt(Utilities.formatDate(new Date(), CalendarApp.getTimeZone(), "H"));
}

function currentWeekDay()
{
    return Utilities.formatDate(new Date(), CalendarApp.getTimeZone(), "u")
}

function wasNotifiedToday(sender)
{
    return (PropertiesService.getUserProperties().getProperty(sender.toLowerCase()) || false) !== false;
}

function notifySender(thread)
{
    Logger.log(thread);

    GmailApp.sendEmail(
        getSenderEmail(thread),
        "Smart Auto Responder",
        'Hey, Thanks for reaching me out, unfortunately I might be already away from my laptop. It is ' + currentTimeString() + ' currently at my timezone. '
        + 'If this is something important please ping me at hangouts.'
        + 'If not I will get back to you next business day or maybe sooner. \n'
        + 'This is the only message you will receive today from my auto responder, it won\'t spam you after each email.'
        + 'Usually I\'m online between: ' + AUTORESPONDER_END_HOUR + ' - ' + AUTORESPONDER_START_HOUR + ' ' + CalendarApp.getTimeZone() + '\n'
        + 'Thanks for you patience!'
        + '\n\n\n'
        + 'If you would like to setup smart autoresponder for your account, please visit https://github.com/norzechowicz/google-smart-autoresponder'
    );

    PropertiesService.getUserProperties().setProperty(getSenderEmail(thread).toLowerCase(), getSenderEmail(thread).toLowerCase());
}

function currentTimeString()
{
    return Utilities.formatDate(new Date(), CalendarApp.getTimeZone(), "hh:mm a");
}

function arrayExists(array, element)
{
    return array.indexOf(element) !== -1;
}

function arrayFind(array, predicate)
{
    var list = Object(array);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
            return value;
        }
    }

    return undefined;
};

if (typeof module === 'undefined') {
    var module = {exports: {}};
}

module.exports = main;
