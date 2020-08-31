// process.env.PATH = process.env.PATH + ':' + process.env['LAMBDA_TASK_ROOT']

const AWS = require('aws-sdk')
const { spawn, spawnSync } = require('child_process')
const { createReadStream, createWriteStream } = require('fs')

const s3 = new AWS.S3()
// const ffprobePath = '/opt/bin/ffprobe'
// const ffmpegPath = '/opt/bin/ffmpeg'
const ffmpegPath = './bin/ffmpeg'
const allowedTypes = ['mov', 'mpg', 'mpeg', 'mp4', 'wmv', 'avi', 'webm']
const width = process.env.WIDTH
const height = process.env.HEIGHT

module.exports.handler = async (event, context) => {
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key).replace(/\+/g, ' ')
  const bucket = event.Records[0].s3.bucket.name
  const target = s3.getSignedUrl('getObject', { Bucket: bucket, Key: srcKey, Expires: 1000 })
  let fileType = srcKey.match(/\.\w+$/)

  if (!fileType) {
    throw new Error(`invalid file type found for key: ${srcKey}`)
  }

  fileType = fileType[0].slice(1)

  if (allowedTypes.indexOf(fileType) === -1) {
    throw new Error(`filetype: ${fileType} is not an allowed type`)
  }

  function createImage(seek) {
    return new Promise((resolve, reject) => {
      let tmpFile = createWriteStream(`/tmp/screenshot.jpg`)
      const ffmpeg = spawn(ffmpegPath, [
        '-ss',
        seek,
        '-i',
        target,
        '-vf',
        `thumbnail,scale=${width}:${height}`,
        '-qscale:v',
        '2',
        '-frames:v',
        '1',
        '-f',
        'image2',
        '-c:v',
        'mjpeg',
        'pipe:1'
      ])

      ffmpeg.stdout.pipe(tmpFile)

      ffmpeg.on('close', function(code) {
        tmpFile.end()
        resolve()
      })

      ffmpeg.on('error', function(err) {
        console.log(err)
        reject()
      })
    })
  }

  function uploadToS3() {
    return new Promise((resolve, reject) => {
      let tmpFile = createReadStream(`/tmp/screenshot.jpg`)
      let dstKey = srcKey.replace(/\.\w+$/, `-thumbnail.jpg`)

      var params = {
        Bucket: bucket,
        Key: dstKey,
        Body: tmpFile,
        ContentType: `image/jpg`
      }

      s3.upload(params, function(err, data) {
        if (err) {
          console.log(err)
          reject()
        }
        console.log(`successful upload to ${bucket}/${dstKey}`)
        resolve()
      })
    })
  }

  // const ffprobe = spawnSync(ffprobePath, [
  //   '-v',
  //   'error',
  //   '-show_entries',
  //   'format=duration',
  //   '-of',
  //   'default=nw=1:nk=1',
  //   target
  // ])

  // const duration = Math.ceil(ffprobe.stdout.toString())

  await createImage("00:00:05")
  await uploadToS3()

  return console.log(`processed ${bucket}/${srcKey} successfully`)
}