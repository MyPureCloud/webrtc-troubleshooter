import Test from '../utils/Test';
import parseCandidate from '../utils/parseCandidate';

class SymmetricNatTest extends Test {
  constructor () {
    super(...arguments);
    this.name = 'Symmetric Nat Test';
  }

  start () {
    super.start();

    const pc = new window.RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });
    pc.createDataChannel('symmetricNatTest');
    const candidates = {};
    pc.onicecandidate = (e) => {
      if (e.candidate && e.candidate.candidate.indexOf('srflx') !== -1) {
        const candidate = parseCandidate(e.candidate.candidate);
        this.logger.log('SymmetricNatTest Candidate', candidate);
        if (!candidates[candidate.relatedPort]) {
          candidates[candidate.relatedPort] = [];
        }
        candidates[candidate.relatedPort].push(candidate.port);
      } else if (!e.candidate) {
        const candidatePorts = Object.keys(candidates);
        if (candidatePorts.length === 1) {
          const ports = candidates[candidatePorts];
          this.resolve(ports.length === 1 ? 'nat.asymmetric' : 'nat.symmetric');
        } else if (candidatePorts.length === 0) {
          this.resolve('nat.noSrflx');
        } else {
          this.resolve('nat.multipleRelated');
        }
      }
    };
    pc.onendofcandidates = pc.onicecandidate.bind(pc, {});
    pc.createOffer().then(offer => pc.setLocalDescription(offer));
    return this.promise;
  }

  destroy () {
    super.destroy();
  }
}

export default SymmetricNatTest;
