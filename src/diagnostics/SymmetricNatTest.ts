import Test from '../utils/Test';
import parseCandidate from '../utils/parseCandidate';

/**
 * Class to test symmetric NAT
 */
export default class SymmetricNatTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Symmetric Nat Test';
  }

  /**
   * Start the test
   */
  public start (): Promise<any> {
    super.start(); // tslint:disable-line

    const pc = new window.RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });
    pc.createDataChannel('symmetricNatTest');
    const candidates = {};
    pc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate && e.candidate.candidate.indexOf('srflx') !== -1) {
        const candidate = parseCandidate(e.candidate.candidate);
        this.logger.log('SymmetricNatTest Candidate', candidate);
        if (!candidates[candidate['relatedPort'] as any]) {
          candidates[candidate['relatedPort'] as any] = [];
        }
        candidates[candidate['relatedPort'] as any].push(candidate.port);
      } else if (!e.candidate) {
        const relatedPorts = Object.keys(candidates);
        if (relatedPorts.length === 1) {
          const relatedPort = relatedPorts[0];
          const ports = candidates[relatedPort];
          return this.resolve(ports.length === 1 ? 'nat.asymmetric' : 'nat.symmetric');
        } else if (relatedPorts.length === 0) {
          return this.resolve('nat.noSrflx');
        } else {
          let hasAsymmetric = false;
          let hasSymmetric = false;
          for (let i = 0; i < relatedPorts.length; i++) {
            const relatedPort = relatedPorts[i];
            const ports = candidates[relatedPort];
            if (ports.length === 1) {
              hasAsymmetric = true;
            } else {
              hasSymmetric = true;
            }
          }
          if (hasSymmetric && !hasAsymmetric) {
            return this.resolve('nat.symmetric');
          } else if (!hasSymmetric && hasAsymmetric) {
            return this.resolve('nat.asymmetric');
          } else if (hasSymmetric && hasAsymmetric) {
            return this.resolve('nat.both');
          } else {
            return this.resolve('not.noSrflx');
          }
        }
      }
    };
    pc['onendofcandidates'] = pc.onicecandidate.bind(pc, {});
    pc.createOffer().then(offer => pc.setLocalDescription(offer)); // tslint:disable-line
    this.promise.then(() => {
      pc.close();
    }).catch(e => {
      pc.close();
    });
    return this.promise;
  }

  /**
   * Tear down the test
   */
  public destroy (): void {
    super.destroy();
  }
}
