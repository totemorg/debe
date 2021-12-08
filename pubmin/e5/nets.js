"use strict";

function nets(ctx, res, _ref) {
  var $log = _ref.$log,
      $trace = _ref.$trace,
      $pipe = _ref.$pipe;
  // define notebook engine
  var Snap = {
    aNet: {
      nodes: {},
      edges: {}
    },
    cNet: {
      nodes: {},
      edges: {}
    },
    actors: 0,
    bhats: 0,
    whats: 0
  },
      black = "black",
      white = "white",
      now = new Date(),
      aNet = Snap.aNet,
      cNet = Snap.cNet,
      nodes = aNet.nodes,
      edges = aNet.edges;
  var actors = Snap.actors,
      bhats = Snap.bhats,
      whats = Snap.whats;
  $log(">>>nets actors", actors);
  $pipe(function (recs) {
    if (recs) {
      // have a batch so extend assoc net
      $log(">>>nets records", recs.length, actors);
      recs.forEach(function (rec) {
        // make black-white hat assoc net
        var bhat = rec.bhat,
            what = rec.what,
            topic = rec.topic,
            cap = rec.cap;

        if (bhat && what && topic) {
          var src = nodes[bhat] || (nodes[bhat] = {
            type: black,
            index: actors++,
            hat: black + bhats++,
            created: now,
            size: 0
          }),
              tar = nodes[what] || (nodes[what] = {
            type: white,
            index: actors++,
            hat: white + whats++,
            created: now,
            size: 0
          }),
              link = bhat + ":" + what,
              edge = edges[link] || (edges[link] = {
            src: bhat,
            tar: what,
            capacity: 1,
            type: topic,
            created: now
          }); //$log(edge);
        }
      });
      Snap.actors = actors;
      Snap.bhats = bhats;
      Snap.whats = whats;
    } else {
      // no more batches so make connection net
      $log(">>>nets capacity matrix NxN", [actors, actors]);

      if (actors <= 400) {
        var N = actors,
            map = $(N),
            cap = $([N, N], function (u, v, C) {
          return C[u][v] = 0;
        }),
            lambda = $([N, N], function (u, v, L) {
          return L[u][v] = 0;
        }),
            cuts = {};
        $each(nodes, function (name, node) {
          return map[node.index] = name;
        });
        $each(edges, function (link, edge) {
          //$log(link,edge,N);
          var src = edge.src,
              tar = edge.tar,
              capacity = edge.capacity;
          cap[nodes[src].index][nodes[tar].index] = capacity;
        });

        for (var s = 0; s < N; s++) {
          // if ( nodes[map[s]].type == black ) 
          for (var t = s + 1; t < N; t++) // if( nodes[map[t]].type == black ) 
          {
            // get maxflows-mincuts between source(s)-sink(t) nodes
            var _$$MaxFlowMinCut = $.MaxFlowMinCut(cap, s, t),
                maxflow = _$$MaxFlowMinCut.maxflow,
                cutset = _$$MaxFlowMinCut.cutset,
                mincut = _$$MaxFlowMinCut.mincut,
                cutsize = lambda[s][t] = lambda[t][s] = cutset.length,
                cut = cuts[cutsize] || (cuts[cutsize] = []);

            if (cutsize) cut.push({
              s: s,
              t: t,
              maxflow: maxflow,
              mincut: mincut,
              cutset: cutset
            });
          }
        }

        var cNodes = cNet.nodes = {},
            cEdges = cNet.edges = {},
            src = cNodes["ref"] = {
          type: "connection",
          index: 0,
          name: "ref",
          created: now
        };
        $each(cuts, function (cutsize, cut) {
          // create connection net
          if (cutsize != "0") {
            $log(">>>nets cut", cutsize);
            cut.forEach(function (lam, idx) {
              var s = lam.s,
                  t = lam.t,
                  maxflow = lam.maxflow,
                  snode = nodes[map[s]],
                  tnode = nodes[map[t]],
                  node = snode.index + ":" + tnode.index,
                  tar = cNodes[node] = {
                type: "connection",
                index: idx,
                created: now
              },
                  edge = cEdges[node] || (cEdges[node] = {
                src: "ref",
                tar: node,
                type: "lambda" + cutsize,
                name: map[s] + ":" + map[t],
                maxflow: maxflow,
                cutsize: cutsize
              });
              $log(">>>nets", cutsize, s, t);
            });
          }
        });
        $log(">>>nets save NxE", [Object.keys(nodes).length, Object.keys(edges).length]);
        ctx._net = [{
          name: "anet",
          nodes: nodes,
          edges: edges
        }, {
          name: "cnet",
          nodes: cNodes,
          edges: cEdges
        }];
      } else $log(">>>nets TOO BIG to make connections !");

      res(ctx);
    }
  });
}