function trigs(ctx, res) {  
		// const { sqrt, floor, random, cos, sin, abs, PI, log, exp} = Math;
		
		var
			stats = ctx.Stats,
			file = ctx.File,
			flow = ctx.Flow;
		
		Log("trigs ctx evs", ctx.Events);
		
		if (stats.coherence_time)
			ctx.Events.$( "t", evs => {  // fetch all events
				if (evs)
					$.triggerProfile({  // define solver parms
						evs: evs,		// events
						refLambda: stats.mean_intensity, // ref mean arrival rate (for debugging)
						alpha: file.Stats_Gain, // assumed detector gain
						N: ctx.Dim, 		// samples in profile = max coherence intervals
						model: ctx.Model,  	// name correlation model
						Tc: stats.coherence_time,  // coherence time of arrival process
						T: flow.T  		// observation time
					}, stats => {
						ctx.Save = stats;
						res(ctx);
					});
			});
		
		else
			res(null);
	}