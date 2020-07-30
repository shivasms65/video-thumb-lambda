const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

module.exports = ffmpeg;

// var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');

exports.handler = async function(event) {
  const promise = new Promise(function(resolve, reject) {
    const file = 'file_example_MOV_480_700kB.mov';
    ffmpeg(file).format('mov')
    .on('filenames', function(filenames) {
      console.log('Will generate ' + filenames.join(', '))
    })
    .on('end', function() {
      console.log('Screenshots taken');
      
      fs.readdir('/tmp', (err, files) => {
        files.forEach(file => {
          console.log(file);
        });
      });
      
    })
    .screenshots({
      timestamps: [0.10],
      filename: 'thumbnail-at-%s-seconds.png',
      folder: '/tmp',
      size: '320x240'
    });
  });

  return promise;
}