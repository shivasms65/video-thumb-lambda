const { spawn, spawnSync } = require('child_process');
// const ffmpegPath = './bin/ffmpeg';
const { createReadStream, createWriteStream } = require('fs')

const target = "/Users/noentry/Downloads/sample_960x540.mov";

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = './bin/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath);

// function createImage(seek) {
//   return new Promise((resolve, reject) => {
//     let tmpFile = createWriteStream(`./screenshot.jpg`)
//     const ffmpeg = spawn(ffmpegPath, [
//       '-i',
//       target,
//       '-ss',
//       30,
//       '-vf',
//       `thumbnail,scale=400:300`,
//       '-qscale:v',
//       '2',
//       '-vframes',
//       '1',
//       '-f',
//       'image2',
//       '-c:v',
//       'mjpeg',
//       'pipe:1'
//     ])

//     ffmpeg.stdout.pipe(tmpFile)

//     ffmpeg.on('close', function(code) {
//       tmpFile.end()
//       resolve()
//     })

//     ffmpeg.on('error', function(err) {
//       console.log(err)
//       reject()
//     })
//   })
// }

function createImage(seek) {
  return new Promise((resolve, reject) => {
    ffmpeg(target)
    .on('end', function() {
      console.log('Screenshots taken');
      uploadToS3().then(function() {
        console.log('Successfully Uploaded to S3');
        resolve();
      })
    })
    .screenshots({
      timestamps: ["00:00:05"],
      filename: 'generated-thumbnail.jpg',
      folder: '/tmp'
    }).on('error', function(err) {
    console.log('an error happened: ' + err.message);
    });
  })
}

createImage("05");