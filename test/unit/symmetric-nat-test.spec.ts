import SymmetricNatTest from '../../src/diagnostics/SymmetricNatTest';

describe('SymmetricNatTest', () => {
  let symmetricNatTest: SymmetricNatTest;
  beforeEach(() => {
    symmetricNatTest = new SymmetricNatTest();
  });

  describe('start()', () => {
    let setLocalDescriptionSpy: jest.SpyInstance;
    beforeEach(() => {
      setLocalDescriptionSpy = jest.spyOn(window.RTCPeerConnection.prototype, 'setLocalDescription');
    });

    afterEach(() => {
      setLocalDescriptionSpy.mockRestore();
    });

    test('should result in asymmetric if it gets a single srflx candidate', async () => {
      setLocalDescriptionSpy.mockImplementation(function () {
        window.setTimeout(() => {
          this.onicecandidate({
            candidate: {
              candidate: 'candidate:842163049 1 udp 1677729535 168.215.121.226 58600 typ srflx raddr 172.18.177.27 rport 58600 generation 0 ufrag iksf network-cost 50'
            }
          });
        }, 100);
        window.setTimeout(() => {
          this.onicecandidate({
            candidate: {
              candidate: 'candidate:1960250409 1 udp 2113937151 172.18.177.27 58600 typ host generation 0 ufrag iksf network-cost 50'
            }
          });
        }, 50);
        window.setTimeout(() => {
          this.onicecandidate({});
        }, 1000);
      });
      const result = await symmetricNatTest.start();
      expect(result).toBe('nat.asymmetric');
    });

    test('should result in noSrflx if it gets no candidates', async () => {
      setLocalDescriptionSpy.mockImplementation(function () {
        window.setTimeout(() => {
          this.onicecandidate({});
        }, 1000);
      });
      const result = await symmetricNatTest.start();
      expect(result).toBe('nat.noSrflx');
    });

    test('should result in noSrflx if it gets only host candidates candidates', async () => {
      setLocalDescriptionSpy.mockImplementation(function () {
        window.setTimeout(() => {
          this.onicecandidate({
            candidate: {
              candidate: 'candidate:1960250409 1 udp 2113937151 172.18.177.27 58600 typ host generation 0 ufrag iksf network-cost 50'
            }
          });
        }, 50);
        window.setTimeout(() => {
          this.onicecandidate({});
        }, 1000);
      });

      const result = await symmetricNatTest.start();
      expect(result).toBe('nat.noSrflx');
    });

    test('should result in symmetric if it gets different ports for the same related port', async () => {
      setLocalDescriptionSpy.mockImplementation(function () {
        window.setTimeout(() => {
          this.onicecandidate({
            candidate: {
              candidate: 'candidate:842163049 1 udp 1677729535 168.215.121.226 58700 typ srflx raddr 172.18.177.27 rport 58600 generation 0 ufrag iksf network-cost 50'
            }
          });
        }, 50);
        window.setTimeout(() => {
          this.onicecandidate({
            candidate: {
              candidate: 'candidate:842163049 1 udp 1677729535 168.215.121.226 58600 typ srflx raddr 172.18.177.27 rport 58600 generation 0 ufrag iksf network-cost 50'
            }
          });
        }, 100);
        window.setTimeout(() => {
          this.onicecandidate({});
        }, 1000);
      });

      const result = await symmetricNatTest.start();
      expect(result).toBe('nat.symmetric');
    });
  });

});
