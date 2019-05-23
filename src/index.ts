import TestSuite from './utils/TestSuite';
import {
  AudioTest,
  VideoTest,
  ConnectivityTest,
  AdvancedCameraTest,
  ThroughputTest,
  VideoBandwidthTest,
  AudioBandwidthTest,
  SymmetricNatTest
} from './defaultTests';
import VideoFrameChecker from './utils/VideoFrameChecker';
import ERROR_CODES from './utils/testErrorCodes';

module.exports = {
  TestSuite,
  AudioTest,
  VideoTest,
  ConnectivityTest,
  AdvancedCameraTest,
  ThroughputTest,
  VideoBandwidthTest,
  VideoFrameChecker,
  AudioBandwidthTest,
  SymmetricNatTest,
  ERROR_CODES
};
