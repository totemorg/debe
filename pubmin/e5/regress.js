"use strict";

function regress(ctx, res, _ref) {
  var $log = _ref.$log,
      $trace = _ref.$trace,
      $pipe = _ref.$pipe,
      $sql = _ref.$sql;
  // define notebook engine
  // extact context keys and setup regressors and optional boosting 
  var Method = ctx.Method,
      Host = ctx.Host,
      Name = ctx.Name,
      Hyper = ctx.Hyper,
      Cycle = ctx.Cycle,
      _Boost = ctx._Boost; //$log(Method,Host,Name);

  var save = ctx.Save = [],
      use = Method.toLowerCase(),
      hyper = Hyper || {},
      solve = hyper[use] || {};
  $pipe(function (batch) {
    if (batch) {
      var jpgSave, chans, done;
      var chan;

      (function () {
        var _ref2 = batch.forEach ? batch.get("x&y") : batch,
            multi = _ref2.multi,
            x = _ref2.x,
            y = _ref2.y,
            x0 = _ref2.x0,
            y0 = _ref2.y0,
            sum = {
          boosting: Cycle ? _Boost : false,
          solve: solve,
          trainSet: x ? x.length : "none",
          labelSet: y ? y.length : "none",
          using: use,
          predictSet: x0 ? x0.length : "none",
          mode: x && y ? "semi-supervised learning" : x ? "unsupervised learning" : chans ? "multichan learning" : x0 ? "predicting" : "unknown" //loader: loader ? true : false,
          //model: model ? true : false

        };

        $log(sum);

        if (multi) {
          // multichannel learning mode			
          var _x = multi.x,
              _y = multi.y,
              _x2 = multi.x0,
              _y2 = multi.y0;
          jpgSave = [];
          chans = _x.length;
          done = 0; //$log("channels", chans, y.length, x0.length);

          if (chans) for (chan = 0; chan < chans; chan++) {
            $.train(use, _x[chan], _y[chan], _x2[chan], _y2 ? _y2[chan] : null, function (info) {
              $log("multi mcat", done, chans);
              save.push({
                at: "train",
                chan: chan,
                x: info.x0,
                y: info.y0
              });
              save.push({
                at: use,
                chan: chan,
                cls: info.cls["export"] ? info.cls["export"]() : info.cls
              });
              jpgSave.push(info.y0);

              if (++done == chans) {
                /*save.push({ 
                	at: "jpg", 
                	input: multi.input, 
                	save: jpgPath,
                	//index: n0,
                	index: multi.n0,
                	values: jpgSave
                }); */
                ctx.Save_jpg = {
                  input: multi.input,
                  //save: jpgPath,
                  //index: n0,
                  index: multi.n0,
                  values: jpgSave
                };
                res(ctx);
              }
            });
          } else res(ctx);
        } else if (Cycle) {
          // in hypo boosting mode
          res("boosting");
          $sql(function (sql) {
            // get a sql thread
            function booster(sql, boost) {
              // boost the hypo
              var alpha = boost.alpha,
                  h = boost.h,
                  xroc = boost.xroc,
                  weis = boost.weis,
                  mixes = solve.mixes,
                  nsigma = solve.nsigma,
                  samples = solve.samples,
                  sign = Math.sign;
              if (mixes) $.boost(Cycle, sql, boost, $trace, function (x, keys) {
                // boost with provided hypo manager

                /*
                	return tested hypo if keys specified
                	return learned hypo keys if x specified
                	save hypo keys to boost stash if neither specified
                */
                function hypo(x, keys) {
                  // return hypo[k] = +/-1 if x inside/outside nsigma sphere with keys[k]
                  return $(keys.length, function (k, H) {
                    // enumerate thru all keys
                    H[k] = 0; // default if invalid key

                    if (key = keys[k]) {
                      // key valid so ...
                      var _$ = $("y = B*x + b; r = sqrt( y' * y ); ", {
                        B: key.B,
                        b: key.b,
                        x: x
                      }),
                          r = _$.r; // bring sample into decision sphere


                      H[k] = r < nsigma ? +1 : -1; // test positive/negative hypo 
                    }
                  });
                }

                if (keys) $trace(JSON.stringify({
                  mode: "test",
                  t: Cycle,
                  keys: keys.length,
                  nsigma: nsigma
                }));else if (x) $trace(JSON.stringify({
                  mode: "learn",
                  t: Cycle,
                  points: x.length
                }));else $trace(JSON.stringify({
                  mode: "save",
                  t: Cycle,
                  alpha: boost.alpha
                }));
                if (keys) // test hypo using keys
                  return hypo(x, keys);else if (x) {
                  // learn hypo keys
                  var keys = h[Cycle] = []; // reserve key stash

                  $.train(use, x, null, solve, function (info) {
                    var em = info.cls.em;
                    em.forEach(function (mix) {
                      //$log("mix", mix.key);
                      if (key = mix.key) // valid key provided
                        keys.push({
                          B: $.clone(key.B),
                          b: $.clone(key.b)
                        });else // invalid key
                        keys.push(null);
                    });

                    if (weis && y) {
                      // stash weishart matrix for this boost
                      var Y = y._data || y,
                          ctx = weis[Cycle] = {
                        w: $([mixes, mixes], function (i, j, w) {
                          return w[i][j] = 0;
                        }),
                        n: 0
                      };
                      Y.forEach(function (y, n) {
                        if (mix = em[y]) {
                          // have labelled x so update weishart
                          ctx.x = x[n];
                          ctx.mu = mix.mu;
                          $("w = w + (x-mu)*(x-mu)'; n=n+1; ", ctx);
                        }
                      });
                      /*
                      at some cylce, instead of running $.traun, regress the w[i] 
                      against the n[i], i=1:cycle to get an improved sigma covar.  
                      Use this improved sigma in the pca to get new keys and 
                      store in current cycle slot
                      */
                    }
                  });
                  return keys;
                } else {
                  // save boosted roc
                  if (xroc) {
                    // generate effective roc
                    var F = $(mixes, function (k, F) {
                      return F[k] = 0;
                    }),
                        // reserve for boosted hypo
                    t = Cycle,
                        hits = 0,
                        cols = 0,
                        N = xroc.length,
                        maxHits = N,
                        maxCols = N * mixes;
                    xroc.forEach(function (x, m) {
                      // enumerate x samples to build roc
                      for (var n = 1; n <= t; n++) {
                        if (h_n = h[n]) // valid keys provided
                          var ctx = $("F = F + alpha * H", {
                            F: F,
                            alpha: alpha[n],
                            H: hypo(x, h_n)
                          });else var ctx = null;
                      } //$log("F=", ctx.F);


                      if (ctx) F.$(function (k) {
                        return F[k] = sign(ctx.F[k]);
                      });
                      var I = 0; // indicator = #agreements

                      F.$(function (k) {
                        return I += F[k] > 0 ? 1 : 0;
                      }); //$log(m, F, I);

                      if (I == 1) hits++;else if (I > 1) cols += I - 1;
                    });
                    boost.hitRate = hits / maxHits;
                    boost.colRate = cols / maxCols;
                    $log(">>>>>rates", boost.hitRate, boost.colRate, [hits, cols], [maxHits, maxCols]);
                  }

                  sql.query("UPDATE app.regress SET ? WHERE ?", [{
                    _Boost: JSON.stringify(boost),
                    Cycle: Cycle + 1 //Pipe: JSON.stringify( ( Cycle == 1 ) ? "#" + ctx.Pipe : ctx.Pipe )

                  }, {
                    Name: ctx.Name
                  }], function (err) {
                    return $log(err);
                  });
                  return null;
                }
              });
            }

            if (x && y) {
              // prime the boost dataset then boost at Cycle=1
              var N = x.length,
                  D = 1 / N,
                  added = 0; // "/genpr_test4D4M.export?[x,y]=$.get(['x','n'])"
              // "/genpr_test4D4M.export?[x,y]=$.get(['x','n'])&x0=$.draw(Channels).get('x')"

              sql.query("DELETE FROM app.points");
              sql.beginBulk();
              x.forEach(function (x, n) {
                // prime points dataset with samples and labels
                sql.query("INSERT INTO app.points SET ?", {
                  // prime with this sample point
                  x: JSON.stringify(x),
                  y: y[n],
                  D: D,
                  idx: n + 1,
                  docID: "doc" + n,
                  srcID: 0
                }, function (err) {
                  // check if primed
                  if (++added == N) // dataset primed so good to boost
                    booster(sql, {
                      // provide initial boost state (index 0 unused)
                      xroc: x0,
                      // points to gen roc
                      // points: N,	// number of x0 points
                      samples: samples,
                      // number of samples in points db
                      mixes: solve.mixes || 0,
                      // numer of mixes to boost
                      //labels: labels,
                      thresh: D * 0.9,
                      // boosting threshold
                      weis: [null],
                      // weishart stash for covar boost
                      eps: [null],
                      // boost stash for errors
                      alpha: [null],
                      // boost stash for confidense levels
                      h: [null] // boost stash for hypo keys

                    });
                });
              });
              sql.endBulk();
            } else if (_Boost) // boost this Cycle
              booster(sql, _Boost);else $trace("boost halted - no x,y data provided to prime");
          });
        } else if (x) //  in sup/unsup learning mode
          $.train(use, x, y, solve, function (info) {
            if (info) {
              info.cls.sum = sum;
              save.push({
                at: use,
                cls: info.cls["export"] ? info.cls["export"]() : info.cls
              });
              res(ctx);
            } else res(null);
          });else if (x0) // in predicting mode
          $sql(function (sql) {
            sql.query("SELECT Save_".concat(use, " as Model FROM app.regress WHERE ?"), {
              Name: Name
            }, function (err, recs) {
              // get cls model save during previous training
              if (rec = recs[0]) {
                solve.model = rec.Model;
                $.predict(use, x0, y0, solve, function (ctx) {
                  ctx.Save = [{
                    at: "predict",
                    y: y0
                  }];
                  res(ctx);
                });
              }
            });
          });else {
          // in adhoc supervised learning mode
          $trace("invalid pipe parameters");
          res(null);
        }
      })();
    } else {//done
    }
  });
}
