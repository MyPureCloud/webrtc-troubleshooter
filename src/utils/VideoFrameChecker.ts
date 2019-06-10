import Ssim from './Ssim';

/**
 * Class to check the video frame rate and stats
 */
export default class VideoFrameChecker {

  /**
   * Object withnumber of frozen, black, and total frames
   */
  public frameStats: { numFrozenFrames: number, numBlackFrames: number, numFrames: number };

  private running: boolean;
  private nonBlackPixelLumaThreshold: number;
  private identicalFrameSsimThreshold: number;
  private previousFrame: Uint8ClampedArray;
  private frameComparator: Ssim;
  private canvas: HTMLCanvasElement;
  private videoElement: HTMLVideoElement;
  private listener: EventListenerOrEventListenerObject;

  constructor (videoElement: HTMLVideoElement) {
    this.frameStats = {
      numFrozenFrames: 0,
      numBlackFrames: 0,
      numFrames: 0
    };

    this.running = true;

    this.nonBlackPixelLumaThreshold = 20;
    this.previousFrame = new Uint8ClampedArray();
    this.identicalFrameSsimThreshold = 0.985;
    this.frameComparator = new Ssim();

    this.canvas = document.createElement('canvas');
    this.videoElement = videoElement;
    this.listener = this.checkVideoFrame.bind(this);
    this.videoElement.addEventListener('play', this.listener, false);
  }

  /**
   * Stop checking the video frame
   */
  public stop (): void {
    this.videoElement.removeEventListener('play', this.listener);
    this.running = false;
  }

  /**
   * Get the current image data
   */
  private getCurrentImageData (): ImageData {
    this.canvas.width = this.videoElement.width;
    this.canvas.height = this.videoElement.height;

    let context: CanvasRenderingContext2D | null = this.canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to retrieve the 2d context from the canvas');
    }

    context.drawImage(this.videoElement, 0, 0, this.canvas.width,
      this.canvas.height);
    return context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Check the video's current frame
   */
  private checkVideoFrame (): void {
    if (!this.running) {
      return;
    }
    if (this.videoElement.ended) {
      return;
    }

    let imageData: ImageData = this.getCurrentImageData();

    if (this.isBlackFrame(imageData.data, imageData.data.length)) {
      this.frameStats.numBlackFrames++;
    }

    if (this.frameComparator.calculate(Array.from(this.previousFrame), Array.from(imageData.data)) >
      this.identicalFrameSsimThreshold) {
      this.frameStats.numFrozenFrames++;
    }
    this.previousFrame = imageData.data;

    this.frameStats.numFrames++;
    setTimeout(this.checkVideoFrame.bind(this), 20);
  }

  /**
   * Check if passed in frame is black.
   * @param data frame data
   * @param length length of data
   */
  private isBlackFrame (data: Uint8ClampedArray, length: number) {
    // TODO: Use a statistical, histogram-based detection.
    let thresh = this.nonBlackPixelLumaThreshold;
    let accuLuma = 0;
    for (let i = 4; i < length; i += 4) {
      // Use Luma as in Rec. 709: Y′709 = 0.21R + 0.72G + 0.07B
      accuLuma += (0.21 * data[i]) + (0.72 * data[i + 1]) + (0.07 * data[i + 2]);
      // Early termination if the average Luma so far is bright enough.
      if (accuLuma > (thresh * i / 4)) {
        return false;
      }
    }
    return true;
  }
}
