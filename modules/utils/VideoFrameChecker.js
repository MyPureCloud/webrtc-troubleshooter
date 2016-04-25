// adapted from https://github.com/webrtc/testrtc

class VideoFrameChecker {
  constructor (videoElement) {
    frameStats = {
      numFrozenFrames: 0,
      numBlackFrames: 0,
      numFrames: 0
    };

    running_ = true;

    nonBlackPixelLumaThreshold = 20;
    previousFrame_ = [];
    identicalFrameSsimThreshold = 0.985;
    frameComparator = new Ssim();

    canvas_ = document.createElement('canvas');
    videoElement_ = videoElement;
    listener_ = checkVideoFrame_.bind(this);
    videoElement_.addEventListener('play', listener_, false);
  }
  stop () {
    videoElement_.removeEventListener('play', listener_);
    running_ = false;
  }
  getCurrentImageData_ () {
    canvas_.width = videoElement_.width;
    canvas_.height = videoElement_.height;

    var context = canvas_.getContext('2d');
    context.drawImage(videoElement_, 0, 0, canvas_.width,
      canvas_.height);
    return context.getImageData(0, 0, canvas_.width, canvas_.height);
  }
  checkVideoFrame_ () {
    if (!running_) {
      return;
    }
    if (videoElement_.ended) {
      return;
    }

    var imageData = getCurrentImageData_();

    if (isBlackFrame_(imageData.data, imageData.data.length)) {
      frameStats.numBlackFrames++;
    }

    if (frameComparator.calculate(previousFrame_, imageData.data) >
      identicalFrameSsimThreshold) {
      frameStats.numFrozenFrames++;
    }
    previousFrame_ = imageData.data;

    frameStats.numFrames++;
    setTimeout(checkVideoFrame_.bind(this), 20);
  }
  isBlackFrame_ (data, length) {
    // TODO: Use a statistical, histogram-based detection.
    var thresh = nonBlackPixelLumaThreshold;
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
    videoElement_.removeEventListener('play', listener_);
    running_ = false;
  },

  getCurrentImageData_: function () {
    canvas_.width = videoElement_.width;
    canvas_.height = videoElement_.height;

    var context = canvas_.getContext('2d');
    context.drawImage(videoElement_, 0, 0, canvas_.width,
      canvas_.height);
    return context.getImageData(0, 0, canvas_.width, canvas_.height);
  },

  checkVideoFrame_: function () {
    if (!running_) {
      return;
    }
    if (videoElement_.ended) {
      return;
    }

    var imageData = getCurrentImageData_();

    if (isBlackFrame_(imageData.data, imageData.data.length)) {
      frameStats.numBlackFrames++;
    }

    if (frameComparator.calculate(previousFrame_, imageData.data) >
      identicalFrameSsimThreshold) {
      frameStats.numFrozenFrames++;
    }
    previousFrame_ = imageData.data;

    frameStats.numFrames++;
    setTimeout(checkVideoFrame_.bind(this), 20);
  },

  isBlackFrame_: function (data, length) {
    // TODO: Use a statistical, histogram-based detection.
    var thresh = nonBlackPixelLumaThreshold;
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
  statistics (a) {
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
  covariance (a, b, meanA, meanB) {
    var accu = 0;
    for (var i = 0; i < a.length; i += 1) {
      accu += (a[i] - meanA) * (b[i] - meanB);
    }
    return accu / a.length;
  }

  calculate (x, y) {
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

    var statsX = statistics(x);
    var muX = statsX.mean;
    var sigmaX2 = statsX.variance;
    var sigmaX = Math.sqrt(sigmaX2);
    var statsY = statistics(y);
    var muY = statsY.mean;
    var sigmaY2 = statsY.variance;
    var sigmaY = Math.sqrt(sigmaY2);
    var sigmaXy = covariance(x, y, muX, muY);

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
