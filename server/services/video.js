import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

export async function convertVideo(inputPath) {
  const outputPath = inputPath.replace(path.extname(inputPath), '_480p.mp4');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf scale=-2:480',
        '-c:v libx264',
        '-preset fast',
        '-crf 28',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('end', async () => {
        // Delete original file after conversion
        try {
          await fs.unlink(inputPath);
        } catch (err) {
          console.error('Error deleting original video:', err);
        }
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error converting video:', err);
        reject(err);
      })
      .run();
  });
}
