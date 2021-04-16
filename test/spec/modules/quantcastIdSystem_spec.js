import { quantcastIdSubmodule, storage, firePixel } from 'modules/quantcastIdSystem.js';
import * as utils from 'src/utils.js';

describe('QuantcastId module', function () {
  beforeEach(function() {
    storage.setCookie('__qca', '', 'Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('getId() should return a quantcast id when the Quantcast first party cookie exists', function () {
    storage.setCookie('__qca', 'P0-TestFPA');

    const id = quantcastIdSubmodule.getId();
    expect(id).to.be.deep.equal({id: {quantcastId: 'P0-TestFPA'}});
  });

  it('getId() should return an empty id when the Quantcast first party cookie is missing', function () {
    const id = quantcastIdSubmodule.getId();
    expect(id).to.be.deep.equal({id: undefined});
  });
});

describe('Test firing pixel ', function () {
  beforeEach(function () {
    sinon.stub(utils, 'triggerPixel');
  });

  afterEach(function () {
    utils.triggerPixel.restore();
  });

  it('called once', function () {
    firePixel();
    expect(utils.triggerPixel.calledOnce).to.equal(true);
    // TODO : Add a check to validate url
  });
});
