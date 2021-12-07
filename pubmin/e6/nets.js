function nets(ctx,res,{$log,$trace,$pipe}) {	// define notebook engine

		const 
			Snap = {
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
			[ black, white ] = ["black", "white"],
			now = new Date(),
			{ aNet, cNet } = Snap,
			{ nodes,edges } = aNet;

		var
			{ actors,bhats,whats } = Snap;

		$log(">>>nets actors", actors);

		$pipe( recs => {
			if ( recs ) {	// have a batch so extend assoc net
				$log(">>>nets records", recs.length, actors );

				recs.forEach( rec => {	// make black-white hat assoc net
					const 
						{bhat,what,topic,cap} = rec;

					if (bhat && what && topic ) {
						const
							src = nodes[bhat] || ( nodes[bhat] = {
								type: black,
								index: actors++,
								hat: black+(bhats++),
								created: now,
								size: 0
							}),
							tar = nodes[what] || ( nodes[what] = {
								type: white,
								index: actors++,
								hat: white+(whats++),
								created: now,
								size: 0
							}),
							link = bhat + ":" + what,
							edge = edges[link] || ( edges[link] = {
								src: bhat,
								tar: what,
								capacity: 1,
								type: topic,
								created: now
							});

						//$log(edge);
					}

				});

				Snap.actors = actors;
				Snap.bhats = bhats;
				Snap.whats = whats;
			}

			else {	// no more batches so make connection net
				$log(">>>nets capacity matrix NxN", [actors,actors]);

				if ( actors<=400 ) {
					const 
						N = actors,	
						map = $(N),
						cap = $([N,N], (u,v,C) => C[u][v] = 0 ),
						lambda = $([N,N], (u,v,L) => L[u][v] = 0 ),
						cuts = {};

					$each( nodes, (name,node) => map[node.index] = name );

					$each( edges, (link,edge) => {
						//$log(link,edge,N);
						const {src,tar,capacity} = edge;
						cap[ nodes[src].index ][ nodes[tar].index ] = capacity;
					});

					for (var s=0; s<N; s++) // if ( nodes[map[s]].type == black ) 
						for (var t=s+1; t<N; t++) // if( nodes[map[t]].type == black ) 
						{	// get maxflows-mincuts between source(s)-sink(t) nodes

							const 
								{maxflow,cutset,mincut} = $.MaxFlowMinCut(cap,s,t),
								cutsize = lambda[s][t] = lambda[t][s] = cutset.length,
								cut = cuts[cutsize] || (cuts[cutsize] = []);

							if ( cutsize )
								cut.push({
									s: s,
									t: t,
									maxflow: maxflow,
									mincut: mincut,
									cutset: cutset
								});
						}

					const
						cNodes = cNet.nodes = {},
						cEdges = cNet.edges = {},
						src = cNodes["ref"] = {
							type: "connection",
							index: 0,
							name: "ref",
							created: now
						};

					$each(cuts, (cutsize,cut) => {	// create connection net
						if ( cutsize != "0" ) {
							$log(">>>nets cut", cutsize );

							cut.forEach( (lam,idx) => {
								const 
									{s,t,maxflow} = lam,
									snode = nodes[map[s]],
									tnode = nodes[map[t]],
									node = snode.index + ":" + tnode.index,
									tar = cNodes[node] = {
										type: "connection",
										index: idx,
										created: now
									},
									edge = cEdges[node] || ( cEdges[node] = {
										src: "ref",
										tar: node,
										type: "lambda"+cutsize,
										name: map[s] + ":" + map[t],
										maxflow: maxflow,
										cutsize: cutsize
									});

								$log(">>>nets", cutsize, s,t);
							});
						}
					});

					$log(">>>nets save NxE", [Object.keys(nodes).length,Object.keys(edges).length]);

					ctx._net = [{
						name: "anet",
						nodes: nodes,
						edges: edges
					}, {
						name: "cnet",
						nodes: cNodes,
						edges: cEdges
					}] ;
				}

				else
					$log(">>>nets TOO BIG to make connections !");
				
				res(ctx);		
			}
			
		});
	}