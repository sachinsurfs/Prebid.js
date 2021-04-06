/**
 * This module adds QuantcastID to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/quantcastIdSystem
 * @requires module:modules/userId
 */

import {submodule} from '../src/hook.js'
import { getStorageManager } from '../src/storageManager.js';
import { findRootDomain } from './userId/index.js';
import * as utils from '../../src/utils.js';

const QUANTCAST_FPA = '__qca';
const COOKIE_EXP_TIME = 33868800000; // (13 months - 2 days), in milliseconds
const PREBID_PCODE = 'p-prebid'; // Not associated with a real account
const DOMAIN_QSERVE = "https://pixel.quantserve.com/pixel";

var QCConsentData = null;

export const storage = getStorageManager();

function firePixel() {
  // check for presence of Quantcast Measure tag _qevent obj
  if(!window._qevents) {

    let fpa = storage.getCookie(QUANTCAST_FPA);
    let fpan = "0";
    var now = new Date();
    var domain = findRootDomain();
    var et = now.getTime();
    var tzo = now.getTimezoneOffset();
    var sr = "";
    var screen = window.screen;

    if (screen) {
      sr = screen.width + 'x' + screen.height + 'x' + screen.colorDepth;
    }

    if(!fpa) {
      var expires = new Date(now.getTime() + COOKIE_EXP_TIME).toGMTString();
      fpa = 'B0-' + Math.round(Math.random() * 2147483647) + '-' + et;
      fpan = "1";
      storage.setCookie(QUANTCAST_FPA, fpa, expires, '/', domain, null);
    }

    if(hasGDPRConsent) {

      //check for consent
      var pixel = new Image();
      pixel.src = DOMAIN_QSERVE +
      "&fpan=" + fpan      +
      "&fpa="  + fpa       +
      "&d="    + domain    +
      "&et="   + et        +
      "&sr="   + sr        +
      "&tzo="  + tzo       +
      "&a="  + PREBID_PCODE;

      pixel.onload = function() {
        pixel = void (0);
      }; 
    }
  } 
};

/**
 * test if consent module is present, applies, and is valid for local storage or cookies (purpose 1)
 * @param {ConsentData} consentData
 * @returns {boolean}
 */
function hasGDPRConsent(consentData) {
  if (consentData && typeof consentData.gdprApplies === 'boolean' && consentData.gdprApplies) {
    if (!consentData.consentString) {
      return false;
    }
    // quantJs needs Purpose 1, 2, 3, 7, 8, 9 and 10
    if (consentData.apiVersion === 1 && utils.deepAccess(consentData, 'vendorData.purposeConsents.1') === false) {
      return false;
    }
    if (consentData.apiVersion === 2 && utils.deepAccess(consentData, 'vendorData.purpose.consents.1') === false) {
      return false;
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
  getId(_config, consentData) {

    // Consent signals are currently checked on the server side.
    let fpa = storage.getCookie(QUANTCAST_FPA);
    
    // Having a global variable is probably a bad idea. Placeholder for a better solution
    QCConsentData = consentData;

    // Callbacks on Event Listeners won't trigger if the event is already complete so this check is required 
    if (document.readyState === "complete") {
      firePixel();
    } 
    window.onload = firePixel;

    return { id: fpa ? { quantcastId: fpa } : undefined }
  }
};

submodule('userId', quantcastIdSubmodule);
