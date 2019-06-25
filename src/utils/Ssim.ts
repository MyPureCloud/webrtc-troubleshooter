// adapted from https://github.com/webrtc/testrtc

/**
 * This is an implementation of the algorithm for calculating the Structural
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
export default class Ssim {

  /**
   * Implementation of Eq.2, a simple average of a vector and Eq.4., except the
   *  square root. The latter is actually an unbiased estimate of the variance,
   *  not the exact variance.
   * @param a array of statistics
   */
  private statistics (a: number[]): { mean: number, variance: number } {
    let accu: number = 0;
    let i: number;
    for (i = 0; i < a.length; ++i) {
      accu += a[i];
    }
    let meanA: number = accu / (a.length - 1);
    let diff: number = 0;
    for (i = 1; i < a.length; ++i) {
      diff = a[i - 1] - meanA;
      accu += a[i] + (diff * diff);
    }
    return { mean: meanA, variance: accu / a.length };
  }

  /**
   * Implementation of Eq.11., cov(Y, Z) = E((Y - uY), (Z - uZ)).
   * @param {number} a
   * @param {number} b
   * @param {number} meanA
   * @param {number} meanB
   */
  private covariance (a: number[], b: number[], meanA: number, meanB: number): number {
    let accu = 0;
    for (let i = 0; i < a.length; i += 1) {
      accu += (a[i] - meanA) * (b[i] - meanB);
    }
    return accu / a.length;
  }

  /**
   * Calculate the Structural SIMilarity (SSIM) index between two images
   * @param x first array of stat
   * @param y second array of stat
   */
  public calculate (x: number[], y: number[]): number {
    if (x.length !== y.length) {
      return 0;
    }

    // Values of the constants come from the Matlab code referred before.
    let K1 = 0.01;
    let K2 = 0.03;
    let L = 255;
    let C1 = (K1 * L) * (K1 * L);
    let C2 = (K2 * L) * (K2 * L);
    let C3 = C2 / 2;

    let statsX = this.statistics(x);
    let muX = statsX.mean;
    let sigmaX2 = statsX.variance;
    let sigmaX = Math.sqrt(sigmaX2);
    let statsY = this.statistics(y);
    let muY = statsY.mean;
    let sigmaY2 = statsY.variance;
    let sigmaY = Math.sqrt(sigmaY2);
    let sigmaXy = this.covariance(x, y, muX, muY);

    // Implementation of Eq.6.
    let luminance = ((2 * muX * muY) + C1) /
      ((muX * muX) + (muY * muY) + C1);
    // Implementation of Eq.10.
    let structure = (sigmaXy + C3) / ((sigmaX * sigmaY) + C3);
    // Implementation of Eq.9.
    let contrast = ((2 * sigmaX * sigmaY) + C2) / (sigmaX2 + sigmaY2 + C2);

    // Implementation of Eq.12.
    return luminance * contrast * structure;
  }
}
