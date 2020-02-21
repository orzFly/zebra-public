"use strict";
const assert = require("assert");
const Promise = require("navybird");

describe("Promise.prototype.error", function() {
  describe("catches stuff originating from explicit rejections", function() {
    specify("using fromCallback", function() {
      var e = new Promise.TypeError("sup");
      function callsback(a, b, c, fn) {
        fn(e);
      }

      return Promise.fromCallback(function(cb) {
        callsback(1, 2, 3, cb);
      }).error(function(err) {
        assert(err === e);
      });
    });
  });

  describe("does not catch stuff originating from thrown errors", function() {
    specify("using constructor", function() {
      var e = new Error("sup");
      return new Promise(function(resolve, reject) {
        throw e;
      })
        .error(function(err) {
          assert.fail();
        })
        .then(assert.fail, function(err) {
          assert(err === e);
        });
    });

    specify("using thenable", function() {
      var e = new Error("sup");
      var thenable = {
        then: function(resolve, reject) {
          reject(e);
        },
      };
      return Promise.cast(thenable)
        .error(function(err) {
          console.error(err);
          assert.fail();
        })
        .then(assert.fail, function(err) {
          assert(err === e);
        });
    });

    specify("using fromCallback", function() {
      var e = new Error("sup");
      function callsback(a, b, c, fn) {
        throw e;
      }

      return Promise.fromCallback(function(cb) {
        callsback(1, 2, 3, cb);
      })
        .error(function(err) {
          assert.fail();
        })
        .then(assert.fail, function(err) {
          assert(err === e);
        });
    });
  });
});
