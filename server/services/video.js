import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

export async function convertVideo(inputPath) {
  const outputPath = inputPath.replace(path.extname(inputPath), '_1080p.mp4');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf scale=-2:1080',
        '-c:v libx264',
        '-profile:v main',
        '-level 4.0',
        '-preset medium',
        '-crf 24',
        '-c:a aac',
        '-b:a 160k',
        '-movflags +faststart',
        '-pix_fmt yuv420p'
      ])
      .output(outputPath)
      .on('end', async () => {
        // Delete original file after conversion
        try {
          await fs.unlink(inputPath);
          console.log(`Video converted successfully: ${path.basename(outputPath)}`);
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
