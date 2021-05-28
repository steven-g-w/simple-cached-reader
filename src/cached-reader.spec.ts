import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  describe, beforeEach, it, before,
} from 'mocha';
import sinon, { SinonStub } from 'sinon';
import { CachedReader } from './cached-reader';

describe('CachedReader', () => {
  let readFromSourceStub: SinonStub<[], Promise<string>>;
  let cachedReader: CachedReader<string>;

  before(() => {
    chai.use(chaiAsPromised);
  });

  beforeEach(() => {
    sinon.restore();
    readFromSourceStub = sinon.stub<[], Promise<string>>();
    cachedReader = new CachedReader<string>({
      entityName: 'test',
      readFromSource: readFromSourceStub,
    });
  });

  it('should read from source only once when fired in parallel', async () => {
    // given
    // it takes long (100ms) to read
    const testData = 'test-data';
    readFromSourceStub.returns(new Promise<string>(
      (resolve) => setTimeout(() => resolve(testData), 100),
    ));
    // when
    const results = await Promise.all([
      cachedReader.read(),
      cachedReader.read(),
      cachedReader.read(),
      cachedReader.read(),
      cachedReader.read(),
    ]);
    // then
    expect(results).to.deep.equal([
      testData,
      testData,
      testData,
      testData,
      testData,
    ]);
    sinon.assert.callCount(readFromSourceStub, 1);
  });

  it('should not read again when cached', async () => {
    // given
    const testData = 'test-data';
    readFromSourceStub.returns(new Promise<string>(
      (resolve) => setTimeout(() => resolve(testData), 1),
    ));
    // when
    const result1 = await cachedReader.read();
    // then
    expect(result1).to.equal(testData);
    sinon.assert.callCount(readFromSourceStub, 1);
    // and when
    const result2 = await cachedReader.read();
    // and then
    expect(result2).to.equal(testData);
    sinon.assert.callCount(readFromSourceStub, 1);
  });

  it('should be able to read if first attempt failed', async () => {
    // given
    readFromSourceStub.returns(new Promise<string>(
      (_, reject) => setTimeout(() => reject(new Error('test-error')), 1),
    ));
    // when
    const failedAttempt = () => cachedReader.read();
    // then
    await expect(failedAttempt()).to.be.rejectedWith('test-error');
    // and when
    const testData = 'test-data';
    readFromSourceStub.returns(new Promise<string>(
      (resolve) => setTimeout(() => resolve(testData), 1),
    ));
    const result = await cachedReader.read();
    expect(result).to.equal(testData);
  });

  it('should refresh cache when expired', async () => {
    // given
    // @ts-ignore
    cachedReader.config.timeToLive = 100;
    const testData = 'test-data';
    readFromSourceStub.returns(new Promise<string>(
      (resolve) => setTimeout(() => resolve(testData), 1),
    ));
    // when
    const result1 = await cachedReader.read();
    // then
    expect(result1).to.equal(testData);
    sinon.assert.callCount(readFromSourceStub, 1);
    // when
    await new Promise<string>(
      (resolve) => setTimeout(() => resolve(testData), 200),
    );
    // and when
    const result2 = await cachedReader.read();
    await new Promise<string>(
      (resolve) => setTimeout(() => resolve(testData), 10),
    );
    // and then
    expect(result2).to.equal(testData);
    sinon.assert.callCount(readFromSourceStub, 2);
  });

  it('should be unhealthy with too many failures in row', async () => {
    // given
    // @ts-ignore
    cachedReader.failureInRow = 4;
    // when
    const result = cachedReader.isHealthy;
    // then
    expect(result).to.equal(false);
  });
});
