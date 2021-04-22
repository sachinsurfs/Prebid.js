/**
 * This module adds QuantcastID to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/quantcastIdSystem
 * @requires module:modules/userId
 */

import {submodule} from '../src/hook.js'
import { getStorageManager } from '../src/storageManager.js';
import { triggerPixel, deepAccess } from '../src/utils.js';

const QUANTCAST_FPA = '__qca';
const DEFAULT_COOKIE_EXP_TIME = 392; // (13 months - 2 days)
const PREBID_PCODE = 'p-KceJUEvXN48CE'; // Not associated with a real account
const DOMAIN_QSERVE = 'https://pixel.quantserve.com/pixel';

var emailHash;
var cookieExpTime;
var globalConsentData;

export const storage = getStorageManager();

export function firePixel() {
  // check for presence of Quantcast Measure tag _qevent obj
  if (!window._qevents && hasGDPRConsent(globalConsentData)) {
    let fpa = storage.getCookie(QUANTCAST_FPA);
    let fpan = '0';
    let now = new Date();
    let domain = quantcastIdSubmodule.findRootDomain();
    let et = now.getTime();
    let tzo = now.getTimezoneOffset();

    if (!fpa) {
      let expires = new Date(now.getTime() + (cookieExpTime * 86400000)).toGMTString();
      fpa = 'B0-' + Math.round(Math.random() * 2147483647) + '-' + et;
      fpan = '1';
      storage.setCookie(QUANTCAST_FPA, fpa, expires, '/', domain, null);
    }

    let url = DOMAIN_QSERVE +
    '?fpan=' + fpan +
    '&fpa=' + fpa +
    '&d=' + domain +
    '&et=' + et +
    '&tzo=' + tzo +
    '&uh=' + emailHash +
    '&uht=1' +
    '&a=' + PREBID_PCODE;

    triggerPixel(url);
  }
};

/**
 * test if consent module is present, applies, and is valid for cookies (purpose 1 and legitimate interest 10)
 * @param {ConsentData} consentData
 * @returns {boolean}
 */
function hasGDPRConsent(consentData) {
  if (consentData && typeof consentData.gdprApplies === 'boolean' && consentData.gdprApplies) {
    if (!consentData.consentString) {
      return false;
    }
    if (consentData.apiVersion === 1) {
      if (deepAccess(consentData, 'vendorData.purposeConsents.1') === false && deepAccess(consentData, 'vendorData.purposeLegitimateInterests.10') === false) {
        return false;
      }
    }   
    if (consentData.apiVersion === 2) {
       if (deepAccess(consentData, 'vendorData.purpose.consents.1') === false && deepAccess(consentData, 'vendorData.purpose.LegitimateInterests.10') === false) {
         return false;
       }
    }
  }
  return true;
}

/** @type {Submodule} */
export const quantcastIdSubmodule = {
  /**
   * used to link submodule with config
   * @type {string}
   */
  name: 'quantcastId',

  /**
   * decode the stored id value for passing to bid requests
   * @function
   * @returns {{quantcastId: string} | undefined}
   */
  decode(value) {
    return value;
  },

  /**
   * read Quantcast first party cookie and pass it along in quantcastId
   * @function
   * @returns {{id: {quantcastId: string} | undefined}}}
   */
  getId(config, consentData) {
    // Consent signals are currently checked on the server side.
    let fpa = storage.getCookie(QUANTCAST_FPA);

    const configParams = (config && config.params) || {};
    const storageParams = (config && config.storage) || {};

    emailHash = configParams.uh || '';
    cookieExpTime = storageParams.expires || DEFAULT_COOKIE_EXP_TIME;
    globalConsentData = consentData;

    // Callbacks on Event Listeners won't trigger if the event is already complete so this check is required
    if (document.readyState === 'complete') {
      firePixel();
    }
    window.addEventListener('load', firePixel);

    return { id: fpa ? { quantcastId: fpa } : undefined }
  }
};

submodule('userId', quantcastIdSubmodule);
