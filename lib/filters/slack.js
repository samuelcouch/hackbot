/** @module */

var _ = require('lodash')
var db = require('../db')
var log = require('../log')
var SlackInterface = require('pretty-slack')

var TEASER_LEGTH = 400

var slack = null
db.child('slack_credentials').on('value', function (snapshot) {
  slack = new SlackInterface(snapshot.val())
})

/**
 * Allows moderators to post a link to the thread in Slack.
 * @implements module:feed~Filter
 */
module.exports = function(group, thread) {

  var slackededRef = db.child('slacked')

  var slackPosts = _.filter(thread, function (post) {
    return post.hasCommand('slack') &&
      post.getArgs() !== '' &&
      group.isMod(post.from) &&
      !group.hasSlacked(post)
  })

  return Promise.all(_.map(slackPosts, function (post) {

    slackedRef.child(post.id).set(new Date().getTime())
    var postText = post.getArgs().substr(0, TEASER_LEGTH).trim()
    var postURL = 'fb.com/' + post.id
    var channel = '#general'
    var message = ''
    var options = {
      attachments: [{
        "title": "New featured post in Hackathon Hackers",
        "title_link": postURL,
        "fallback": "New featured post in Hackathon Hackers: " + postURL,
        "text": postText,
        "color": "#1D77CC"
      }]
    }

    return new Promise(function (resolve, reject) {
      slack.chat(channel, message, options, function(err, posted, body){
        if (err) return reject(err)
        resolve(body)
      })
    })

  }))

}
