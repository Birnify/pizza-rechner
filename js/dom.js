/* dom.js — kleiner DOM-Helfer, gemeinsamer PZ-Namespace */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  // $('id') -> document.getElementById('id')
  PZ.$ = id => document.getElementById(id);
})(window);
