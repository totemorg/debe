// UNCLASSIFIED 

/**
Define DEBE watchdogs:

	sql => {  // watchdog
		const { ... } = site;  	// pull required site info
		// do your thing
	}

This module 
documented in accordance with [jsdoc]{@link https://jsdoc.app/}.

@module WATCHDOGS
@requires [enums](https://github.com/totemorg/enums)
*/
const
	{Copy,Each,Fetch,Log,Start} = require("./enums");

const
	DOGS = module.exports = {	// watchdogs
		config: opts => {
			if (opts) Copy(opts,DOGS,".");
			return DOGS;
		},

		sessions: sql => {
			// https://www.iplocate.io/api/lookup/8.8.8.8
			var
				updates = 0;

			sql.query( "SELECT IPsession AS ip FROM openv.sessions WHERE length(IPsession)" )
			.on("result", rec => {
				const
					ipPre = "::ffff:",
					ipAddr = rec.ip.replace(ipPre, ""),
					ipSrv = `https://www.iplocate.io/api/lookup/${ipAddr}`;

				//Log(ipSrv);
				Fetch( ipSrv, rtn => {
					const 
						rec = rtn.parseJSON( {} );

					sql.query("UPDATE openv.sessions SET ? WHERE ?", [{
						Country: rec.country,
						State: rec.subdivision,
						City: rec.city,
						Lat: rec.latitude,
						Lon: rec.longitude,
						TimeZone: rec.time_zone,
						PostalCode: rec.postal_code,
						ISP: rec.org,
						ASN: rec.asn
					}, {
						IPsession: ipPre+rec.ip
					}], (err,info) => Log(`dog.sessions ${rec.ip}`, updates += err ? 0 : info.affectedRows) );
				});
			});
		},

		/**
		Repository watchdog
		*/
		repos: sql => {
			const 
				{pocs} = site;

			"debe,totem".split(",").forEach( repo => {
				exec( `cd ./${repo}; git pull agent master`, (err,log) => Log("GITPULL", err||"ok") );
			});

			sendMail({
				to: pocs.admin,
				subject: "Patched Totem",
				body: "And that's that!"
			});
		},

		/**
		Daily watchdog to distribute email updates
		*/
		daily: sql => {
			const 
				{pocs,urls} = site;

			sendMail({
				to: pocs.super,
				subject: "TELEWORK",
				body: `Please see update at ${paths.low.notices}bdj_Telework_Daily.xlsm`
			});
		},

		/**
		Weekly watchdog to distribute email updates
		*/
		weekly: sql => {
			const 
				{pocs,urls} = site;

			sendMail({
				to: pocs.super,
				subject: "WEEKLY",
				body: `Please see update at ${paths.low.notices}WeeklyReports.xlsx`
			});
		},

		/**
		System health and utilization watchdog
		*/
		system: sql => {
			function db(cb) {
				sql.query(get.sqlutil, {}, (err, stats) => {
					Log("dog sys db ", err);
					cb( err 
						 ? {
							running: 0,
							connected: 0
						}
						: {
							running: stats[2].Value,
							connected: stats[1].Value
						});
				});
			}

			function cpu(cb) {				// compute average cpu utilization
				var avgUtil = 0;
				var cpus = OS.cpus();

				cpus.forEach( cpu => {
					idle = cpu.times.idle;
					busy = cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.user;
					avgUtil += busy / (busy + idle);
				});
				cb(avgUtil / cpus.length);
			}

			function disk(cb) {
				sql.query(get.diskutil, {}, (err, stats) => {						
					var totGB = 0;
					if ( err ) // sometimes get raised. why ?
						Log("Dog disk util", err);

					else
						stats.forEach( stat => {
							totGB += stat.GB;
						});

					cb( totGB );
				});
			}

			function jobs(cb) {
				sql.query(get.jobs, (err, jobs) => {
					cb({
						total: jobs.length
					});
				});
			}

			const {pocs} = site;

			var 
				max = {
					cpu: 0.8,
					disk: 200
				},
				get = {
					sqlutil: "show session status like 'Thread%'",
					diskutil: "SELECT table_schema AS DB, "
						 + "SUM(data_length + index_length) / 1024 / 1024 / 1024 AS GB FROM information_schema.TABLES "
						 + "GROUP BY table_schema",

					jobs: "SELECT count(ID) AS Total FROM openv.queues "
				};

			db( threads => {
			cpu( cpu => {
			disk( disk => {
			jobs( jobs => {

				sql.query("INSERT INTO openv.syslogs SET ?", {
					t: new Date(),		 					// start time
					Action: "watch", 				// db action
					runningThreads: threads.running,
					connectedThreads: threads.connected,
					cpuUtil: cpu,
					diskUtil: disk,
					Module: "D>",
					totalJobs: jobs.total
				});

				if ( cpu > max.cpu )
					sendMail({
						subject: `${site.nick} resource warning`,
						to: pocs.admin,
						body: `Please add more VMs to ${site.nick} or ` + "shed load".link(site.worker+"/queues.view")
					});

				if ( disk > max.disk ) 
					sendMail({
						subject: `${dog.site.nick} resource warning`,
						to: pocs.admin,
						body: `Please add more disk space to ${dog.site.nick} or ` + "shed load".link(dog.site.worker+"/queues.view")
					});
			});
			});
			});
			});
		},

		/**
		Detector training stats watchdog
		*/
		detectors: sql => {
			const {pocs} = site;

			var 
				get = {
					lowsnr: 
						"SELECT count(events.ID) AS Rejects, events.voxelID AS voxelID, events.fileID AS fileID FROM openv.events"
						+ " LEFT JOIN openv.voxels ON voxels.ID = events.voxelID AND voxels.enabled"
						+ " LEFT JOIN openv.bricks ON files.ID = events.fileID"
						+ " WHERE files.snr < voxels.minsnr"
						+ " GROUP BY events.voxelID, events.fileID"
				};

			if (get.lowsnr)
				sql.forEach( "", get.lowsnr, [], prune => {
					Log("PRUNE", [prune.fileID, prune.voxelID]);

					sql.query(
						"UPDATE openv.bricks SET Rejects=Rejects+?,Relevance=1-Rejects/Samples WHERE ?", 
						[ prune.Rejects, {ID: prune.fileID} ] 
					);

					sql.query(
						"DELETE FROM openv.events WHERE least(?)", 
						{fileID: prune.fileID, voxelID: prune.voxelID}
					);

					/*sql.forAll("", get.lowsnr, [ file.snr, {"events.fileID": file.ID} ], function (evs) {
						//Log("dog rejected", evs.length);
						sql.query(
							"UPDATE openv.bricks SET Rejects=Rejects+?,Relevance=1-Rejects/Samples WHERE ?", 
							[ evs.length, {ID: file.ID} ] 
						);

						evs.each( function (n,ev) {
							sql.query("DELETE FROM openv.events WHERE ?", {ID: ev.ID});
						}); 
					}); */
				});

		},

		/**
		Data brick ingesting watchdog
		*/
		bricks: sql => {

			function pretty(stats,sigfig) {
				var rtn = [];
				Each(stats, function (key,stat) {
					rtn.push( (stat||0).toFixed(sigfig) + " " + key );
				});
				return rtn.join(", ");
			}

			const {urls,pocs} = site;

			var 
				get = {
					ungraded: "SELECT ID,Name FROM openv.bricks WHERE _State_graded IS null AND _Ingest_Time>PoP_End AND Enabled",
					toingest: "SELECT ID,Ring, st_centroid(ring) as Anchor, _Ingest_Time,PoP_advanceDays,PoP_durationDays,_Ingest_sampleTime,Name FROM openv.bricks WHERE _Ingest_Time>=PoP_Start AND _Ingest_Time<=PoP_End AND Enabled AND position('.ingest' IN Name)",
					//finished: "SELECT ID,Name FROM openv.bricks WHERE _Ingest_Time>PoP_End",
					expired: "SELECT ID,Name FROM openv.bricks WHERE PoP_Expires AND now() > PoP_Expires AND Enabled"
					//retired: "SELECT files.ID,files.Name,files.Client,count(events.id) AS evCount FROM openv.events LEFT JOIN openv.bricks ON events.fileID = files.id "
							//+ " WHERE datediff( now(), files.added)>=? AND NOT files.Archived AND Enabled GROUP BY fileID"
				},		
				maxage = 90; // days

			/*
			forEach("", get.ungraded, [], function (file, sql) {
				Log("GRADE", file.Name);

				TOTEM.gradeIngest( sql, file, function (stats) {

					Log("grade", stats);

					if (stats) {
						var unsup = stats.unsupervised;

						sql.forAll(
							"",
							"UPDATE openv.bricks SET _State_graded=true, ?, _State_Notes=concat(_State_Notes,?) WHERE ?", [{
								tag: JSON.stringify(stats),
								coherence_time: unsup.coherence_time,
								coherence_intervals: unsup.coherence_intervals,
								degeneracy_param: unsup.degeneracy_param,
								//duration: stats.t,
								snr: unsup.snr
							},
							"Initial SNR assessment: " + (unsup.snr||0).toFixed(4),
							{ID: file.ID} 
						]);
					}

					else
						sql.query(
							"UPDATE apps.file SET _State_graded=true, snr=0, _State_Notes=? WHERE ?", [
							"Grading failed", {ID: file.ID} 
						]);
				});
			});
			*/

			if (get.expired)
				sql.forEach("", get.expired, [], file => { 
					Log("EXPIRE", file.Name);
					sql.query("DELETE FROM openv.events WHERE ?", {fileID: file.ID});
				});

			if (get.retired)
				sql.forEach("", get.retired, maxage, file => {
					Log("RETIRE", file.Name);

					var 
						site = TOTEM.site,
						url = site.worker,
						paths = {
							moreinfo: "here".link(url + "/files.view"),
							admin: "totem resource manages".link(url + "/request.view")
						},
						notice = `
Please note that ${site.nick} has moved your sample ${file.Name} to long term storage.  This sample 
contains ${file.eventCount} events.  Your archived sample will be auto-ingested should a ${site.nick} plugin
request this sample.  You may also consult ${paths.admin} to request additional resources.  
Further information about this file is available ${paths.moreinfo}. `;

					sql.query( "UPDATE openv.bricks SET ?, _State_Notes=concat(_State_Notes,?)", [{
						Archived: true}, notice]);

					/*
					need to export events to output file, then archive this output file
					exec(`git commit -am "archive ${path}"; git push github master; rm ${zip}`, err => {
					});*/

					sendMail({
						to: file.client,
						subject: `TOTEM archived ${file.Name}`,
						body: notice
					});
				});

			if (get.finished)
				sql.forEach("", get.finished, [], file => {
					Log("FINISHED", file.Name);
					//sql.query("UPDATE openv.bricks SET _State_ingested=1 WHERE ?",{ID:file.ID});
				});

			if (get.toingest)
				sql.forEach("", get.toingest, [], file => {
					var
						zero = {x:0, y:0},
						ring = file.Ring || [[ zero, zero, zero, zero, zero]],
						anchor = file.Anchor || zero,
						from = new Date(file._Ingest_Time),
						to = from.addDays(file.PoP_durationDays),
						ingester = "/ingest";

					Fetch( ingester.tag("?", {	// fetch all events ingested by this /plugin.usecase or 
						fileID: file.ID,
						from: from.toLocaleDateString("en-US"),
						to: to.toLocaleDateString("en-US"),
						lat: anchor.x,
						lon: anchor.y,
						radius: GEO.ringRadius(ring),
						ring: ring,
						durationDays: file.PoP_durationDays
					}), msg => {
						Log("INGEST", msg);
					});

					sql.query(
						"UPDATE openv.bricks SET _Ingest_Time=date_add(_Ingest_Time, interval PoP_advanceDays day), Revs=Revs+1 WHERE ?", 
						{ ID: file.ID }
					);
				});

		},

		/**
		Reserved watchdog for building mater catalogs
		*/
		catalog: sql => {
		},

		/**
		Watchdog for monitoring code licenses
		*/
		licenses: sql => {
			const {pocs,urls} = site;
			var 
				get = {
					unworthy: "SELECT ID,_Product,_EndServiceID FROM openv.releases WHERE _Fails > ? GROUP BY _Product,_EndServiceID"
				},
				maxFails = 10;

			sql.forEach("", get.unworthy, [maxFails], rel => {
				sql.query("UPDATE openv.masters SET _Revoked=1 WHERE least(?)", {EndServiceID: rel.EndServiceID, License: rel.License} );
			});
		},

		/**
		Watchdog for monitoring data voxels
		*/
		voxels: sql => {

			const {pocs,urls} = site;
			var
				get = {
					//unused: 
					//	"SELECT voxels.ID AS ID,aois.ID AS aoiID FROM openv.voxels "
					//+ " LEFT JOIN app.aois ON aois.name=voxels.class HAVING aoiID IS null"
					//, refresh: "SELECT ID FROM openv.voxels WHERE MBRcontains(ring, GeomFromText(?)) AND datediff(now(), added) > ?"
				},
				atmage = 2; // days to age before refresh atm data

			if (get.unused)
				sql.forEach("", get.unused, [], voxel => {
					sql.query("DELETE FROM openv.voxels WHERE ?", {ID: voxel.ID});
				});

			if (get.refresh)  // fetch new atm data from whatever service and loop over recs (grouped by Point(x y) grid location)
				sql.forEach("", get.refresh, [atm.gridLocation, dog.atmage], voxel => {
					// update voxels with atm data
				});

		},

		/**
		Watchdog for monitoring data cache
		*/
		cache: sql => {
		},

		/**
		Watchdog for monitoring notebook jobs
		*/
		jobs: sql => {
			var
				get = {
					//pigs: "SELECT sum(DateDiff(Departed,Arrived)>1) AS Count from openv.queues",			
					//unbilled: "SELECT * FROM openv.queues WHERE Finished AND NOT Billed",
					unfunded: "SELECT * FROM openv.queues WHERE NOT Funded AND now()-Arrived>?",				
					//stuck: "UPDATE openv.queues SET Departed=now(), Notes=concat(Notes, ' is ', link('billed', '/profile.view')), Age=Age + (now()-Arrived)/3600e3, Finished=1 WHERE least(Departed IS NULL,Done=Work)", 
					outsourced: "SELECT * FROM openv.queues WHERE Class='polled' AND Now() > Departed",
					unmailed: "SELECT * FROM openv.queues WHERE NOT Finished AND Class='email' "
					// pending: "SELECT * FROM openv.queues WHERE now()>Next"
				},
				max = {
					pigs : 2,
					age: 10
				};

			if ( pending = get.pending )
				sql.forEach("", pending, [], job => {
				});

			if ( pigs = get.pigs )
				sql.forEach("", pigs, [], job => {
				});

			if ( unmailed = get.unmailed ) 
				sql.forEach("", unmailed, [], job => {
					sql.query("UPDATE openv.queues SET Finished=1 WHERE ?", {ID: job.ID});
					sendMail({
						to: job.Client,
						subject: "Totem update",
						body: job.Notes
					});
				});

			if ( unbilled = get.unbilled )
				sql.forEach("", unbilled, [], job => {
					//Log(`BILLING ${job} FOR ${job.Client}`, sql);
					sql.query( "UPDATE openv.profiles SET Charge=Charge+? WHERE ?", [ 
						job.Done, {Client: job.Client} 
					]);

					sql.query( "UPDATE openv.queues SET Billed=1 WHERE ?", {ID: job.ID})
				});

			if ( unfunded = get.unfunded )
				sql.forEach("", unfunded, [max.age], job => {
					//Log("KILLING ",job);
					sql.query(
						//"DELETE FROM openv.queues WHERE ?", {ID:job.ID}
					);
				});

			if ( stuck = get.stuck )
				sql.query(stuck, [], (err, info) => {
					Each(queues, (rate, queue) => {  // save collected queuing charges to profiles
						Each(queue.client, function (client, charge) {

							if ( charge.bill ) {
								//if ( trace ) Log(`${trace} ${client} ${charge.bill} CREDITS`, sql);

								sql.query(
									"UPDATE openv.profiles SET Charge=Charge+?,Credit=greatest(0,Credit-?) WHERE ?" , 
									 [ charge.bill, charge.bill, {Client:client} ], 
									err => {
										if (err)
											Log("Job charge failed", err);
								});

								charge.bill = 0;
							}

						});
					});
				});	

			if ( outsourced = get.outsourced )
				sql.forEach( "", outsourced, [], job => {
					sql.query(
						"UPDATE openv.queues SET ?,Age=Age+Work,Departed=Date_Add(Departed,interval Work day) WHERE ?", [
						{ID:job.ID}
					] );

					Fetch( job.Notes, msg => Log("RUN", msg) );
				});
		},

		/**
		Watchdog for monitoring email
		*/
		email: sql => {

			const {pocs,urls} = site;
			var
				get = {
					toRemove: "DELETE FROM openv.email WHERE Remove",
					toSend: "SELECT `to`,subject,body FROM openv.email WHERE Send AND !Sent"
				};

			sql.query( get.toRemove );
			sql.query( get.toSend )
			.on( "result", rec => {
				rec.from = "totem@noreply.net";
				rec.alternatives = [{
					contentType: 'text/html; charset="ISO-59-1"',
					contents: ""
				}];
				sendMail(rec);
				//sql.query("DELETE FROM openv.email WHERE ?", {ID:rec.ID});
				sql.query("UPDATE openv.email SET Send=0,Sent=1 WHERE ?", {ID:rec.ID});
			});
		},

		/**
		Watchdog for monitoring client profiles
		*/
		clients: sql => {

			const {urls,pocs} = site;

			var
				get = {
					needy: "SELECT ID FROM openv.profiles WHERE useDisk>?",
					dormant: "",
					poor: "",
					naughty: "SELECT ID FROM openv.profiles WHERE Banned",
					uncert: "SELECT ID FROM openv.profiles LEFT JOIN openv.quizes ON profiles.Client=quizes.Client WHERE datediff(now(), quizes.Credited)>?",
				},
				disk = 10,  //MB
				qos = 2,  //0,1,2,...
				unused = 4,  // days
				certage = 360; // days

			if (get.naughty)
				sql.forEach("", get.naughty, [], client => {
				});

			if (get.needy)
				sql.forEach("", get.needy, [disk], client => {
				});		

			if (get.dormant)
				sql.forEach("", get.dormant, [unused], client => {
				});		

			if (get.poor)
				sql.forEach("", get.poor, [qos], client => {
				});		

			if (get.uncert)
				sql.forEach("", get.uncert, [dog.certage], client => {
				});		

		},

		/**
		Watchdog for creating system news
		*/
		news: sql => {

			const {pocs,urls} = site;
			var
				get = {
					toRemove: "SELECT * FROM app.news WHERE datediff(now(), _Ingested) > ? OR status_Remove OR now() > status_Ends",
					remove: "DELETE FROM app.news WHERE ?",
					addEntry: "INSERT INTO app.news SET ?"
				},
				maxAge = 1,
				newsPath = "./news";

			sql.query( get.toRemove, maxAge)
			.on("result", news => {
				sql.query( get.remove, {ID: news.ID});
				exec( `
cd ${newsPath} ;
rm -RIf news*
`	);
			});

			Fetch( dog.newsPath, files => {
				files.forEach( file => {
					if ( file.endsWith(".html" ) ) {
						var 
							msg = file.replace(".html",""),
							name = CRYPTO.createHmac("sha256", "pass").update(msg).digest("hex") ;

						sql.query( get.addEntry, {
							_Name: name,
							_Ingested: new Date(),
							status_Publish: false,
							Message: msg,
							Category: "packed",
							To: "editor1"
						}, err => {
							if ( !err ) {  // pack news for transport
								exec( `
cd ${dog.newsPath} ;	
mkdir ${name} ;
mv '${msg}'* ${name} ;
source ./maint.sh flatten ${name} ;
rm -RIf ${name} 
`, 
										err => {
											Log( `News packed ${name}` );
								});
							}
						});
					}

					else 
					if ( file.startsWith("F_" ) ) {
						var 
							parts = file.split("_"),
							name = parts[1];

						sql.query( get.addEntry, {
							_Name: name,
							_Ingested: new Date(),
							status_Publish: false,
							_Scanned: 0,
							status_Starts: new Date(),
							To: "editor2",
							Category: "unpacked"
						}, 	(err,entry) => {

							if ( !err ) {
								Log( `News unpack ${name}` );
								exec( `
cd ${dog.newsPath} ;
source ./maint.sh expand ${name} ;
`, 
									err => {
										Fetch( `${dog.newsPath}/${name}`, files => {
											files.forEach( file => {
												if ( file.endsWith(".html") ) {
													var msg = file.replace(".html","");
													sql.query( "UPDATE app.news SET ? WHERE ?", [{
															Message: file.replace(".html","").link(dog.newsPath.substr(1)+`/${name}/index.html`)
														}, {
															ID: entry.insertId
														}
													], err => {

														exec(`
cd ${dog.newsPath}/${name} ;
mv '${msg}'.html index.html ;
mv '${msg}'_files index_files ;
`, 
															err => Log(`News renamed ${name}` + err)
														);

													});
												}
											});
										})											
								});
							}
						});
					}
				});
			});
		},

		/**
		Watchdog for monitoring notebook usage
		*/
		notebooks: sql => {
			const {pocs,urls} = site;

			var
				get = {
					hogs: "DELETE FROM openv.syslogs WHERE datediff(now(), At) >= ?",
					buggy: ""
				},
				olds = 1,	// days old
				bugs = 10;

			// select sum((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024) AS `Size (MB)` from information_schema.tables;

			if (get.hogs)
				sql.forEach("", get.hogs, [dog.old], () => Log("Squeezed Notebook logs") );
		},

		/**
		Watchdog for monitoring system users
		*/
		users: sql => {
			const {pocs,urls} = site;

			var
				get = {
					inactive: "",
					buggy: ""
				},			
				inactive = 1,
				bugs = 10;

			if (get.inactive)
				sql.forEach("", get.inactive, [inactive], client => {
				});		
		}
	};

Start("dogs");
