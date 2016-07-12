import Ssim from './Ssim.js';
export default class VideoFrameChecker {
  constructor (videoElement) {
    this.frameStats = {
      numFrozenFrames: 0,
      numBlackFrames: 0,
      numFrames: 0
    };

    this.running = true;

    this.nonBlackPixelLumaThreshold = 20;
    this.previousFrame = [];
    this.identicalFrameSsimThreshold = 0.985;
    this.frameComparator = new Ssim();

    this.canvas = document.createElement('canvas');
    this.videoElement = videoElement;
    this.listener = this.checkVideoFrame.bind(this);
    this.videoElement.addEventListener('play', this.listener, false);
  }
  stop () {
    this.videoElement.removeEventListener('play', this.listener);
    this.running = false;
  }
  getCurrentImageData () {
    this.canvas.width = this.videoElement.width;
    this.canvas.height = this.videoElement.height;

    var context = this.canvas.getContext('2d');
    context.drawImage(this.videoElement, 0, 0, this.canvas.width,
      this.canvas.height);
    return context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  checkVideoFrame () {
    if (!this.running) {
      return;
    }
    if (this.videoElement.ended) {
      return;
    }

    var imageData = this.getCurrentImageData();

    if (this.isBlackFrame(imageData.data, imageData.data.length)) {
      this.frameStats.numBlackFrames++;
    }

    if (this.frameComparator.calculate(this.previousFrame, imageData.data) >
      this.identicalFrameSsimThreshold) {
      this.frameStats.numFrozenFrames++;
    }
    this.previousFrame = imageData.data;

    this.frameStats.numFrames++;
    setTimeout(this.checkVideoFrame.bind(this), 20);
  }
  isBlackFrame (data, length) {
    // TODO: Use a statistical, histogram-based detection.
    var thresh = this.nonBlackPixelLumaThreshold;
    var accuLuma = 0;
    for (var i = 4; i < length; i += 4) {
      // Use Luma as in Rec. 709: Y′709 = 0.21R + 0.72G + 0.07B
      accuLuma += 0.21 * data[i] + 0.72 * data[i + 1] + 0.07 * data[i + 2];
      // Early termination if the average Luma so far is bright enough.
      if (accuLuma > (thresh * i / 4)) {
        return false;
      }
    }
    return true;
  }
}
