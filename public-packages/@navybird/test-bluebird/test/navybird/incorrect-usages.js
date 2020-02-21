"use strict";
const assert = require("assert");
const Promise = require("navybird");

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Not_a_constructor
describe("new Promise.resolve", function () {
  specify("should work", function () {
    assert((Promise.resolve("sup")) instanceof Promise);
    assert((new Promise.resolve("sup")) instanceof Promise);
  });

});
