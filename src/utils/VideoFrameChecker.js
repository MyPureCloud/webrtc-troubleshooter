// adapted from https://github.com/webrtc/testrtc

class VideoFrameChecker {
  constructor(videoElement) {
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
  stop() {
    this.videoElement.removeEventListener('play', this.listener);
    this.running = false;
  }
  getCurrentImageData() {
    this.canvas.width = this.videoElement.width;
    this.canvas.height = this.videoElement.height;

    var context = this.canvas.getContext('2d');
    context.drawImage(this.videoElement, 0, 0, this.canvas.width,
      this.canvas.height);
    return context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  checkVideoFrame() {
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
  isBlackFrame(data, length) {
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

VideoFrameChecker.prototype = {
  stop: function () {
    this.videoElement.removeEventListener('play', this.listener);
    this.running = false;
  },

  getCurrentImageData: function () {
    this.canvas.width = this.videoElement.width;
    this.canvas.height = this.videoElement.height;

    var context = this.canvas.getContext('2d');
    context.drawImage(this.videoElement, 0, 0, this.canvas.width,
      this.canvas.height);
    return context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  },

  checkVideoFrame: function () {
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
  },

  isBlackFrame: function (data, length) {
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
};

/* This is an implementation of the algorithm for calculating the Structural
 * SIMilarity (SSIM) index between two images. Please refer to the article [1],
 * the website [2] and/or the Wikipedia article [3]. This code takes the value
 * of the constants C1 and C2 from the Matlab implementation in [4].
 *
 * [1] Z. Wang, A. C. Bovik, H. R. Sheikh, and E. P. Simoncelli, "Image quality
 * assessment: From error measurement to structural similarity",
 * IEEE Transactions on Image Processing, vol. 13, no. 1, Jan. 2004.
 * [2] http://www.cns.nyu.edu/~lcv/ssim/
 * [3] http://en.wikipedia.org/wiki/Structural_similarity
 * [4] http://www.cns.nyu.edu/~lcv/ssim/ssim_index.m
 */

class Ssim {
  // Implementation of Eq.2, a simple average of a vector and Eq.4., except the
  // square root. The latter is actually an unbiased estimate of the variance,
  // not the exact variance.
  statistics(a) {
    var accu = 0;
    var i;
    for (i = 0; i < a.length; ++i) {
      accu += a[i];
    }
    var meanA = accu / (a.length - 1);
    var diff = 0;
    for (i = 1; i < a.length; ++i) {
      diff = a[i - 1] - meanA;
      accu += a[i] + (diff * diff);
    }
    return {mean: meanA, variance: accu / a.length};
  }

  // Implementation of Eq.11., cov(Y, Z) = E((Y - uY), (Z - uZ)).
  covariance(a, b, meanA, meanB) {
    var accu = 0;
    for (var i = 0; i < a.length; i += 1) {
      accu += (a[i] - meanA) * (b[i] - meanB);
    }
    return accu / a.length;
  }

  calculate(x, y) {
    if (x.length !== y.length) {
      return 0;
    }

    // Values of the constants come from the Matlab code referred before.
    var K1 = 0.01;
    var K2 = 0.03;
    var L = 255;
    var C1 = (K1 * L) * (K1 * L);
    var C2 = (K2 * L) * (K2 * L);
    var C3 = C2 / 2;

    var statsX = this.statistics(x);
    var muX = statsX.mean;
    var sigmaX2 = statsX.variance;
    var sigmaX = Math.sqrt(sigmaX2);
    var statsY = this.statistics(y);
    var muY = statsY.mean;
    var sigmaY2 = statsY.variance;
    var sigmaY = Math.sqrt(sigmaY2);
    var sigmaXy = this.covariance(x, y, muX, muY);

    // Implementation of Eq.6.
    var luminance = (2 * muX * muY + C1) /
      ((muX * muX) + (muY * muY) + C1);
    // Implementation of Eq.10.
    var structure = (sigmaXy + C3) / (sigmaX * sigmaY + C3);
    // Implementation of Eq.9.
    var contrast = (2 * sigmaX * sigmaY + C2) / (sigmaX2 + sigmaY2 + C2);

    // Implementation of Eq.12.
    return luminance * contrast * structure;
  }
}

export default VideoFrameChecker;
