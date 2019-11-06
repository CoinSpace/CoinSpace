(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g=g||self,g.moonpay=f());}(this,function(){'use strict';!(function(e) {
  var t = {};
  function n(r) {
    if (t[r]) return t[r].exports;
    var o = (t[r] = { i: r, l: !1, exports: {} });
    return e[r].call(o.exports, o, o.exports, n), (o.l = !0), o.exports;
  }
  (n.m = e),
    (n.c = t),
    (n.d = function(e, t, r) {
      n.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: r });
    }),
    (n.r = function(e) {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(e, '__esModule', { value: !0 });
    }),
    (n.t = function(e, t) {
      if ((1 & t && (e = n(e)), 8 & t)) return e;
      if (4 & t && 'object' == typeof e && e && e.__esModule) return e;
      var r = Object.create(null);
      if (
        (n.r(r),
        Object.defineProperty(r, 'default', { enumerable: !0, value: e }),
        2 & t && 'string' != typeof e)
      )
        for (var o in e)
          n.d(
            r,
            o,
            function(t) {
              return e[t];
            }.bind(null, o),
          );
      return r;
    }),
    (n.n = function(e) {
      var t =
        e && e.__esModule
          ? function() {
              return e.default;
            }
          : function() {
              return e;
            };
      return n.d(t, 'a', t), t;
    }),
    (n.o = function(e, t) {
      return Object.prototype.hasOwnProperty.call(e, t);
    }),
    (n.p = ''),
    n((n.s = 1205));
})({
  0: function(e, t) {
    function n() {
      return (
        (e.exports = n =
          Object.assign ||
          function(e) {
            for (var t = 1; t < arguments.length; t++) {
              var n = arguments[t];
              for (var r in n)
                Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
          }),
        n.apply(this, arguments)
      );
    }
    e.exports = n;
  },
  1: function(e, t) {
    e.exports = function(e, t) {
      if (!(e instanceof t))
        throw new TypeError('Cannot call a class as a function');
    };
  },
  10: function(e, t) {
    function n(t, r) {
      return (
        (e.exports = n =
          Object.setPrototypeOf ||
          function(e, t) {
            return (e.__proto__ = t), e;
          }),
        n(t, r)
      );
    }
    e.exports = n;
  },
  1205: function(e, t, n) {
    n.r(t);
    var r = n(8);
    Object(r.a)({
      tntdehirsr4: 'https://tntdehirsr4.sandbox.verygoodproxy.com',
      tntzdhyyfg9: 'https://tntzdhyyfg9.sandbox.verygoodproxy.com',
      tntajtv6zty: 'https://tntajtv6zty.live.verygoodproxy.com',
    });
  },
  2: function(e, t) {
    function n(e, t) {
      for (var n = 0; n < t.length; n++) {
        var r = t[n];
        (r.enumerable = r.enumerable || !1),
          (r.configurable = !0),
          'value' in r && (r.writable = !0),
          Object.defineProperty(e, r.key, r);
      }
    }
    e.exports = function(e, t, r) {
      return t && n(e.prototype, t), r && n(e, r), e;
    };
  },
  3: function(e, t) {
    function n(e) {
      return (n =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
          ? function(e) {
              return typeof e;
            }
          : function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : typeof e;
            })(e);
    }
    function r(t) {
      return (
        'function' == typeof Symbol && 'symbol' === n(Symbol.iterator)
          ? (e.exports = r = function(e) {
              return n(e);
            })
          : (e.exports = r = function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : n(e);
            }),
        r(t)
      );
    }
    e.exports = r;
  },
  4: function(e, t) {
    e.exports = function(e, t, n) {
      return (
        t in e
          ? Object.defineProperty(e, t, {
              value: n,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (e[t] = n),
        e
      );
    };
  },
  5: function(e, t, n) {
    var r = n(3),
      o = n(9);
    e.exports = function(e, t) {
      return !t || ('object' !== r(t) && 'function' != typeof t) ? o(e) : t;
    };
  },
  6: function(e, t) {
    function n(t) {
      return (
        (e.exports = n = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function(e) {
              return e.__proto__ || Object.getPrototypeOf(e);
            }),
        n(t)
      );
    }
    e.exports = n;
  },
  7: function(e, t, n) {
    var r = n(10);
    e.exports = function(e, t) {
      if ('function' != typeof t && null !== t)
        throw new TypeError(
          'Super expression must either be null or a function',
        );
      (e.prototype = Object.create(t && t.prototype, {
        constructor: { value: e, writable: !0, configurable: !0 },
      })),
        t && r(e, t);
    };
  },
  8: function(e, t, n) {
    var r = n(5),
      o = n.n(r),
      i = n(6),
      s = n.n(i),
      a = n(7),
      u = n.n(a),
      c = n(4),
      l = n.n(c),
      f = n(0),
      d = n.n(f),
      p = n(1),
      m = n.n(p),
      h = n(2),
      y = n.n(h),
      b = n(3),
      v = n.n(b);
    function g() {
      return [
        arguments.length > 0 && void 0 !== arguments[0]
          ? arguments[0]
          : 'randomId',
        new Date().getDate(),
        ''.concat(Math.random()).replace(/[^\w\d]/, ''),
      ].join('');
    }
    function w(e) {
      return ''
        .concat(
          'https://js.verygoodvault.com/vgs-collect/1/lib',
          '/index.html?',
        )
        .concat(
          (function(e) {
            var t = '';
            function n(e, n) {
              t.length > 0 && (t += '&'),
                (t += encodeURIComponent(e) + '=' + encodeURIComponent(n));
            }
            return (
              Object.keys(e)
                .sort()
                .forEach(function(t) {
                  var r = e[t];
                  Array.isArray(r)
                    ? r.forEach(function(e) {
                        return n(t, e);
                      })
                    : n(t, r);
                }),
              t
            );
          })(e),
        );
    }
    var x = [
        'formId',
        'fieldId',
        'successColor',
        'errorColor',
        'lineHeight',
        'fontSize',
        'fontFamily',
        'color',
        'placeholder',
        'name',
        'validations',
        'type',
        'defaultValue',
        'serializers',
        'value',
        'defaultChecked',
        'autoComplete',
        'readOnly',
        'disabled',
        'maxLength',
        'autoFocus',
        'min',
        'max',
        'step',
        'ariaLabel',
        'modules',
      ],
      O = ['options', 'css', 'showCardIcon', 'yearLength'];
    function j(e, t) {
      var n,
        r,
        o,
        i = (function(e) {
          var t,
            n = document.createElement('iframe');
          return (
            n.setAttribute(
              'title',
              ((t = e.type),
              'Secure '.concat(t.split('-').join(' '), ' input frame')),
            ),
            n.setAttribute('src', w(e)),
            n.setAttribute('frameborder', '0'),
            n.setAttribute('scrolling', '0'),
            n.setAttribute('allowtransparency', 'true'),
            n.setAttribute('id', e.fieldId),
            n
          );
        })(
          ((n = t),
          (r = x),
          Object.keys(n)
            .filter(function(e) {
              return r.indexOf(e) >= 0;
            })
            .reduce(function(e, t) {
              return (e[t] = n[t]), e;
            }, {})),
        );
      return (
        ('string' == typeof (o = e) || o instanceof String
          ? document.querySelector(e)
          : e
        ).appendChild(i),
        i
      );
    }
    function I(e, t) {
      function n(n) {
        n.data.messageName === e && t(n.data.payload);
      }
      return window.addEventListener('message', n), n;
    }
    function k(e) {
      return I('fieldReady', e);
    }
    function S(e) {
      for (var t = 0, n = Object.keys(e); t < n.length; t++) {
        var r = n[t];
        console.error(r, e[r].errorMessages);
      }
    }
    n.d(t, 'a', function() {
      return M;
    });
    var _ = (function() {
        function e(t, n, r, o, i, s) {
          var a = this;
          m()(this, e),
            (this.type = i),
            (this.modules = s),
            (this._iframe = t),
            (this.fieldId = n),
            r &&
              k(function(e) {
                e.fieldId == n &&
                  a._postMessage({
                    messageName: 'setProperties',
                    additionalProperties: r,
                  });
              }),
            o &&
              k(function(e) {
                e.fieldId == n &&
                  a._postMessage({
                    messageName: 'setAllowedDomains',
                    allowedDomains: o,
                  });
              });
        }
        return (
          y()(e, [
            {
              key: 'delete',
              value: function() {
                var e = this;
                return (
                  this._postMessage({ messageName: 'delete' }),
                  k(function(t) {
                    t.fieldId == e.fieldId &&
                      e._postMessage({ messageName: 'delete' });
                  }),
                  this
                );
              },
            },
            {
              key: 'mask',
              value: function(e) {
                var t = this,
                  n =
                    arguments.length > 1 && void 0 !== arguments[1]
                      ? arguments[1]
                      : null,
                  r = arguments.length > 2 ? arguments[2] : void 0,
                  o = ['text', 'textarea', 'password', 'zip-code'];
                if (-1 === o.indexOf(this.type))
                  throw new Error(
                    '.mask() available only for the following type of fields: text, textarea, password, zip-code',
                  );
                return (
                  e &&
                    k(function(o) {
                      o.fieldId == t.fieldId &&
                        t._postMessage({
                          messageName: 'setInputMask',
                          mask: { mask: e, maskChar: n, formatChars: r },
                        });
                    }),
                  this
                );
              },
            },
            {
              key: 'replacePattern',
              value: function(e) {
                var t = this,
                  n =
                    arguments.length > 1 && void 0 !== arguments[1]
                      ? arguments[1]
                      : '',
                  r = ['text', 'textarea', 'password', 'zip-code'];
                if (-1 === r.indexOf(this.type))
                  throw new Error(
                    '.replacePattern() available only for the following type of fields: text, textarea, password, zip-code',
                  );
                return (
                  e &&
                    k(function(r) {
                      r.fieldId == t.fieldId &&
                        t._postMessage({
                          messageName: 'setRegExpPattern',
                          replacePattern: { regExpString: e, newSubStr: n },
                        });
                    }),
                  this
                );
              },
            },
            {
              key: 'focus',
              value: function() {
                this._postMessage('focus');
              },
            },
            {
              key: '_postMessage',
              value: function(e) {
                this._iframe.contentWindow.postMessage(e, '*');
              },
            },
          ]),
          e
        );
      })(),
      P = (function() {
        function e(t, n, r, o) {
          var i = this;
          m()(this, e),
            (this.environment = t),
            (this.formId = g()),
            (this.state = {}),
            (this.frames = []),
            (this.encryptParams = {}),
            (this.allowedDomains = r),
            (this.modules = o.join(';') || []),
            (function(e) {
              I('update', e);
            })(function(e) {
              var t, r;
              e.formId == i.formId &&
                ((t = e),
                (r = 'formId'),
                (e = Object.keys(t)
                  .filter(function(e) {
                    return -1 === r.indexOf(e);
                  })
                  .reduce(function(e, n) {
                    return (e[n] = t[n]), e;
                  }, {})).delete
                  ? E.call(i, e)
                  : (i.state = d()({}, i.state, l()({}, e.name, e))),
                n(i.state));
            }),
            (this.SERIALIZERS = {
              replace: function(e, t, n) {
                return {
                  name: 'replace',
                  options: { old: e, new: t, count: n },
                };
              },
              keepWhiteSpace: function() {
                return { name: 'replace', options: { old: ' ', new: ' ' } };
              },
              separate: function() {
                var e =
                  arguments.length > 0 && void 0 !== arguments[0]
                    ? arguments[0]
                    : { monthName: 'month', yearName: 'year' };
                return {
                  name: 'separate',
                  options: { monthName: e.monthName, yearName: e.yearName },
                };
              },
            });
        }
        return (
          y()(e, [
            {
              key: 'field',
              value: function(e, t) {
                t.serializers &&
                  (t.serializers = window.btoa(JSON.stringify(t.serializers)));
                var n,
                  r,
                  o = g(),
                  i = j(
                    e,
                    d()({}, t, {
                      formId: this.formId,
                      fieldId: o,
                      modules: this.modules,
                    }),
                  ),
                  s =
                    ((n = t),
                    (r = O),
                    Object.keys(n)
                      .filter(function(e) {
                        return r.indexOf(e) >= 0;
                      })
                      .reduce(function(e, t) {
                        return (e[t] = n[t]), e;
                      }, {}));
                if (
                  (s.css && (s.css = [s.css]),
                  s.showCardIcon && (s.showCardIcon = [s.showCardIcon]),
                  s.yearLength && !/^(2|4)/.test(s.yearLength))
                )
                  throw new Error('"yearLength" available values: 2 or 4');
                return (
                  (this._baseField = i),
                  this.frames.push(i),
                  new _(i, o, s, this.allowedDomains, t.type)
                );
              },
            },
            {
              key: 'submit',
              value: function(e, t, n, r) {
                var o,
                  i = d()({}, t, { url: this.getUrl(e) });
                null == (o = this.encryptParams) ||
                  ('object' === v()(o) && 0 === Object.keys(o).length) ||
                  ('string' == typeof o && 0 === o.trim().length) ||
                  (i.encrypt = this.encryptParams);
                for (
                  var s = {}, a = 0, u = Object.keys(this.state);
                  a < u.length;
                  a++
                ) {
                  var c = u[a];
                  this.state[c].errorMessages.length > 0 &&
                    (s[c] = this.state[c]);
                }
                var l = r || S;
                if (!(Object.keys(s).length > 0))
                  return (
                    (function(e, t, n) {
                      if (!e) throw new Error('No secure field was found');
                      var r = g('submitCallback'),
                        o = I(r, function(e) {
                          window.removeEventListener('message', o), n(e);
                        });
                      !(function(e, t, n) {
                        e.contentWindow.postMessage(
                          { messageName: t, payload: n },
                          'https://js.verygoodvault.com/vgs-collect/1',
                        );
                      })(e, 'submit', d()({}, t, { callbackId: r }));
                    })(this._baseField, i, function(e) {
                      var t = e.status,
                        r = e.data;
                      n(t, r);
                    }),
                    this
                  );
                l(s);
              },
            },
            {
              key: 'encrypt',
              value: function(e) {
                return (this.encryptParams = e), this;
              },
            },
          ]),
          e
        );
      })();
    function E(e) {
      (this.frames = this.frames.filter(function(t) {
        return t.id !== e.fieldId;
      })),
        0 === this.frames.length
          ? (this._baseField = !1)
          : this._baseField.id === e.fieldId &&
            (this._baseField = this.frames[0]);
      var t = document.getElementById(e.fieldId);
      t.parentNode.removeChild(t), delete this.state[e.name];
    }
    function M(e, t) {
      window.VGSCollect = window.SecureForm = window.VgForm = {
        modules: [],
        load: function(e) {
          return (this.modules = d()(this.modules, e)), this;
        },
        create: function(n, r) {
          if (-1 === Object.keys(e).indexOf(n))
            throw "Environment '" +
              n +
              "' does not exist. Valid choices are: " +
              Object.keys(e).join(', ');
          return new ((function(t) {
            function n() {
              return m()(this, n), o()(this, s()(n).apply(this, arguments));
            }
            return (
              u()(n, t),
              y()(n, [
                {
                  key: 'getUrl',
                  value: function(t) {
                    var n = e[this.environment];
                    return ''.concat(n).concat(t);
                  },
                },
              ]),
              n
            );
          })(P))(n, r, t, this.modules);
        },
      };
    }
  },
  9: function(e, t) {
    e.exports = function(e) {
      if (void 0 === e)
        throw new ReferenceError(
          "this hasn't been initialised - super() hasn't been called",
        );
      return e;
    };
  },
});var generateUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
var attachSiftSDKToBody = function () {
    var e = document.createElement('script');
    e.src = 'https://cdn.sift.com/s.js';
    document.body.appendChild(e);
};
var MoonPay = /** @class */ (function () {
    function MoonPay() {
    }
    MoonPay.initialize = function (apiKey, customerId) {
        if (customerId === void 0) { customerId = ''; }
        if (!apiKey.includes('pk')) {
            throw new Error('Invalid MoonPay API key');
        }
        this.apiKey = apiKey;
        this.customerId = customerId;
        this.liveMode = apiKey.includes('live');
        this.sessionId = generateUUID();
        // eslint-disable-next-line
        var sift = (window._sift = window._sift || []);
        sift.push(['_setAccount', this.liveMode ? '5e05348ef6' : 'e8d599c391']);
        sift.push(['_setUserId', this.customerId]);
        sift.push(['_setSessionId', this.sessionId]);
        if (document.readyState === 'complete') {
            attachSiftSDKToBody();
        }
        else {
            window.addEventListener('load', attachSiftSDKToBody, false);
        }
    };
    MoonPay.setCustomerId = function (customerId) {
        this.customerId = customerId;
        // eslint-disable-next-line no-underscore-dangle
        if (window._sift) {
            // eslint-disable-next-line no-underscore-dangle
            window._sift.push(['_setUserId', this.customerId]);
        }
    };
    MoonPay.trackPageView = function () {
        // eslint-disable-next-line no-underscore-dangle
        if (window._sift) {
            // eslint-disable-next-line no-underscore-dangle
            window._sift.push(['_trackPageview']);
        }
    };
    MoonPay.createCardDetailsForm = function (formCallback) {
        var form = window.VGSCollect.create(this.liveMode ? 'tntajtv6zty' : 'tntzdhyyfg9', formCallback);
        var oldSubmit = form.submit.bind(form);
        form.createField = form.field;
        form.field = undefined;
        form.submit = function submit(billingAddress, callback, errorCallback) {
            oldSubmit("/v3/tokens?apiKey=" + this.apiKey, {
                data: {
                    billingAddress: billingAddress,
                },
            }, callback, errorCallback);
        };
        form.submit = form.submit.bind(this);
        return form;
    };
    return MoonPay;
}());return MoonPay;}));
