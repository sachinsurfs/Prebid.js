import { quantcastIdSubmodule, storage, firePixel } from 'modules/quantcastIdSystem.js';
import * as utils from 'src/utils.js';

describe('QuantcastId module', function () {
  beforeEach(function() {
    storage.setCookie('__qca', '', 'Thu, 01 Jan 1970 00:00:00 GMT');
    sinon.stub(window, 'addEventListener');
  });

  afterEach(function () {
    window.addEventListener.restore();
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

describe('QuantcastId fire pixel', function () {
  beforeEach(function () {
    storage.setCookie('__qca', '', 'Thu, 01 Jan 1970 00:00:00 GMT');
    sinon.stub(utils, 'triggerPixel');
  });

  afterEach(function () {
    utils.triggerPixel.restore();
  });

  it('fpa should be set when not present on this call', function () {
    firePixel();
    let urlString = utils.triggerPixel.getCall(0).args[0];
    let url = new URL(urlString);
    let urlSearchParams = new URLSearchParams(url.search);
    assert.equal(urlSearchParams.get('fpan'), '0');
    assert.notEqual(urlSearchParams.get('fpa'), null);
  });

  it('fpa should be extracted from the Quantcast first party cookie when present on this call', function () {
    storage.setCookie('__qca', 'P0-TestFPA');
    firePixel();
    let urlString = utils.triggerPixel.getCall(0).args[0];
    let url = new URL(urlString);
    let urlSearchParams = new URLSearchParams(url.search);
    assert.equal(urlSearchParams.get('fpan'), '1');
    assert.equal(urlSearchParams.get('fpa'), 'P0-TestFPA');
  });

  it('called once', function () {
    storage.setCookie('__qca', 'P0-TestFPA');
    firePixel();
    expect(utils.triggerPixel.calledOnce).to.equal(true);
  });
});
