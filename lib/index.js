var Group = require('./Group')
var GroupWatcher = require('./GroupWatcher')
var ThreadProcessor = require('./ThreadProcessor')
var db = require('./db')
var log = require('./log')

var processor = null

if (process.env.BASIC) {
  processor = new ThreadProcessor([
    require('./filters/close'),
    require('./filters/quiet'),
    require('./filters/slow'),
    require('./filters/ama')
  ])
} else {
  processor = new ThreadProcessor([
    require('./filters/close'),
    require('./filters/quiet'),
    require('./filters/slack'),
    require('./filters/slow'),
    require('./filters/ama'),
    require('./filters/tweet'),
    require('./filters/sentiment')
  ])
}

var watcher = null
db.on('value', function (snapshot) {
  var group = new Group(snapshot.val())
  if (watcher) { watcher.stop() }
  watcher = new GroupWatcher(group, function (thread) {
    return processor.process(group, thread).catch(function (err) {
      log.error(err, 'error processing thread (%s)', thread[0].id)
    })
  })
})
