// UNCLASSIFIED 

const
	{ readers, scanner } = READ = {}; //require("@totemorg/reader");		// partial config of NLP (avoids string prototype collision)

// NodeJS modules
const 									
	ENV = process.env,
	
	CLUSTER = require("cluster"),
	STREAM = require("stream"), 		//< pipe streaming
	CRYPTO = require("crypto"),
	CP = require("child_process"), 		//< Child process threads
	FS = require("fs"), 				//< filesystem and uploads
	VM = require("vm"),					//< virtual machines
	OS = require("os");					//< os utilities

// 3rd party modules
const	 
	JSMIN = require("uglify-js"), 		//< code minifier
	HMIN = require("html-minifier"), 	//< html minifier
	//PDF = require('pdffiller'), 		// pdf form processing
			
	ODOC = require("officegen"), 		//< office doc generator
	LANG = require('i18n-abide'), 		//< I18 language translator
	ARGP = require('optimist'),			//< Command line argument processor
	TOKML = require("tokml"); 			//< geojson to kml convertor

// totem modules
const
	// include modules
	//EAT = require("./ingesters"),	
	TOTEM = require("./totem"),
	ENUMS = require("./enums"),
	SKIN = require("./skin"),
	ATOM = require("@totemorg/atomic"), 
	$ = require("@totemorg/man"),
	//RAN = require("./randpr"),
	//PIPE = require("./pipe"),
	//BLOG = require("./blog"),
	DOGS = require("@totemorg/dogs");

const 
	{ exec } = CP,
	{ Copy,Each,Log,Start, Fetch,
	 isKeyed,isString,isFunction,isError,isArray,isObject,isEmpty,typeOf,
	 getList, getURL,
	 txmailCon, rxmailCon,
	} = ENUMS,
	{ skinContext, renderSkin, renderJade } = SKIN,
	{ runTask, queues, byAction,
		sqlThread, errors, paths, cache, site, byNode, userID, dsThread,
		watchFile, timeIntervals, neoThread, startJob 
	} = TOTEM,
	// { JIMP } = $,
	{ isMaster } = CLUSTER;

/**
@module DEBE.String
*/
Copy({
/**
*/
	align: function (hits,y,s) {
		var
			s0 = (a,b) => (a=="?" || b == "?") ? -2 : (a==b) ? 1 : -1 ,
			s = s || s0,
			x0 = this.split(" ");

		hits.forEach( (hit,n) => { 
			var 
				y0 = y(hit).split(" "),
				[score,aligns] = 
						// $.oga( x0,y0,s ),
						(x0.length>y0.length) ? $.oga( x0,y0,s ) : $.oga( y0,x0,s ),
				aligned = [];
			
			if ( !n ) Trace(hit.title,aligns);
			
			aligns[0].forEach( al => aligned.push( al.y ) );
			hit.score = score;
			hit.title += " => " + aligned.join(" ");
			//Trace(">>>t", x0.join(">"), y0.join(">") );
		});
		
		hits = hits.sort( (a,b) => b.score-a.score );
	},
	
/**
*/
	trimGoogle: function () {
		return this
			.replace(/(.*) -- (.*)/, (str,L,R) => R)
			.replace(/(.*) - (.*)/, (str,L,R) => L)
			.replace(/(.*) \| (.*)/, (str,L,R) => L)
			.replace(/[\-\"\,\;\:\.]/g, "")
			.replace(/  /g," ")
			.toLowerCase();
	}	
}, String.prototype);

/**
@module DEBE.Array
*/
Copy({  // array prototypes
/**
Merge changes when doing table deltas from their baseline versions.
@param {Array} Recs Source records to merge into this records
@param {String} idx Key name to use for detecting record changes
**/
	merge: function (Recs,idx) {

		function changed(rec,Rec) {
			for (var n in rec)
				if (rec[n] != Rec[n]) 
					return true;

			return false;
		}

		var recs = this;
		// sort records on specified index
		Recs = Recs.sort( function (a,b) {
			return a[idx] > b[idx] ? 1 : -1;
		});
		recs = recs.sort( function (a,b) {
			return a[idx] > b[idx] ? 1 : -1;
		});

		// merge records based on specified index.
		var k=0,Rec = Recs[k],ID=10000;

		if (Rec)
		recs.forEach( (rec,n) => {
	//Trace([n,k,recs.length, Recs.length, idx, rec[idx], Rec[idx]]);

			while (Rec && (rec[idx]  == Rec[idx])) {
				if ( changed(rec,Rec) ) { // return only changed records
					Rec.Baseline = 1;
					Rec.ID = ID++;
					recs.push( Rec );
				}
				Rec = Recs[++k];
			}

			rec.Baseline = 0;
		});	

		recs = recs.sort( function (a,b) {
			return a[idx] > b[idx] ? 1 : -1;
		});

		return recs;
	},

/**
Returns a schema of the array using the specified src path.
@param {String} src path to source
*/
	schemaify: function (src) {
		function nodeify(store, path, cb) {	// return list of nodes from store node

			var nodes = [];
			//Trace("node>>", "isobj", isKeyed(store), store.constructor.name );

			if ( typeof store == "object" ) 
				if ( store.forEach )  	// at an array node
					store.forEach( (node,n) => { 
						if ( typeof node == "object" ) if ( n<10 )	{ // at branch
							var
								nodeName = "[" + n + "]",
								nodePath = path + nodeName;

							nodes.push({ 
								name: nodeName,
								value: store[0] ? null : 10,
								doc: nodePath.link( cb(nodePath) ),
								children: store[0] ? nodeify( store[0], nodePath, cb ) : null
							});
						}
					});

			else // at an object node
				if ( path ) // at branch node
					Each(store, (key,val) => { // make nodes
						var 
							inGroup = path.substr(-1) == "_",
							nodeName = inGroup ? key : "."+key,
							nodePath = path + nodeName;

						nodes.push({
							name: nodeName,
							doc: nodePath.link( cb(nodePath) ),
							value: 20,
							children: nodeify( val || 0,  nodePath, cb )
						});
					});

				else {	// at root node
					var subs = {};

					Each( store, (key,val) => {
						var 
							ref = subs, 
							groups = key.split("_"), 
							depth = groups.length-1;

						try {  // convert json stores
							val = JSON.parse(val);
						}
						catch (err) {
						}

						groups.forEach( (group,idx) => {  // build subs hash
							var 
								isLast = idx == depth,
								key = isLast ? group : group+"_";

							if ( !ref[key] ) ref[key] = isLast ? val : {};

							ref = ref[key];
						});
					});

					nodes.push({
						name: "root",
						value: 10,
						children : nodeify( subs, "root", cb )
					});
				}

			else	// at a leaf node
			if (expandLeaf)
				nodes.push({
					name: (store.length || 0) + " elements",
					//value: 10,
					doc: "",
					children: []
				});

			return nodes;
		}	

		var 
			expandLeaf = false,
			root = this[0] || {};

		//Trace(">>root", root);

		return nodeify( root, null, path => 
					src+"&rtn:=" + path.substr(5).replace(/^([^.]*)/, key => key+"$")  
			);
	},

/**
Returns a tree = {name,weight,nodes} from records having been sorted on keys=[key,...]
@param {Number} idx starting index (0 on first call)
@param {Number} kids number of leafs following starting index (this.length on first call)
@param {Number} level current depth (0 on first call)
@param {Array} keys pivot keys
@param {String} wt key name that contains leaf weight (defaults to "size")
*/
	treeify: function (idx,kids,level,keys,wt) {
		var	
			recs = this,
			key = keys[level],
			len = 0,
			rec = recs[idx] || {},
			pos = idx, end = idx+kids,
			tar = [];

	//Trace([level,keys,ref,idx]);

		if (key)
			for (var ref = rec[key]; pos < end; ) {
				var stop = (idx==end) ? true : (rec[key] != ref);

				if ( stop ) {
					//Trace([pos,idx,end,key,ref,recs.length]);

					var node = {
						name: key+" "+ref, 
						value: wt ? parseInt(rec[wt] || "0") : len,
						children: recs.treeify(pos,len,level+1,keys,wt)
					};

					tar.push( node );
					pos = idx;
					len = 0;
					ref = (idx==end) ? null : recs[idx][key];
				}
				else {
					idx++;
					len++;
				}
			}

		else
			while (pos < end) {
				var rec = recs[pos++];
				tar.push({
					name: "doc", 
					value: 10, 
					doc: rec
				});
			}

		return tar;
	}

}, Array.prototype);
	
/**
@module DEBE.Data
*/
Copy({  // date prototypes
	getWeek: function () {
		  var date = new Date(this.getTime());
		   date.setHours(0, 0, 0, 0);
		  // Thursday in current week decides the year.
		  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
		  // January 4 is always in week 1.
		  var week1 = new Date(date.getFullYear(), 0, 4);
		  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
		  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
								- 3 + (week1.getDay() + 6) % 7) / 7);
	},
	
	addDays: function (days) {
		var d = new Date(this);
		d.setDate( d.getDate() + days);
		return d;
	}
}, Date.prototype);

/**
Provides UI interfaces to the [barebone TOTEM web service](https://github.com/totemorg/totem) 
to support notebooks and other entities.  This module documented 
in accordance with [jsdoc]{@link https://jsdoc.app/}.

### Env Dependencies

	HOSTNAME = name of host machine
	REPO = http://DOMAIN:ACCOUNT
	JIRA = http://DOMAIN
	RAS = http://DOMAIN
	BY = https://DOMAIN

@module DEBE
@author [ACMESDS](https://totemorg.github.io)

@requires [totem](https://github.com/totemorg/totem)
@requires [atomic](https://github.com/totemorg/atomic)
@requires [man](https://github.com/totemorg/man)
@requires [enums](https://github.com/totemorg/enums)
@requires [reader](https://github.com/totemorg/reader)
@requires [skin](https://github.com/totemorg/skin)
@requires [dogs](https://github.com/totemorg/dogs)

@requires [crypto](https://nodejs.org/docs/latest/api/)
@requires [child_process](https://nodejs.org/docs/latest/api/)
@requires [fs](https://nodejs.org/docs/latest/api/)
@requires [stream](https://nodejs.org/docs/latest/api/)
@requires [cluster](https://nodejs.org/docs/latest/api/)
@requires [repl](https://nodejs.org/docs/latest/api/)

@requires [i18n-abide](https://www.npmjs.com/package/i18n-abide)
@requires [optimist](https://www.npmjs.com/package/optimist)
@requires [tokml](https://www.npmjs.com/package/tokml)
@requires [officegen](https://www.npmjs.com/package/officegen)

@example 

// npm test D2
// Start challenge-protected server with additional byNode-routed entpoints.

config({
	riddles: 10,
	"byNode.": {
		wfs: function (req,res) {
			res("here i go again");

			Fetch(ENV.WFS_TEST, data => {
				Trace(data);
			});
		}
	}
}, sql => {
	Trace( "This bad boy in an encrypted service with a database and has an /wfs endpoint" );
});	

@example 

// npm test D3
// Start server using default config

config({
}, sql => {
	Trace( "Stateful network flow manger started" );
});

@example

// npm test D4
// Start server and prep file system

function readFile(sql, path, cb) {
	sql.beginBulk();
	readers.xls( "./config.stores/test.xls", rec => { 
		if (rec) 
			cb(rec,sql);

		else 
			sql.endBulk();
	});
}

config({
}, sql => {
	var recs = 0, now = new Date();
	readFile( sql, "./config.stores/test.xls", (rec,sql) => {
		if ( ++recs<5 ) {
			var 
				doc = (rec.doc || rec.Doc || rec.report || rec.Report || "")
						.replace( /\n/g, " ")
						.replace( /\&\#10;/g, " "),

				docs = doc				
						.match( /(.*)TEXT:(.*)COMMENTS:(.*)/ ) || [ "", "", doc, ""],

				text = "";

			docs[2].replace( /\.  /g, "\n").replace( /^[0-9 ]*\. \(.*\) (.*)/gm, (str,txt) => text += txt + ".  " );

			sql.query("INSERT INTO openv.docs SET ?", {
				Reported: rec.reported || rec.Reported || now,
				Name: rec.reportID || ("tbd-"+recs),
				Pipe: JSON.stringify( text )
			}, err => Trace("add", err) );
		}
	});
});

*/

const
	{ 
		sendMail, Trace, routeTable, $libs, config, initialize, dogs,
	 	filters, licenseOnDownload, defaultDocs 
	} = DEBE = module.exports = Copy({
	
	Trace: (msg, ...args) => `debe>>>${msg}`.trace( args ),
		
/**
Inspect doc - kludge i/f to support nlp project
*/
	linkInspect: (doc,to,cb) => {
		
		Trace("sendmail", doc,to);
		
		if ( ! to.endsWith("@totem.org") && ! to.endsWith(".mil") )
			sendMail({	// send email to those outside totem's eco system
				subject: "Important totem message",
				text: doc,
				to: to
			});
		
		const
			[x,Doc,Topic] = doc.match( /(.*)#(.*)/ ) || ["",doc,""];
		
		if ( scanner )
			scanner(Doc, Topic||"default", 0.1, score => {
				Trace(doc,score);
				cb(score);
			});
		
		else
			cb( null );
			
	},
	
/**
*/
	$libs: {   // share these modules with engines
		
/**
*/
		$site: site,
		
/**
*/
		$notebooks: [],
		
/**
*/
		$fetch: (ref,cb) => {
			if (ref)
				Fetch( ref, cb || console.log );
			
			else
				console.log(ENUMS.sites);
		},
		
/**
*/
		$get: (src,index,cb) => {
			switch (src.constructor.name) {
				case "Array":
					return getList(src,index,cb);
			
				case "String":
					return getURL(src,index);
			
				default: 
					console.log(`
Usage:
	$get( [...], "KEY=EVAL & ..." || (i,A) => { ... } )
	$get( "FILE ? _OPTION=VALUE & ... & KEY=EVAL & ..." , BATCH => { ... } )
`);
			}
		},
		
/**
See [man]{@link https://github.com/totemorg/man/}
*/
		$: $,
/**
See [debe]{@link https://github.com/totemorg/debe/}
*/
		$log: console.log,
/**
See [debe]{@link https://github.com/totemorg/debe/}
*/
		$task: runTask,
		// $jimp: JIMP,
/**
See [jsdb]{@link https://github.com/totemorg/jsdb/}
*/
		$sql: sqlThread,
		
		$select: (url,cb) => dsThread( {
			url: "/"+url,
			body: {},
			client: "$lab"
		}, req => byAction.select(req, cb||$log) ),
		$update: (url,body,cb) => dsThread( {
			url: "/"+url,
			body: body||{},
			client: "$lab"
		}, req => byAction.update(req, cb||$log) ),
		$insert: (url,body,cb) => dsThread( {
			url: "/"+url,
			body: body||{},
			client: "$lab"
		}, req => byAction.insert(req, cb||$log) ),
		$delete: (url,cb) => dsThread( {
			url: "/"+url,
			body: {},
			client: "$lab"
		}, req => byAction.delete(req, cb||$log) ),
		
/**
See [jsdb]{@link https://github.com/totemorg/jsdb/}
*/
		$neo: neoThread,
/**
See [enums]{@link https://github.com/totemorg/enums/}
*/
		$copy: Copy,
/**
See [enums]{@link https://github.com/totemorg/enums/}
*/
		$each: Each,
/**
*/
		$help: f => {
			const name = f ? f.name : "labapi";
			CP.exec( `firefox ${site.master}/${name}.view` );
			return null;
		}
	},
	
/**
License notebook engine code.
*/
	licenseCode: ( sql, code, pub, cb ) => {  //< callback cb(pub) or cb(null) on error

		function validateLicense(pub, cb) {

			function genLicense(code, secret) {  //< callback cb(minifiedCode, license)
				Trace("gen license", secret);
				if (secret)
					return CRYPTO.createHmac("sha256", secret).update(code).digest("hex");

				else
					return null;
			}
			
			function serviceID(url) {
				return CRYPTO.createHmac("sha256", "").update(url || "").digest("hex");
			}

			var
				product = pub._Product,
				endService = pub._EndService,
				secret = product + "." + endService;

			if ( license = genLicense( code, secret ) ) {
				cb( Copy({
					_License: license,
					_EndServiceID: serviceID( pub._EndService ),
					_Copies: 1
				}, pub) );

				sql.query( "INSERT INTO openv.releases SET ? ON DUPLICATE KEY UPDATE _Copies=_Copies+1", pub );

				sql.query( "INSERT INTO openv.masters SET ? ON DUPLICATE KEY UPDATE ?", [{
					Master: code,
					License: license,
					EndServiceID: pub._EndServiceID
				}, {Master: code} ] );		
			}

			else 
				cb( null );
		}

		if (endService = pub._EndService)  // an end-service specified so validate it
			Fetch( endService, info => {  // check users provided by end-service

				var 
					valid = false, 
					partner = pub._Partner.toLowerCase(),
					users = info.parseJSON() || [] ;

				users.forEach( user => { 
					if (user.toLowerCase() == partner) valid = true;
				});

				if (valid) // signal valid
					validateLicense( pub,  cb );

				else	// signal invalid
					cb( null  );
			});	

		else	// no end-service so no need to validate
			validateLicense(pub, cb);
	},
	
/**
Route nodes according to security requirements.
*/
	"nodeRouter.": {  //< sql table re-routers
		profiles: req => "openv.profiles",
		sessions: req => "openv.sessions",
		relays: req => "openv.relays",
		nlprules: req => "openv.nlprules",
		
		lookups: req => "openv.lookups",
		
		projects: req => "openv.projects",
		
		milestones: req => "openv.milestones", 
		
		engines: req => { // protect engines 
			//Trace("<<<", req);
			return "openv.engines";
			
			const { overlord } = {overlord: "guest@guest.org"}; //site.pocs;
			
			//Trace(">>>sec check", site.pocs, req.client);
			
			if ( overlord )
				if ( overlord.indexOf(req.client.toLowerCase()) >= 0 ) // allow access
					if ( false ) { // access via licensed copy
						req.index["Nrel:"] = "count(releases._License)";
						req.index[req.table+".*:"] = "";
						req.join = `LEFT JOIN ${req.db}.releases ON (releases._Product = concat(engines.name,'.',engines.type)) AND releases._Partner='${req.client}'`;
						req.where["releases.id:"] = "";
						return "openv.engines";
					}

					else // grant access
						return "openv.engines";

				else	// block access
					return "block.engines";
			
			else
				return "openv.engines";
		},
		
		issues: req => "openv.issues",
		
		roles: req => "openv.roles",
	
		proxies: req => "openv.proxies",
		
		masters: req => "block.masters",
		
		rtpsecs: req => "openv.rtpsecs",
		
		syslogs: req => "openv.syslogs",
		
		bricks: req => "openv.bricks",
		
		queues: req => "openv.queues",
		
		mods: req => "openv.mods"
		
		/*faqs: req => {
			if ( set = req.set ) {
				set._By = req.client;
				set._Dirty = true;
			}
			return "openv.faqs";
		}*/
	},
	
/**
Default doc for reserved notebook keys
*/
	defaultDocs: {	// default plugin docs (db key comments)
		nodoc: "no documentation provided",

		Export: "Write notebook results [into a file](/api.view)",
		Ingest: "Ingest notebook results [into the database](/api.view)",
		
		//Batch: "Batch size during pipe",
		//Threshold: "Acceptance threshold during pipe",
		//Limit: "Number of accepted records during pipe",
		
		Name: "Unique usecase name",
		
		//Script: `Script to munge data: $.X(...) with X = resize || greyscale || sym || shuffle || get.`,
		
		Pipe: `
Place data source into a [buffered, regulated, enumerated, event or named *Pipe*](/pipeapi.view):
	"PROTOCOL://HOST/ENDPOINT ? QUERY"
	"/FILE.TYPE ? _batch=N & _limit=N & _start=DATE & _end=DATE & _every=sec||min||hr||... & _util=N & _on=N & _off=N & _watch=N & _propose=N & _basline=N,...N & _agent=X & _rekey=EVAL||KEY"
	{ "KEY" :  [N, ...] || "MATHJS" , noClobber:N, noRun:N } || { "$" : "MATHJS" } 
	[ EVENT, ... ]
	".CASE.NOTEBOOK"

`,

		Description: `
[Document your notebook's usecase](/mdapi.view):
	$PLOT{ SRC ? w=WIDTH & h=HEIGHT & x=KEY||STORE$KEY & y=KEY||STORE$KEY ... }
	$ { KEY }
	[ LINK ] ( URL )
	$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$
	TeX := TeX || #VAR || VAR#KEY#KEY...
	| GRID | ... |
	# SECTION
	ESCAPE || $with || $for || $if:
		BLOCK

`,

		Entry: `
Prime your notebook's context KEYs on entry:
	{ "KEY": "SELECT ...." || VALUE, ... }  

as described in the [Notebooks api](/api.view). `,

		Exit: `
Save your notebook's context KEYs on exit:
	{ "KEY": "UPDATE ....", ... }

as described in the [Notebooks api](/api.view). `,

		//Ring: "[[lat,lon], ...] in degs 4+ length vector defining an aoi",
		
		Save: `Save events [ {at:"AT", ...}, ...] to Save_AT store`,		
		Save_snap: `Save detector snapshot`,
		Save_baseline: `Save baseline performance data`,
		
		Save_end: "Save info when stream finished",
		Save_config: "Save info when stream configured",
		Save_batch: "Save info when stream at batch epochs",
		Save_files: `Save json data to files in export area`,
		Save_text: `Save text lists ["...", ...] to export area`,		
		Save_jpg: `Save image {prime:"...",index:[...],values:[...]} to jpg file in export area`,
		Save_net: `Save network {name:"...", nodes:[...],edges:{topic: [[node,node], ...]}} to neo4j graph`

	},
	
/**
*/
	licenseOnDownload: true,
			
/**
*/
	sendMail: (opts,cb) => {
	
		Trace("sendmail", opts);
		
		if (opts.to) {
			//opts.from = "totem@noreply.net"; 
			/*opts.alternatives = [{
				contentType: 'text/html; charset="ISO-59-1"',
				contents: ""
			}]; */

			//Trace(">>>sendmail", opts);
			txmailCon.sendMail( opts, (err,info) => {
				//Trace(">>>email", err,info);
				if ( cb ) cb(info);
			});
		}
	},

/**
Initialize DEBE on startup.
@param {Object} sql MySQL connector
@param {Function} init callback(sql) when service init completed
*/
	initialize: init => {	//< initialize service
		
		function initSES(cb) {	// init sessions
			Trace(`INIT SESSIONS`);

			/*
			Each( CRUDE, function (n,routes) { // Map engine CRUD to DEBE workers
				DEBE.byNode[n] = ATOM[n];
			});	
			*/
			/*
			The i18n simply provides an industry standard framework for translating native -> foreign
			phrases (defined my pot->po files under XLATE folder).  These pot->po translations are 
			not free.  Wordpress, for example, provides a service that allows websites to register
			for their services that crowd source translations from supplied pot files to their
			delivered po files.
			*/

			if (path = paths.xlate) 
				EXAPP.use(LANG.abide({
					supported_languages: ['en', 'de', 'fr'],
					default_lang: 'en',
					translation_directory: path,
					translation_type: "json"
					//locale_on_url: true
				}));

			if (cb) cb();
		}

		function initENV(cb) {	// init runtime env
			Trace(`INIT ENVIRONMENT`);

			var 
				args = ARGP
				.usage("$0 [options]")

				.default('spawn',DEBE.isSpawned)
				.boolean('spawn')
				.describe('spawn','internal hyper-threading option')
				.check( argv => {
					DEBE.isSpawned = argv.spawn;
				})

				/*.default('blind',DEBE.blindTesting)
				.boolean('blind')
				.describe('blind','internal testing flag')  
				.check( argv => {
					DEBE.blindTesting = argv.blind;
				}) */

				/*.default('dump',false)
				.boolean('dump')
				.describe('dump','display derived site parameters')  
				.check( argv => {
					//Trace(site);
				}) */

				/*
				.default('start',DEBE.site.Name)
				.describe('start','service to start')  
				.check( argv => {
					site.Name = argv.start;
				})
				* */

				.boolean('info')
				.describe('info','display site info')
				.check( argv => {
					//Log(site);
				})

				/*
				.default('echo',DEBE.FLAGS.DEBUG)
				.boolean('echo')
				.describe('echo','echo adjusted http request parameters')
				.check( argv => {
					DEBE.FLAGS.DEBUG = argv.echo;
				})*/

				.boolean('help')
				.describe('help','display usage help')
				.check( argv => {
					if (argv.help) {
						console.log( ARGP.help() );

						console.log("Available services:");
						sql.query("SELECT Nick,Title FROM openv.apps")
						.on("result", app => {
							console.log(app.Nick,app.Title);
							//Trace(app.Name+" v"+app.Ver+" url="+app.Host+":"+app.Port+" db="+app.DB+" nick="+app.Nick+" sockted="+(app.Sockets?"yes":"no")+" cores="+app.Cores+" pki="+app.PKI);
						})
						//.on("error", err => Trace(err) )
						.on("end", () => process.exit() );
					}
				})
				.argv;

			if (cb) cb();
		}

		function initLAB(cb) {	// Initialize notebook lab env
			const 
				foci = {},
				{ $notebooks } = $libs,
				repo = ENV.REPO, //"https://github.com/totemorg",
				toggle = {
					chain: false
				};
			
			cb();
			
			// config notebook i/f
				
			sqlThread( sql => {
				sql.getTables( "app", books => {	
					books.forEach( book => {
						function logRun(data) {
							console.log(book+">", data);

							sqlThread( sql => {
								sql.query("INSERT INTO openv.mods SET ?", {
									Name: book,
									Made: new Date(),
									Mod: DEBE.replCmd + " => " + data
								});
							});
						}

						function openBrowser(type,query) {
							CP.exec( `firefox ${site.master}/${book}.${type}`.tag("?",query||{})+"", err => logRun(err||errors.ok) );
							return toggle.chain ? $me : null;
						}

						function logCommand( cmd, log ) {
							CP.exec( cmd, log );
							return toggle.chain ? $me : null;
						}

						$notebooks.push(book);

						const 
							$book = "$"+book,
							$ds = "app."+book,
							$engine = {Name:book},
							$me = $libs[$book] = Copy({
								help: query => exec( `firefox ${repo}/artifacts/tree/master/${book}` ),

								insert: vals => sqlThread( sql => 
									sql.query( isString(vals) 
										? `INSERT INTO ?? SET ${vals}`
										: "INSERT INTO ?? SET ?",
										[ $ds, vals ], err => logRun( err || errors.ok ) )),

								delete: usecase => sqlThread( sql => 
									sql.query(
										isString(usecase)
										? `DELETE FROM ?? WHERE ${usecase}`
										: "DELETE FROM ?? WHERE ?",
										[$ds, {Name:usecase}], err => logRun( err || errors.ok ) )),

								update: (usecase,vals) => sqlThread( sql => 
									sql.query(
										isString(usecase)
										? `UPDATE ?? SET ? WHERE ${usecase}`
										: "UPDATE ?? SET ? WHERE ?",
										[$ds, vals, {Name:usecase}], err => logRun( err || errors.ok ) )),

								blog: (pat,sub) => {
									const 
										index = foci[book],
										[usecase,key] = index.split("?"),
										Key = key || "Description",
										fix = {},
										Pat = new RegExp( pat
												.replace("$","\\$")
												.replace("*","\\{.*\\}") );

									if ( usecase )
										$me( usecase, ctx => {
											console.log(Key, ":", Pat, "=>", sub);

											fix[Key] = ctx[Key].replace(Pat,sub);
											$me( usecase, fix );
										});

									else
										console.log( '${$book}.blog("LEAD$KEY*POST", "UPDATE")' );
								},

								plot: ( ...args) => {
									const 
										names = ["x","y"],
										keys = {};

									args.forEach( (arg,i) => {
										const
											name = names[i % names.length];

										if ( isString(arg) ) 
											keys[name] = arg;

										else {
											$me( `?Save$.${name}`, arg );
											keys[name] = `Save$.${name}`;
										}
									});

									$me( "?Description", "$plot{" + "".tag("?",keys) + "}" );
									//return $me;
								},
								chain: query => toggle.chain = !toggle.chain,
								edit: query => logCommand( `code ./notebooks/${book}.js`, logRun ),
								focus: index => {
									if (index) 
										return foci[book] = index;

									else
										return foci[book];
								},
								keys: (query,cb) => {
									sqlThread( sql => {
										switch ( (query||"").toLowerCase()) {
											case "cases": 
												sql.query("SELECT Name FROM ??", [$ds], (err,recs) => (cb||$log)(recs.get("Name").Name));
												break;

											case "save":
											case "!context":
											case "!ctx":
												sql.getKeys( $ds, "Field LIKE 'Save%'", keys => (cb||$log)(keys) );
												break;

											case "!save":
											case "context":
											case "ctx":
												sql.getKeys( $ds, "Field NOT LIKE 'Save%'", keys => (cb||$log)(keys) );
												break;

											case "all":
											case "":
												sql.getKeys( $ds, "", keys => (cb||$log)(keys) );
												break;

											default:
												sql.getKeys( $ds, {Type:query}, ({Field}) => (cb||$log)(Field) );
										}
									});											
								},
								run: query => openBrowser("run",query),
								open: query => openBrowser("run",query),
								pdf: query => openBrowser("_pdf",query),
								brief: query => openBrowser("brief",query),
								usage: query => openBrowser("usage",query),
								view: query => openBrowser("view",query),
								tou: query => openBrowser("tou",query),
								rtp: query => openBrowser("rtp",query),
								pub: query => openBrowser("pub",query),
								publish: query => openBrowser("pub",query),
								stores: query => openBrowser("stores",query)
							}, (index, cb) => {
								function runNotebook(ctx) {
									console.log( `Running ${book}` );

									sqlThread( sql => {
										runPlugin({
											sql: sql,
											table: book,
											query: ctx,
											type: "exe"
										}, stat => logRun(stat) );
									});
								}

								if ( index )
									if ( isString(index) ) {
										const
											[usecase,query] = (index || foci[book]).split("?"),
											$usecase = {Name: usecase || "noFocus"};

										if ( query ) 
											if ( isFunction(cb || runNotebook) )
												sqlThread( sql => {		// run notebook in requested context
													const
														[store,key] = query.split("$");

													if ( query.indexOf("$") >= 0 )
														sql.query(
															`SELECT json_extract(${store}, '$${key}') AS ${store} FROM ?? WHERE ? LIMIT 1`,
															[ $ds, $usecase ], (err,recs) => {

																if ( err ) 
																	Log(err);

																else
																if ( ctx = recs[0] ) {
																	ctx[store] = JSON.parse(ctx[store]);
																	(cb||runNotebook)( ctx );
																}

															});

													else
														sql.query(
															`SELECT ${store.split('&').join(',')} FROM ?? WHERE ? LIMIT 1`,
															[ $ds, $usecase ], (err,recs) => {

																if ( err ) 
																	Log(err);

																else
																if ( ctx = recs[0] )
																	(cb||runNotebook)( ctx );

															}); 
												});

											else 
												sqlThread( sql => {		// update notebook context with specifed hash
													const
														[store,key] = query.split("$"),
														val = JSON.stringify(cb);

													if ( query.indexOf("$") >= 0 )
														sql.query(
															`UPDATE ?? SET ${store} = json_set(${store}, '$${key}', cast(? AS JSON)) WHERE ?`, 
															[ $ds, val, $usecase ],
															err => logRun(err || errors.ok) );

													else
														sql.query(
															`UPDATE ?? SET ${store} = ? WHERE ?`,
															[ $ds, val, $usecase ],
															err => logRun(err || errors.ok) );
												});

										else
										if ( isFunction(cb || runNotebook) )
											sqlThread( sql => {		// run notebook
												sql.getContext( $ds, $usecase, cb || runNotebook );
											});

										else
											sqlThread( sql => {	// update notebook context
												sql.query(
													"UPDATE ?? SET ? WHERE ?",
													[ $ds, cb, $usecase ],
													err => logRun(err || errors.ok) );												
											});

									}

									else
									if ( isFunction(index) )
										sqlThread( sql => {
											sql.getKeys( $ds, "Field NOT LIKE 'Save%'", ({Field}) => {
												sql.query( "SELECT Name FROM ??", [$ds], (err,recs) => {
													index({ 
														keys: Field,
														cases: err ? null : recs.get("Name").Name
													});
												});
											});
										});

									else
										runNotebook(Copy( index, $engine ));

								else
									sqlThread( sql => {
										sql.getKeys( $ds, "", ({Field}) => { 
											console.log(`
Usage:
	${$book}( "USECASE?STORE$KEY" || "USECASE?KEY || "USECASE" || || ...", {SETKEY:NEWVAUE, ...} )
	${$book}( "USECASE?STORE$KEY" || "USECASE?KEY || "USECASE" || || ...", CTX => { ... } ) 
	${$book}( "USECASE" || {...}, RESULTS => { ... } ) 
	${$book}( {keys:[...], cases:[...]} => { ... } )  

Keys:
	${Field.join(",")}
` );
										});
									});

								return toggle.chain ? $me : null;
							});
					});
				});
			});

			// setup watchdogs
			
			Each( dogs, (name,dog) => {
				$libs["$"+name+"_dog"] = function () { Log("Dogging",name); sqlThread(sql => dog(sql)); } 
			});
			
			site.watchDogs = Object.keys(dogs).map( key => key ).join(", ");			
		}
		
		const 
			{lookups} = SKIN,
			{pocs,host} = site;
		
		initLAB( () => {  // init $lab notebooks
		initENV( () => {  // init environment
		initSES( () => {  // init sessions
			
			if ( isMaster ) {
				// start news feeds
				
				if ( false ) startNews(sql);

				// notify admin service started
				
				if (false)
				startMail( err => {
					if (false)
					sendMail({		
						to: "brian.d.james@comcast.net", //site.pocs.admin,
						subject: site.nick + " started", 
						text: "Just FYI"
					} );
				});

				// set custom watchdogs
				
				if (false)
				sql.query( "SELECT File FROM openv.watches WHERE substr(File,1,1) = '/' GROUP BY File", [] )
				.on("result", link => {
					ENDPTS.autorun.set( link.File );
				});

				// clear graph database
				
				if ( false ) {	
					sql.query("DELETE FROM openv.nlpactors");
					sql.query("DELETE FROM openv.nlpedges");
				}
				
				// build documentation of endpoints
				
				if ( false ) 					
					Stream(byNode, {}, (val,skey,cb) => {	// system endpoints
						if ( cb ) // streaming
							if ( val.name == "sysNav" ) 
								cb( "Navigator".replace(/\n/mg,"<br>") );
						
							else
								Fetch( `${host}/${skey}.help`, help => {
									//Trace(">>>>help",key,val.name, help);
									cb( `${skey}: ${help}`.replace(/\n/mg,"<br>") );
								});

						else	// stream terminated
							Stream( FLEX.select, {}, (val,fkey,cb) => {	// flex endpoints
								if ( cb )	// streaming
									Fetch( `${host}/${fkey}.help`, help => {
										//Trace(">>>>help",key,val.name, help);
										cb( `${fkey}: ${help}`.replace(/\n/mg,"<br>") );
									});

								else 	// stream terminated
									Fetch( `${host}/notebooks`, books => {	// notebook endpoints
										JSON.parse(books).forEach( book => {
											fkey.push( [
												`${book.Name}:`, book.run, book.help, book.publish, book.get, book.brief
											].join(" ") );
										});

										sql.query("UPDATE openv.apps SET ? WHERE ?", [{
											Doc: skey.concat(fkey).join("<br>")
										}, {
											nick: site.nick
										}]);
									});
							});
					});
			}

			const 
				{saveKeys,scripts} = $;

			sqlThread( sql => {
				/*
				if (saveKeys)
				sql.getFields("openv._stats", {}, keys => {		//  init shared file stats
					keys.forEach( key => saveKeys[key] = true );
				}); */

				if (scripts)
				sql.query("SELECT * FROM app.scripts", [], (err,recs) => {
					if ( !err )
						recs.forEach( rec => {
							if ( script = rec.Script ) {
								var fat = script.indexOf("=>");
								if ( fat >= 0 )
									try {
										script = script.substr(0,fat+2) + "`" + script.substr(fat+2) + "`";
										scripts[ rec.Name ] = eval( script );
									}
									catch (err) {
										Trace( "Bad $script", script );
									}

								else
									scripts[ rec.Name ] = script;
							}
						});
				});
			});

			ATOM.config({		// plugin/notebook/engine manager
				cores: 0,
				node: ENV.HOSTNAME,
				"$libs.": $libs
			});

			/* READ.config({
				jimp: JIMP
			});  */
			
			if ( init ) sqlThread( sql => {
				sql.query("SELECT Ref AS `Key`,group_concat(DISTINCT Path SEPARATOR '|') AS `Select` FROM openv.lookups GROUP BY Ref", [], (err,recs) => {
					recs.forEach( rec => {
						lookups[rec.Key] = rec.Select;
					});
				});
		
				init(sql);
			});
			
			//site.repos.forEach( x => site[x+"$"] = lab => (lab||x).tag(site.repo+"/"+x) );
			//site.views.forEach( x => site[x+"$"] = lab => (lab||x).tag(site.view+"/"+x+".view") );

		}); }); }); 
	},
		
	dogs: DOGS,
	
	diag: {  //< reserved for self diag parms
		status: "", 
		counts: {State: ""}
	},
										 
/**
Filter dataset recs on specifed req-res thread
*/	
	"filters." : { 
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		data: (recs,req,res) => {  //< renders dataset records
			const
				{sql,table,query} = req,
				{name} = query;
			
			sql.query( name 
				? "SELECT Pipe,Name FROM app.?? WHERE ? LIMIT 1"
				: "SELECT Pipe,Name FROM app.??", [table,{Name:name}], (err,recs) => {
				
				const rtn = {};
				
				recs.stream( (rec, key, cb) => {
					if ( rec )
						Fetch( "file:"+(rec.Pipe.Pipe || rec.Pipe), data => {
							try {
								rtn[rec.Name] = data ? JSON.parse(data) : null;
							}
							
							catch (err) {
								rtn[rec.Name] = null;
							}
							
							cb();
						});
					
					else 
						res( rtn );
				});
			});
		},
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		open: (recs,req,res) => {  //< renders dataset records
			filters.blog(recs,req, recs => {
				var
					blog = "";
				
				recs.data.forEach( rec => blog += rec.Description );
				res( blog.tag("body").tag("html") );
			});
		},
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		dbx: (recs, req, res) => {
			var Recs = [];
			recs.forEach( rec => {
				var Rec = [];
				for ( var key in rec ) Rec.push( rec[key] );
				Recs.push(Rec);
			});
			res({
				data: Recs
			});
		},
		
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		kml: (recs,req,res) => {  //< dataset.kml converts to kml
			res( TOKML({}) );
		},
		
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		flat: (recs,req,res) => { //< dataset.flat flattens records
			recs.forEach( (rec,n) => {
				var rtns = new Array();
				for (var key in rec) rtns.push( rec[key] );
				recs[n] = rtns;
			});
			res( recs );
		},
		
/*
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/*
		txt: (recs,req,res) => { //< dataset.txt convert to text
			var head = recs[0], cols = [], cr = String.fromCharCode(13), txt="", list = ",";

			if (head) {
				for (var n in head) cols.push(n);
				txt += cols.join(list) + cr;

				recs.forEach( (rec) => {
					var cols = [];
					for (var key in rec) cols.push(rec[key]);
					txt += cols.join(list) + cr;
				});
			}

			res( txt );
		},
		*/
		
/*
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/*
		stat: (recs,req,res) => { // dataset.stat provide info
			var 
				table = req.table,
				uses = [
					"db", "xml", "csv", "txt", "schema", "view", "tree", "flat", "delta", "nav", "html", "json",
					"view","pivot","site","spivot","brief","gridbrief","pivbrief","run","plugin","runbrief","proj",
					"exe", "stat"];

			uses.forEach( (use,n) => {
				uses[n] = use.link( "/"+table+"."+use );
			});
			
			req.sql.query("DESCRIBE app.??", [table], function (err, stats) {
				
				if (err)
					res(err);
				
				else {
					stats.forEach( (stat,n) => {
						stats[n] = stat.Field.link( "/"+table+"?_index="+stat.Field );
					});
					
					res(`
Records: ${recs.length}<br>
Fields: ${stats.join(", ")}<br>
Usage: ${uses.join(", ")}  `);
				}
			});
			
		}, */
		
/*
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/*
		html: (recs,req,res) => { //< dataset.html converts to html
			res( recs.gridify ? recs.gridify({},{border: "1"}) : recs );
		}, */

		// MS office doc types
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		xdoc: genDoc,
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		xxls: genDoc,
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		xpps: genDoc,
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		xppt: genDoc,
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		tree: (recs,req,res) => { //< dataset.tree treeifies records sorted with _sort=keys
			var 
				flags = req.flags,
				query = req.query;
			
			if (sorts = flags.sort)			
				res([{
					name: "root", 
					size: 1, 
					nodes: recs.treeify( 0, recs.length, 0, sorts.split(",") )
				}]);
			
			else
				res( new Error("missing sorts=key,... flag") );
		},
/**
@param {Array} recs Records to filter
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		schema: (recs,req,res) => { //< dataset.schema 
			var 
				flags = req.flags,
				query = req.query,
				src = ("/"+req.table+".json").tag("?",{name:query.name});
			
			//Trace(">>src", src);
			res( recs.forEach ? recs.schemaify( src ) : [recs].schemaify( src ));
		},
		
		/*
		delta: (recs,req,res) => { //< dataset.delta adds change records from last baseline
			var sql = req.sql;
			var ctx = {
				src: {
					table: "baseline."+req.table
				}
			};

			sql.context(ctx, function (ctx) {   		// establish skinning context for requested table
				ctx.src.rec = function (Recs,me) {  // select the baseline records 
					
					if ( isError(Recs) )
						res( Recs );
					
					else
						res( recs.merge(Recs, Object.keys(Recs[0] || {})) );
				};
			});
		}
		*/
	},

/**
/AREA/FILE-endpoint routers
*/
	"byArea.": {
	},

/**
/NODE-endpoint routers
*/
	"byNode.": {
		// nlp

/**
Search for a file
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		search: (req,res) => {
			const
				{ sql, query, type } = req,
				{ find } = query,
				apiKey = "AIzaSyBp56CJJA0FE5enebW5_4mTssTGaYzGqz8", // "nowhere stan" / nowhere1234 / mepila7915@lege4h.com
				searchEngine = "017944666033550212559:c1vclesecjc", // full web engine
				url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngine}&gl=us&q=${find}`;

			function score(src,ref) {
				var
					s = src.replace(/[,:\.]/g," ").replace(/  /g," ").toLowerCase().split(" "),
					r = ref.replace(/[,:\.]/g," ").replace(/  /g," ").toLowerCase().split(" "),
					cnt = 0;

				s.forEach( (src,n) => cnt += (src == r[n]) ? 1 : 0 );
				return cnt/r.length;		
			}

			if ( type == "help") 
			return res("Execute open-source search for a document find = NAME against search engines.");

			if ( find ) 
				Fetch( url , txt => {
					var hits = [];

					try {
						var 
							json = JSON.parse(txt),
							info = {
								searchTime: json.searchInformation.searchTime,
								results: json.searchInformation.totalResults
							};

						json.items.forEach( item => {
							var 
								map = item.pagemap || {},
								tags = map.metatags || [],
								meta = tags[0] || {};

							hits.push({
								title: item.title,
								snippet: item.snippet,
								author: meta.author,
								source: meta["article:publisher"]
							});
						});
					}
					catch (err) {
					}

					hits.forEach( hit => {
						hit.score = score(hit.title, find);
					});

					res(hits);
				});

			else
				res( new Error("missing find parameter") );
		},

/**
Search of multiple files 
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		searches: (req,res) => {
			const 
				{ sql, query, type } = req,
				//{ getList, Fetch } = FLEX,
				{ file, find, out, htmlout } = query,
				[x,name,Type] = (file||"").match(/(.*)\.(.*)/) || [],
				path = "/config/stores/" + file,
				save = "/config/uploads/" + name + (htmlout ? ".html" : ".txt");

			Trace(name,Type,path,save);

			if ( type == "help" ) 
			return res("Execute open-source searches for document find = NAME against search engine and save results to specified file = NAME.");

			if ( file ) 		
				switch ( Type ) {
					case "news":
						/*
						Google api:
							https://github.com/googleapis/google-api-nodejs-client#installation
							https://developers.google.com/custom-search/v1/using_rest
							https://developers.google.com/custom-search/v1/introduction

						Google console to CSEs:
							https://cse.google.com/cse/setup/basic?cx=017944666033550212559%3Ac1vclesecjc

						Google account and api key:
							account: "nowhere stan" / nowhere1234 / mepila7915@lege4h.com
							key: AIzaSyAIP4VvzppRtiz0MvZ1WxTLG8s_Zw5T2ms
						*/
						var
							hits = [];

						const
							CSEs = {
								full: "017944666033550212559:c1vclesecjc",
								drudge: "017944666033550212559:xrgqwdccet4"
							},
							searchEngine = CSEs[name],
							apiKey = "AIzaSyBp56CJJA0FE5enebW5_4mTssTGaYzGqz8", 
							url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngine}&gl=us&q=${find}`,
							fmts = {
								std: "rank(${score}) hit(${hit}) ${tag(title,link)}"
							};

						if ( searchEngine )
							Fetch( url , txt => {

								try {
									var 
										json = JSON.parse(txt),
										info = {
											searchTime: json.searchInformation.searchTime,
											results: json.searchInformation.totalResults
										};

									//Trace( json.items[0] );

									json.items.forEach( (item,n) => {
										var 
											map = item.pagemap || {},
											tags = map.metatags || [],
											meta = tags[0] || {};

										if ( !n ) Trace( JSON.stringify( item) );							
										Trace(n,item.title,"=>", item.title.trimGoogle() );

										hits.push({
											title: item.title.trimGoogle(),
											snippet: item.snippet,
											author: meta.author,
											link: item.link,
											hit: n,
											source: meta["article:publisher"]
										});
									});
								}
								catch (err) {
								}

								find.trimGoogle().align(hits, hit => hit.title);

								if (out) {
									hits.forEach( (hit,n) => {
										hits[n] = (fmts[out]||out).parse$(hit);
									});
									hits = hits.join(",");
								}

								else
								if (htmlout) {
									hits.forEach( (hit,n) => {
										hits[n] = (fmts[htmlout]||htmlout).parse$(Copy(hit, {
											tag: (a,b) => a.link(b)
										}));
									});
									hits = hits.join("<br>");
								}

								else
									hits = JSON.stringify(hits);

								res(hits);						
								//FS.writeFile( save, JSON.stringify(hits), "utf-8", err => {} );
							});

						else
							res( new Error("bad search engine specified") );

						break;

					case "list":
						//req.type = "html";
						res( "claim results "+"here".link(save.substr(1)) );

						FS.writeFileSync(save,"","utf-8", err => {});

						getList( path, {batch: 100, keys: ["file"]}, recs => {
							if ( recs )
								recs.forEach( rec => {
									Fetch( `http:/read?file=${rec}`, txt => {
										FS.appendFile(save, txt, "utf-8", err => {});
									});
								});

							else
								Trace("done!");
						});

						break;

					default:
						if ( readers )
							if ( reader = readers[Type] ) 
								reader( path, txt => {
									//FS.writeFile(save,txt,"utf-8",err => {});
									res(txt);
								});	

							else
								res( new Error("no reader for specified file") );
				}

			else
				res( new Error("no file specified") );

		},

/**
Word statistics
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		words: (req,res) => {
			const
				{ sql, query, type } = req,
				{ src, keys, N } = query,
				//keys = keys || "").split(",") : null,
				_keys = (keys || "").split(","),
				vocab = {},
				hack = txt => txt.toLowerCase().split(" "),
				search = new RegExp("^"+src+"(.*).txt$"),
				words = [];

			if ( type == "help" ) 
			return res(`
Using the Porter-Lancaster stemmer, respond with a count of matched and unmatched words by comparing N 
randomlly selected documents from stores/SOURCE*.txt with its associated src = SOURCE database documents 
at the specified keys = KEY,... 
`);

			var
				matches = [],
				scans = 0;

			Trace(src,_keys,N);

			if ( src )
				Fetch( "file:/config/stores/", files => {

					files.forEach( file => {
						var [matched,evid] = file.match(search) || [] ;
						if ( matched ) 
							matches.push( {evid: evid, file: `./config/stores/${file}`} );
					});

					if ( N ) matches = matches.slice(0,N);

					Trace(matches);
					matches.forEach( match => {

						FS.readFile( match.file, "utf-8", (err,text) => {
							if (!err) 
								sql.query("SELECT * FROM app.?? WHERE ? LIMIT 1", ["gtd",{evid: match.evid}], (err,recs) => {
									//Trace(err);
									var
										rec = recs[0] || {};

									_keys.forEach( key => {
										if ( w = rec[key] )
											hack(w.replace(/\//g," ")).forEach( w => {
												if ( w ) {
													let s = stemmer(w);
													if ( !(s in vocab) ) 
														vocab[s] = s+"/"+w.substr(s.length);
												}
											});
									});

									if ( text )
										hack(text.replace(/[\.\;\:\"\,\(\)\-\'\n\r]/g," ")).forEach( w => {
											if (w) words.push( stemmer(w) );
										});

									if ( ++scans == matches.length ) res( [vocab,words] );
								});
						});				
					});

					if ( !matches.length ) res( [] );
				});

			else
				res( new Error("missing src parameter") );
		},

		// image tiles

/**
WMS
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		wms: (req,res) => {

			const
				{sql,query,type} = req,
				{src} = query;

			if ( type == "help" ) 
			return res("Provided image catalog service for src = dglobe | omar | ess.");

			res(errors.ok);
			switch (src) {
				case "dglobe":
				case "omar":
				case "ess":
				default:
			}

			if ( url = ENV[`WMS_${src.toUpperCase()}`] ) 
				Fetch(url.tag("?", query), rtn => Trace("wms returned", rtn) );
		},

/**
WFS
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		wfs: (req,res) => {  //< Respond with ess-compatible image catalog
			const
				{ sql, query, type } = req,
				chip = {	// chip attributes
					width: query.width || 100, // chip pixels lat,
					height: query.height || 100, // chip pixels lon,
					srs: "epsg%3A4326",
					format: "image/jpeg"
				},
				ring = query.ring || [],		// aoi ring
				chipper = "wms",  // wms || jpip || wmts
				src = (query.src || "").toUpperCase();	// catalog service

			if ( type == "help" ) 
			return res(`
Respond with ess-compatible image catalog for service src = dglobe | omar | ess and 
desired ring = [ [lat,lon], ....]
`);

			switch (src) {
				case "DGLOBE":
				case "OMAR":
				case "ESS":
				default:
					//query.geometryPolygon = JSON.stringify({rings: JSON.parse(query.ring)});  // ring being monitored
					query.geometryPolygon = JSON.stringify({rings: ring});  // ring being monitored
			}

			delete query.src;

			if ( url = ENV[`WFS_${src}`] )
				Fetch( url.tag("?", query), cat => {  // query catalog for desired data channel
					if ( cat = cat.parseJSON() ) {
						switch ( src ) {  // normalize cat response to ess
							case "DGLOBE":
								// tbd
							case "OMAR":
								// tbd
							case "ESS":
								var
									recs = ( cat.GetRecordsResponse || {SearchResults: {}} ).SearchResults,
									collects = recs.DatasetSummary || [],
									sets = [];

								collects.forEach( collect => {  // pull image collects from each catalog entry

									//Trace(collect);
									var 
										image = collect["Image-Product"].Image,
										imageID = image.ImageId.replace(/ /g,""),
										sun = image["Image-Sun-Characteristic"] || {SunElevationDim: "0", SunAzimuth: "0"},
										restrict = collect["Image-Restriction"] || {Classification: "?", ClassificationSystemId: "?", LimitedDistributionCode: ["?"]},
										raster = image["Image-Raster-Object-Representation"],
										region = collect["Image-Country-Coverage"] || {CountryCode: ["??"]},
										atm = image["Image-Atmospheric-Characteristic"],
										urls = {
											wms: collect.WMSUrl,
											wmts: collect.WMTSUrl,
											jpip: collect.JPIPUrl
										};

									if (urls.wms)  // valid collects have a wms url
										sets.push({	
											imported: new Date(image.ImportDate),
											collected: new Date(image.QualityRating),
											mission: image.MissionId,
											sunEl: parseFloat(sun.SunElevationDim),
											sunAz: parseFloat(sun.SunAzimuth),
											layer: collect.CoverId,
											clouds: atm.CloudCoverPercentageRate,
											country: region.CountryCode[0],
											classif: restrict.ClassificationCode + "//" + restrict.LimitedDistributionCode[0],
											imageID: imageID,
													// "12NOV16220905063EA00000 270000EA530040"
											mode: image.SensorCode,
											bands: parseInt(image.BandCountQuantity),
											gsd: parseFloat(image.MeanGroundSpacingDistanceDim)*25.4e-3,
											wms: urls[chipper]
													.replace("http:", "wget:")
													.replace("https:", "wgets:")
													.replace(
														"?REQUEST=GetCapabilities&VERSION=1.3.0",
														"?request=GetMap&version=1.1.1")

													.tag("&", chip)
													+ "////"	// wget output path
													+ paths.chips + imageID
										});

								});
							}

						res( sets );
					}

					else
						res( "" );
				});	

			else
			if ( src == "SPOOF" ) // spoof
				res([{			
					imported: new Date(),
					collected: new Date(),
					mission: "debug", //image.MissionId,
					sunEl: 0, //parseFloat(sun.SunElevationDim),
					sunAz: 0, //parseFloat(sun.SunAzimuth),
					layer: "debug", //collect.CoverId,
					clouds: 0, //atm.CloudCoverPercentageRate,
					country: "XX", //region.CountryCode[0],
					classif: "", //restrict.ClassificationCode + "//" + restrict.LimitedDistributionCode[0],
					imageID: "ddxxxyymmmmxxxxxEAnnnnn xxxxxEAnnnnnn",
							// "12NOV16220905063EA00000 270000EA530040"
					mode: "XX", //image.SensorCode,
					bands: 0, //parseInt(image.BandCountQuantity),
					gsd: 0, //parseFloat(image.MeanGroundSpacingDistanceDim)*25.4e-3,
					wms: "" + "////" + paths.chips + "spoof.jpg"	
					/*{
					GetRecordsResponse: {
						SearchResults: {
							DatasetSummary: [{
								"Image-Product": {
									Image: {
										ImageId: "spoof",
										"Image-Sun-Characteristic": {
											SunElevationDim: "0", 
											SunAzimuth: "0"
										},
										"Image-Raster-Object-Representation": [],
										"Image-Atmospheric-Characteristic": []
									},
									"Image-Restriction": {
										Classification: "?", 
										ClassificationSystemId: "?", 
										LimitedDistributionCode: ["?"]
									},
									"Image-Country-Coverage": {
										CountryCode: ["??"]
									}
								},
								WMSUrl: ENV.SRV_TOTEM+"/shares/spoof.jpg",
								WMTSUrl: "",
								JPIPUrl: ""
							}]
						}
					}
				} */
				}]);

			else
				res( "" );
		},

/**
Provide image tips.
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		tips: (req, res) => {
			const
				{sql, log, query, type} = req;

			if ( type == "help" ) 
			return res("Provide image tips found by detectors");

			sql.query(
				"SELECT *, "
				+ "count(detects.ID) AS weight, "
				+ "concat('/tips/',chips.ID,'.jpg') AS tip, "
				+ "concat("
				+ 		"linkquery('O', 'https://ldomar.ilabs.ic.gov/omar/mapView/index',concat('layers=',collects.layer)), "
				+ 		"linkquery('S', '/minielt.view',concat('src=/chips/',chips.name))"
				+ ") AS links, "
				+ "datediff(now(),collected) AS age "
				+ "FROM openv.detects "
				+ "LEFT JOIN openv.chips ON MBRcontains(chips.address,detects.address) "
				+ "LEFT JOIN openv.collects ON collects.ID = chips.collectID "
				+ "LEFT JOIN openv.detectors ON detectors.name = detects.label "
				+ "WHERE least(?,1) "
				+ "GROUP BY detects.address "
				+ "ORDER BY detects.made DESC "
				+ "LIMIT 0,400", 
				guardQuery(query,true), 
				(err, recs) => {

					if (err)
						Trace("tips",[err,q.sql]);
					
					else
						recs.forEach( (rec,id) => {
							rec.ID = id;
							rec.lat = rec.address[0][0].x*180/Math.PI;
							rec.lon = rec.address[0][0].y*180/Math.PI;
							//delete rec.address;
						});

					res(err || recs);
			});
		},

		// web links

/**
Track web links.
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		follow: (req,res) => {  // follow a link
			const {sql,query,type} = req;

			if ( type == "help" ) 
			return res("Track client's link selections.");

			res(errors.ok);

			sql.query("INSERT INTO openv.follows SET ? ON DUPLICATE KEY UPDATE Count=Count+1,Event=now()", {
				Goto: query.goto.split("?")[0], 
				Client: query.client,
				View: query.view,
				Event: new Date(),
				Count: 1
			});
		},

		// quizes

/**
Proctor quizes.
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		proctor: (req,res) => {  //< grade quiz results
			const 
				{sql, query, client, type} = req;

			if ( type == "help" ) 
			return res("Grade a clients lesson = PART.PART... in module = ID.");

			const 
				parts = query.lesson.split("."),
				topic = parts[0],
				mod = parseInt( parts[1] ) || 1,
				set = parseInt( parts[2] ) || 1,
				mods = query.modules || 1,
				passed = query.score >= query.pass;

			//Trace(query.score, query.pass, [topic, set, mod, mods].join("."));

			sql.query("INSERT INTO openv.quizes SET ? ON DUPLICATE KEY UPDATE Tries=Tries+1,?", [{
				Client: client,
				Score: query.score,
				Topic: topic,
				Module: mod,
				Set: set,
				Pass: query.pass,
				Taken: new Date(),
				Tries: 1
			}, {
				Score: query.score,
				Pass: query.pass,
				Taken: new Date()
			}], err => {

				sql.forAll(
					"",
					"SELECT count(ID) AS Count FROM openv.quizes WHERE Score>Pass AND least(?) GROUP BY Module", 
					{Client:client, Topic:topic}, 
					function (recs) {

						var certified = recs.length >= mods;

						res( `Thank you ${client} - ` + (
							certified 
							? "you completed all modules - your certificate of completion will be emailed"

							: passed 
								? `you passed set ${set} of module ${mod}-${mods}!`
								: "please try again" 
						));

						if ( certified ) {
							sql.query(
								"UPDATE openv.quizes SET Certified=now() WHERE least(?)", 
								{Client:client, Topic:topic} ).end();

							sendMail({
								to: client,
								subject: `${site.nick} sends its congradulations`,
								body: 
									`you completed all ${topic} modules and may claim your `
									+ "certificate".tag("a", {href:`/config/stores/cert_${topic}_${client}.pdf`})
							}, sql );
						}

				});

			});
		},

		// files

/**
Upload files to upload area
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		uploads: fileUpload,
		
/**
Upload files to stores area
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		stores: fileUpload, 

/**
Update like-us stats
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		likeus: (req, res) => {
			const
				{sql, loq, query, type, profile, client} = req,
				{pocs} = site,
				user = {
					expired: "your subscription has expired",
					0: "elite",
					1: "grand",
					2: "wonderful",
					3: "better than average",
					4: "below average",
					5: "first class",
					default: "limited"
				};

			if ( type == "help") 
			return res("Credit client's profile with a like" );

			sendMail({
				to: pocs.admin,
				subject: req.client + " likes " + site.title + " !!", 
				body: "Just saying"
			}, sql );

			if ( profile.Credit ) {
				sql.query(
					"UPDATE openv.profiles SET Challenge=0,Likeus=Likeus+1,QoS=greatest(QoS-1,0) WHERE ?",
					{Client:req.client}
				);

				profile.QoS = Math.max(profile.QoS-1,0);  // takeoff 1 sec
				var qos = user[Math.floor(profile.QoS)] || user.default;
				res( `Thanks ${client} for liking ${site.nick} !  As a ${qos} user your ` 
					+ "QoS profile".link('/profile.view')
					+ " may have improved !" )	
			}

			else
				res( `Thanks ${req.client} for liking ${site.nick} but ` + user.expired.link('/fundme.view') + " !" );

		},

/**
Return list of clients that have used this service
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		users: (req, res) => {
			const
				{sql, query, type } = req;

			if ( type == "help" ) 
			return res("returns list of users");

			sql.query("SELECT ID,Connects,Client AS Name, Location AS Path FROM openv.sessions WHERE least(?,1) ORDER BY Client", 
				guardQuery(query,true),
				(err, recs) => res(err || recs) );
		},

/**
Retrieve [requested neo4j graph](/api.view#sysGraph).

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		graphs: function (req,res) {
			const 
				{ query, sql, table, type } = req,
				{ name, idmode } = query,
				mode = idmode || "name",
				net = name || "anet",
				{ PI,cos,sin } = Math,
				nodes = [], 
				links = [],
				types = {
					black: "red",
					white: "blue",
					explosives: "red",
					firearms: "green",
					incendiary: "blue"
				};

			if ( type == "help" )
			return res("Return graph name = NAME:NAME: ... & idmode = name||hat" );

			//Trace(">>>get", net);
			
			neoThread( neo => {			
//Log("graph", neo, neo.cypher);
				if ( net.indexOf("cnet")>=0 )
					neo.cypher( `MATCH (a:${net})-[r]->(b:${net}) RETURN r,a,b ORDER BY r.cutsize`, {}, (err,recs) => {

						const poly = [];

						//Trace(">>>err",err);
						//Trace(">>>rel", JSON.stringify(recs[0]));
						//Trace(recs);

						for ( var n=0, rad=1, rec=recs[n] ; rec; rad++, rec=recs[n+=deg] ) {

							const
								{r,a,b} = rec,
								{cutsize,maxflow} = r.properties,
								pts = [];
							var
								deg = 0;

							for ( ; 
									rec && (rec.r.properties.cutsize == cutsize); 
									rec=recs[n+deg], deg++ );

							//Trace(n, deg, recs.length, rec, cutsize, maxflow);

							for (var d=0,u=2*PI/deg,rec=recs[n]; d<deg; d++,rec=recs[n+d] )
								pts.push({
									x: rad*cos(d*u),
									y: rad*sin(d*u),
									tag: rec ? rec.r.properties.name : "end"
								});

							poly.push({	
								name: `cutsize ${cutsize} maxflow ${maxflow}`,
								points: pts
							});
						}

						//Trace(">>>>>>>>>>>poly",poly);
						res(poly);
					});

				else
					neo.cypher( `MATCH (n:${net}) RETURN n`, query, (err,recs) => {
						//Trace(">act", recs[0]);
						recs.forEach( rec => {
							const 
								props = rec.n.properties,
								{type,size,created} = props;

							nodes.push({
								id: props[mode], 
								group: types[type] || type,
								size: size,
								created: created
							});
						});

						neo.cypher( `MATCH (a:${net})-[r]->(b:${net}) RETURN r,a,b`, {}, (err,recs) => {
							//Trace(">rel", recs[0]);

							recs.forEach( rec => {
								const 
									{r,a,b} = rec,
									aprops = a.properties,
									bprops = b.properties,
									{type,capacity,created} = r;

								links.push({	
									source: aprops[mode],
									target: bprops[mode],
									value: types[ (type||"").toLowerCase() ] || type,
									created: created,
								});
							});

							res({
								nodes: nodes,
								links: links
							});
						});
					});
			});
		},

		favicon: function (req,res) {   // extjs trap
			res("No icons here"); 
		},

		// notebooks

/**
Return published notebooks
@param {Object} req Totem session request
@param {Function} res Totem session response		
*/
		notebooks: (req,res) => {
			const
				{sql,query,type} = req,
				plugins = [];

			//Trace(query, isEmpty(query) );
			if ( type == "help" ) 
			return res("Return list of notebooks and their methods.");

			sql.query(
				"SELECT engines.Name, engines.Type, projects.JIRA, projects.Title  "
				+ "FROM openv.engines LEFT JOIN openv.projects ON projects.Name=engines.Name "
				+ ( isEmpty(query) 
						? "WHERE Enabled ORDER BY Type,Name"
						: "WHERE Enabled AND least(?,1) ORDER BY Type,Name" ),
				[query], (err,engs) => {

				if ( err ) 
					res( err );

				else {
					engs.forEach( (eng,id) => {
						const
							{ Name,JIRA,RAS,Title,Type } = eng;

						//if ( eng.Type != "jade" && eng.Name.indexOf("demo")<0 )
						plugins.push({
							Name: Name,
							Type: Type,

							Use: `/${Name}.use`.link(`/${Name}.use`),
							Run: `/${Name}.run`.link(`/${Name}.run`),
							View: `/${Name}.view`.link(`/${Name}.view`),
							Help: `/${Name}.tou`.link(`/${Name}.tou`),
							Tx: `/${Name}.status`.link(`/${Name}.status`),
							Publish: `/${Name}.pub`.link(`/${Name}.pub`),
							Get: `/${Name}.${Type}`.link(`/${Name}.${Type}`),
							Brief: `/${Name}.brief`.link(`/${Name}.brief`),
							Stores: `/${Name}.stores`.link( `/${Name}.stores` ),
							/*
							use: `use`.link(`/${Name}.use`),
							run: `run`.link(`/${Name}.run`),
							view: `view`.link(`/${Name}.view`),
							help: `help`.link(`/${Name}.tou`),
							tx: `txstatus`.link(`/${Name}.status`),
							publish: `publish`.link(`/${Name}.pub`),
							get: `get`.link(`/${Name}.${Type}`),
							brief: `brief`.link(`/brief.view?options=${Name}`),
							*/

							Repo: `/public/${Type}/${Name}.js`,
							JIRA: (JIRA||"").link(ENV.JIRA),
							RAS: (RAS||"").link(ENV.RAS),
							Task: (Title||"").link("/projects.view")
						});
						/*
						sql.query("SHOW TABLES FROM ?? WHERE ?", [
							req.group, {tables_in_app: eng.Name}
						], function (err,recs) {

							if ( !err && recs.length) 
								plugins.push( {
									ID: plugins.length,
									Name: eng.Name.tag("a",{href:"/"+eng.Name+".run"}) 
								});

							if (n == engs.length-1) res( plugins );
						}); */
					});
					res( plugins );
				}
			});
		},

		/*
		usagePlugin: function (req,res) {
			const { query, sql, table, type } = req;

			sql.query(
				"SELECT Name, Type, JIRA, RAS, Task "
				+ "FROM openv.engines LEFT JOIN openv.milestones ON milestones.Plugin=engines.Name "
				+ "WHERE ? LIMIT 1",
				[{Name: table}], (err,engs) => {

				if ( err ) 
					res( errors.noWorker );

				else
				if ( eng = engs[0] )
					res([
						`/${eng.Name}.use`.tag("a",{href: `/${eng.Name}.use`}),
						`/${eng.Name}.run`.tag("a",{href: `/${eng.Name}.run`}),
						`/${eng.Name}.view`.tag("a",{href: `/${eng.Name}.view`}),
						`/${eng.Name}.tou`.tag("a",{href: `/${eng.Name}.tou`}),
						`/${eng.Name}.status`.tag("a",{href: `/${eng.Name}.status`}),
						`/${eng.Name}.pub`.tag("a",{href: `/${eng.Name}.pub`}),
						`/${eng.Name}.${eng.Type}`.tag("a",{href: `/${eng.Name}.${eng.Type}`}),
						`/briefs.view?options=${eng.Name}`.tag("a",{href: `/briefs.view?options=${eng.Name}`}),
						(eng.JIRA||"").tag("a",{href:ENV.JIRA}),
						(eng.RAS||"").tag("a",{href:ENV.RAS}),
						(eng.Task||"").tag("a",{href:"/milestones.view"})
					].join(" | ") );

				else
					res( errors.noEngine );
			});

		}, */

		// system mgt

/**
Endpoint to ingest a source into the sql database

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		ingest: (req,res) => {

			function ingest( opts, query, cb ) {
				try {
					if (url = opts.url)
						switch (url.constructor.name) {
							case "String":
								Fetch( ("http://"+url).tag("?", query), data => {
									if ( evs = data.parseJSON( [ ] ) ) 
										cb( opts.get ? evs.get(opts.get) : evs );
								});
								break;

							case "Function":
								url( evs => cb( opts.get ? evs.get(opts.get) : evs ) );
								break;

							case "Array":
								cb( opts.get ? url.get(opts.get) : url );
								break;
						}
				}

				catch(err) {
					Trace("INGEST FAILED",err);
				}
			}		

			const 
				{ sql, query, body, type } = req,
				{ fileID, src } = query,
				{ ingester } = TOTEM;

			if ( type == "help" )
			return res("Run the src = NAME ingestor against the specified fileID = BRICK." );

			Trace("INGEST", query, body);
			res("ingesting events");

			if (fileID) {
				//sql.query("DELETE FROM openv.events WHERE ?", {fileID: fileID});

				sql.query("SELECT Class FROM openv.bricks WHERE ?", {ID: fileID})
				.on("result", file => {
					if ( opts = EAT[src] )   // use builtin src ingester (event eater)
						ingest( opts, query, evs => {
							ingestList( sql, evs, fileID, file.Class, aoi => {
								Trace("INGESTED", aoi);
							});
						});

					else  // use custom ingester
						sql.query("SELECT _Ingest_Script FROM openv.bricks WHERE ? AND _Ingest_Script", {ID: fileID})
						.on("results", file => {
							if ( opts = JSON.parse(file._Ingest_Script) ) 
								ingest( opts, query, evs => {
									ingestList( sql, evs, fileID, file.Class, aoi => {
										Trace("INGESTED", aoi);	
									});
								});
						});
				});
			}
		},

/**
Endpoint to return release information about requested license.

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		decode: (req,res) => {
			const 
				{ sql,query, type } = req,
				{ License,license } = query;

			if ( type == "help" )
			return res("Return release information about the license = ID." );

			sql.query("SELECT Master,releases.* FROM openv.masters LEFT JOIN openv.releases ON releases._License = masters.License WHERE ?", {
				License: License || license
			}, (err, recs) => {
				if (rec = recs[0]) {
					var info = Copy(rec,{});
					delete info.Master;
					res( [info].gridify() + "<br>" + rec.Master );
				}

				else
					res(err);
			});
		},

/*
Endpoint to restart totem if authorized.

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/* restart: (req,res) => {
			const
				{sql,query,type,client,profile} = req,
				{ delay, msg } = query;

			if ( type == "help" )
			return res("Restart system after a delay = SECONDS and notify all clients with the specifed msg = MESSAGE.");

			//Trace(client,profile);
			if ( profile.Admin ) {
				res( errors.ok );

				query.msg = msg || `System restarting in ${delay} seconds`;

				byNode.alert(req, msg => Trace( msg ) );

				setTimeout( () => {
					Trace( "restart*", req );
					process.exit();
				}, (delay||10)*1e3);
			}

			else
				res( errors.noPermission );
		},  */

/*
Endpoint to send notice to outsource jobs to agents.

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/*agent: (req,res) => {
			const
				{sql,query,type} = req,
				{push,pull,flush,load,save,args} = query;

			if ( type == "help" )
			return res( `
Append a job or claim a job to/from an agent job queue where:
push = NAME of job to append to agent queue
pull = NAME of job to claim from agent queue
flush = NAME of matlab thread to flush
load = CLIENT.HOST.CASE to load
save = CLIENT.HOST.CASE to save
` );

			if (push) 
				CRYPTO.randomBytes(64, (err, jobid) => {

					try {
						//var Args = JSON.parse(args);
						res( jobid.toString("hex") );
					}
					catch (err) {
						res( "" );
					}

				});

			else
			if (pull) {
				var jobid = query.jobid;

				if (jobid) 
					res( {result: 123} );

				else
					res( "Missing jobid" );
			}

			else
			if ( flush )
				ATOM.matlab.flush(sql, flush);

			else
			if ( load ) {
				var
					parts = load.split("_"),
					id = parts.pop(),
					plugin = "app." + parts.pop(),
					results = ATOM.matlab.path.save + load + ".out";

				Trace("SAVE MATLAB",query.save,plugin,id,results);

				FS.readFile(results, "utf-8", function (err,json) {

					sql.query("UPDATE ?? SET ? WHERE ?", [plugin, {Save: json}, {ID: id}], err => {
						Trace("save",err);
					});

				});	
			}

			else
			if ( save ) {
				const 
					[client,host,usecase] = save.split(".");

				sql.forFirst("agent", "SELECT * FROM openv.agents WHERE ? LIMIT 1", {queue: save}, agent => {

					if (agent) {
						sql.query("DELETE FROM openv.agents WHERE ?", {ID: agent.ID});

						if ( evs = JSON.parse(agent.script) )
							sql.getContext("app."+host, {Name: usecase}, ctx => {
								if ( ctx ) {
									ctx.Save = evs;
									res( sql.saveContext( ctx ) );
								}
								
								else
									res( new Error("No such notebook") );
							});

						else
							res( errors.badAgent );
					}

					else
						res( errors.badAgent );

				});

			}

			else
				res( errors.badAgent );

		}, */

/*
Endpoint to send notice to all clients

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/*
		alert: (req,res) => {
			const
				{sql,query,type,client,prog} = req,
				{ msg } = query,
				{ sio } = DEBE.secureIO;

			if ( type == "help" )
			return res("Send an alert msg = MESSAGE to all clients." );

			if ( prof.Admin ) {
				if (sio)
					sio.emit("alert",{msg: msg || "hello", to: "all", from: client});

				//Trace(msg, req);
				res(errors.ok);
			}

			else 
				res( errors.noPermission );
		}, */

/*
Endpoint to send emergency message to all clients then halt totem

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/* stop: (req,res) => {

			const
				{type,query} = req,
				{sio} = DEBE.socketIO;

			if (type == "help")
			return res("Stop the service");

			if (sio)
				sio.emit("alert",{msg: query.msg || "system halted", to: "all", from: site.nick});

			res("Server stopped");
			process.exit();
		}, */

/**
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		devstatus: (req, res) => {
			function statRepo(sql) {
				var lookups = {
					issues: "Action",
					default: "Special"
				};		

				Trace("STAT REPO");

				CP.exec(
					'git log --reverse --pretty=format:"%h||%an||%ce||%ad||%s" > gitlog', 
					(err,log) => {

					FS.readFile("gitlog", "utf-8", (err,logs) => {

						logs.split("\n").forEach( log => {

							var	
								parts = log.split("||"),
								info = {	
									hash: parts[0], 
									author: parts[1],
									email: parts[2],
									made: new Date(parts[3]),
									cm: parts[4]
								},
								tags = info.cm.split("#"),
								cm = tags[0];

							if ( tags.length == 1 ) tags = tags.concat("issues 116");

							for (var n=1,N=tags.length; n<N; n++) { 	// update tagged tables

								var	parts = tags[n].split(" "),
									note = { },
									table = parts[0];

								note[ lookups[table] || lookups.default ] = cm + " on " + info.made + " by " + info.author.tag("a",{href:"mailto:"+info.email});

								for (var k=1,K=parts.length; k<K; k++) {
									var id = parts[k];

									if (id)
										sql.query("UPDATE openv.?? SET ? WHERE ?", [
											table, 
											note,
											parseInt(id) ? { ID: id } : { Num: id }
										]);
								}
							}

						});
					});		
				});

				// sql.query("UPDATE features SET Ad=1 WHERE NOT ad");

				/*
				READ(FLEX.NEWREAD.URL, function(err, articles) {
					if (err)
						console.info("Ignoring news reader "+FLEX.NEWREAD.URL);
					else
						articles.each( function (n,article) {
							// "title"     - The article title (String).
							// "author"    - The author's name (String).
							// "link"      - The original article link (String).
							// "content"   - The HTML content of the article (String).
							// "published" - The date that the article was published (Date).
							// "feed"      - {name, source, link}

							// if this is a foreign feed, we can set args to ("change", associated file)
							if (FLEX.NEWREAD.JOB)
								FLEX.NEWREAD.JOB( sql, "feed", article.link);
						});
				}); */
			}

			const {sql,log,query,type} = req;

			if (type == "help")
			return res("Provide issues being worked via repo");

			res(SUBMITTED);
			statRepo(sql);	
		},

/*
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		/*
		milestones: (req, res) => {
			const 
				{sql,log,query,type} = req,
				map = {SeqNum:1,Num:1,Hours:1,Complete:1,Task:1},
				{xlsx} = readers || {};

			if (type == "help")
			return res("Provide milestone status information");

			for (var n=0;n<=10;n++) map["W"+n] = 1;

			sql.query("DELETE FROM openv.milestones");
			
			xlsx( sql, "milestones.xlsx","stores", rec => {
				for (var n in map) map[n] = rec[n] || "";

				sql.query("INSERT INTO openv.milestones SET ?",map, err => Trace(err) );
			});

			res(SUBMITTED);
		},	*/

/**
Configure DEBE/TOTEM.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		config: (req,res) => {
			const 
				{sql,query,type} = req,
				{mod} = query;

			if ( type == "help" ) 
			return res(`
Respond with system configuration information on requested module mod = NAME or all modules if unspecified.
`);

			if (mod) 
				CP.exec(`cd ../${mod}; npm list`, (err,cfg) => {			
					var info = "";

				cfg.split("\n").forEach( sw => {
					sw = escape(sw)
						.replace(/\%u2502/g,"")
						.replace(/\%u2500/g,">")
						.replace(/\%u251C/g,"")
						.replace(/\%u252C/g,"")
						.replace(/\%u2514/g,"")
						.replace(/\%0A/g,"")
						.replace(/\%20/g,"");

					info += sw + "<br>";
				});

				res(info);
			});		

			else 
				Fetch( "http:/config?mod=man", man => {
				Fetch( "http:/config?mod=enums", en => {
				Fetch( "http:/config?mod=totem", totem => {
				Fetch( "http:/config?mod=debe", debe => {
					res({
						man: man,
						enum: en,
						flex: flex,
						totem: totem,
						debe: debe
					});
				}); }); }); });
			
			return DEBE;
		},

/**
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
		info: (req,res) => {
			function toSchema( path, obj ) {
				if ( isObject(obj) ) {
					var objs = [];
					Each(obj, (key,val) => {
						var next = path+"/"+key;

						if (val)
							switch (val.constructor.name) {
								case "String":
									if ( val.startsWith("<") )
										objs.push({
											name: key, 
											value: 10,
											doc: next + ": " + val ,
											children: toSchema(next, val)
										});

									else
									if ( val.startsWith("http") || val.startsWith("mailto") )
										objs.push({
											name: key, 
											value: 10,
											doc: next + ": " + key.link( val ),
											children: toSchema(next, val)
										}); 

									else
									if ( val.startsWith("/") )
										objs.push({
											name: key, 
											value: 10,
											doc: next + ": " + key.link( val ),
											children: toSchema(next, val)
										}); 

									else
										objs.push({
											name: key, 
											value: 10,
											doc: next + ": " + val,
											children: toSchema(next, val)
										}); 

									break;

								case "Array":
									objs.push({
										name: key + `[${val.length}]`, 
										value: 10,
										doc: next,
										children: toSchema(next, val)
									}); break;

								case "Object":
									objs.push({
										name: key + ".", 
										value: 10,
										doc: next,
										children: toSchema(next, val)
									}); break;

								case "Function":
									objs.push({
										name: key + "(...)", 
										value: 10,
										doc: next.link( "/api.view" ),
										children: []
									}); break;

								default:
									objs.push({
										name: key, 
										value: 10,
										doc: "",
										children: []
									}); break;
							}
					});
					return objs;
				}

				else 
					return [];
			}

			const
				{sql,query,type} = req,
				pathPrefix = site.master,
				libs = {
					misc: {},
					generators: {},
					regressors: {
						train: {},
						predict: {}
					}
				},
				tables = {}, 
				xtables = {},
				info = [];		

			var
				ID = 0;

			if ( type == "help" ) 
			return res("Respond with system information.");

			Each( $.imports, (name,ex) => {		
				if ( isFunction(ex) ) {
					var 
						parts = name.split("_"),
						reg = libs.regressors[ parts.pop() ];

					if ( reg ) 
						reg[ name ] = name;

					else
					if ( name.endsWith( "dev" ) )
						libs.generators[ name ] = name;

					else					
						libs.misc[ name ] = name;
				}
			});

			sql.getTables( "app", names => {
				names.forEach( name => {
					if ( !name.startsWith("_") )
						if ( name.indexOf("demo") < 0 )
							tables[ name ] = name.link( `/${name}` );
				});
				
				Each( byNode, name => {
					xtables[ name ] = name.link( `/${name}` );
				});

				Fetch( "file:/notebooks", plugins => {
				Fetch( "http:/config", config => {
					var plugs = {};

					plugins.parseJSON( [] ).forEach( plug => plugs[plug.Name] = plug );

					res( toSchema( "", {
						totem: {
							partners: {
								research: {
									Stanford: "https:www.stanford.edu",
									CarnegieMellon: "https:www.cmu.edu",
									PennState: "https:www.psu.edu",
									Oxford: "https:www.ox.ac.uk/",
									FloridaState: "https:www.fsu.edu",
									Maryland: "https://www.umuc.edu",
									Tsinghua: "https://www.tsinghua.edu.cn/en/index.htm",
									Peking: "http://english.pku.edu.cn/",
									Fudan: "https://www.fudan.edu.cn/en/main.psp",
									ShanghaiJaioTong: "http://en.sjtu.edu.cn/",
									ScienceAndTechnology: "https://en.ustc.edu.cn/",
									Zhejang: "https://www.zju.edu.cn/english/",
									AgencyForDefenseDevelopment: "https://en.wikipedia.org/wiki/Agency_for_Defense_Development"
								},
								software: {
									opencv: {
										torch: "https://pytorch.org/",
										tensorflow: "https://www.tensorflow.org/",
										caffe: "https://caffe.berkeleyvision.org/"
									},
									anaconda: "http://anaconda.com/distribution",							
									github: "https://github.com/996icu/996.ICU",
									npm: "https://www.npmjs.com/"				
								},
								data: {
									high: {
										irevents: "https://blitz.ilabs.ic.gov",
										financial: "https://proton.ic.gov",
										atmospherics: "https://b.nro.ic.gov",
										space: "https://bvi.ilabs.ic.gov",
										finishedIntel: "https://chome.ic.gov",
										earthchips: "https://ess.nga.ic.gov",
										airspace: "https://thresher.ilabs.ic.gov"
									},
									low: {
										airspace: "https://flightaware.com/",
										itar: "tbd",
										terrorism: "https://www.start.umd.edu/research-projects/global-terrorism-database-gtd",
										earthchips: "https://www.digitalglobe.com/",
										cartels: {
											mexican: {
												guadalajara: "x",
												sinola: {
													colima: "x",
													sonora: "x",
													artistas: "x",
													"gente nueva": "x",
													"los antrax": "x"
												},
												"beltran-leyva": {
													"los negros": "x",
													"south pacific": "x",
													"del centro": "x",
													"independence de acapulco": "x",
													"la barredora": "x",
													"el comando del diablo": "x",
													"la mano con ojos": "x",
													"la nueva administracion": "x",
													"la oficina": "x"
												},
												gulf: {
													"los zetas": "x",
													"la familia michoacana": "x",
													"knights templar" : "x",
													"los caballeros": "x"
												},
												juarez: "x",
												tijuana: "x",
												"barrio azteca": "x",
												"milenio": {
													"la resistancia": "x",
													"jalisco new generation": "x"
												}
											}
										}
									}
								},
							},
							projects: {
								RTP: "/rtpsqd.view?task=seppfm",
								JIRA: "JIRA",
								RAS: "RAS"
							},
							developers: {
								api: "/api.view",
								"skinning guide": "/skinguide.view",
								requirements: "/project.view",
								codebase: config.parseJSON(),
								repos: ENV.PLUGIN_REPO,
								login: "/shares/winlogin.rdp",
								prms: {
									debe: "/shares/prm/debe/index.html",
									totem: "/shares/prm/totem/index.html",
									atomic: "/shares/prm/atomic/index.html",
									man: "/shares/prm/man/index.html",
									//flex: "/shares/prm/flex/index.html",
									chip: "/shares/chip/man/index.html"
								}
							},
							datasets: {
								virtual: xtables,
								database: tables
							},
							notebooks: {
								libs: libs,
								published: plugs
							}
						}
					}) );
				}); });
			});	
		},

		// i/f to other services

/**
Digital globe interface.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		DG: (req, res) => {  
			const 
				{sql,log,query} = req;
			res("tbd");
		},

/**
Hydra interface.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		HYDRA: (req, res) => { // Hydra interface

			const
				{ sql,log, query,type} = req,
				args =  {		// Hydra parameters
					size: parseFloat(query.SIZE),
					pixels: parseInt(query.PIXELS),
					scale: parseFloat(query.SCALE),
					step: parseFloat(query.STEP),
					range: parseFloat(query.RANGE),
					detects: parseInt(query.DETECTS),
					infile: query.INFILENAME,
					outfile: query.OUTFILENAME,
					channel: query.CHANNEL
				};

			if ( type == "help" ) 
			return res(`
This is a legacy/reserved endpoint to run specified Hydra detection algorithms.  Parameters include
size, pixels, scale, step, range, detects, infile, outfile, channel.  This endpoint has been retired.
`);

			res("legacy");
			// Hydra args dropped in favor of detector parms attached to requested channel
			/*
			sql.query("SELECT * FROM openv.detectors WHERE ?", {Channel:query.CHANNEL})
			.on("result", function (det) {

				if (FLEX.CHIP)
				FLEX.CHIP.workflow(sql, {
					detName: det.Name.replace(/ /g,"_"),
					chanName: det.channel,
					size: det.Feature,
					pixels: det.Pixels,
					scale: det.Pack,
					step: det.SizeStep,
					range: det.SizeRange,
					detects: det.Hits,
					infile: det.infile,
					outfile: "/rroc/data/giat/swag/jobs",
					job: {
						client: req.client,
						class: "detect",
						name: det.Name,
						link: det.Name.tag("a",{href:"/swag.view?goto=Detectors"}),
						qos: req.profile.QoS,
						priority: 1
					}
				});

			});
			*/
			
		},

/**
NCL interface.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		NCL: (req, res) => { // Reserved for NCL and ESS service alerts
			const 
				{sql,log,query} = req;
			res("tbd");
		},

/**
ESS interface.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		ESS: (req, res) => { // Reserved for NCL and ESS service alerts
			const 
				{sql,log,query} = req;
			res("tbd");
		},

/**
MIDB interface.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		MIDB: (req, res) => { // Reserved for NCL and ESS service alerts
			const 
				{sql,log,query} = req;
			res("tbd");
		},
		
/**
Matlab interface.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		matlab: (req,res) => {
			const
				{sql, query, type} = req;

			if ( type == "help" ) 
			return res("Flush matlab queue");

			res("matlab queue flushed");		
		},

/**
ESC remedy interface.
@param {Object} req Totem session request
@param {Function} res Totem session response
*/		
		ESC: (req,res) => {
			const
				{sql, query, type} = req,
				{from} = query;

			if ( type == "help" ) 
			return res("Add client to class-action remedy ticket");

			res("your name has been added to the automatted, class-action remedy tickit");
			switch (from) {
				case "pmo":
				case "asp":
				case "isp":
				case "swap":
			}
		}		
	},
	
/**
/TABLE.TYPE-endpoint routers
*/			
	"byType.": {
		// doc generators
		_pdf: savePage,
		_jpg: savePage,
		_gif: savePage,
		_rtp: savePage,
		_run: savePage,
		_html: savePage,
		
		//blog: renderBlog,
		
		// skins
		proj: renderSkin,
		calc: renderSkin,
		note: renderSkin,
		view: renderSkin,
		help: renderSkin,		
		run: renderSkin,
		//plugin: renderSkin,
		//site: renderSkin,
		//brief: renderSkin,
		pivot: renderSkin,
		exam: renderSkin,
		//help: renderSkin,
		browse: renderSkin,
		rtp: renderSkin,
		
		//blog: renderSkin,
		//gridbrief: renderSkin,
		//runbrief: renderSkin,
		//pivbrief: renderSkin,
		
		// plugins (aka notebooks)
		status: statusPlugin,
		stat: statusPlugin,
		
		stores: storesPlugin,

		suitors: matchPlugin,
		match: matchPlugin,
		
		users: usersPlugin,
		
		track: trackPlugin,
		licence: trackPlugin,
		//release: trackPlugin,
		
		exe: exePlugin,
		pub: publishPlugin,
		publish: publishPlugin,
		wiki: wikiPlugin,
		
		js: getPlugin,
		py: getPlugin,
		m: getPlugin,
		me: getPlugin,
		jade: getPlugin,
		
		export: exportPlugin,
		import: importPlugin,
		//exp: exportPlugin,
		//imp: importPlugin,
		
		//blog: blogPlugin,
		
		doc: docPlugin,
		md: docPlugin,
		tou: docPlugin,
		//help: docPlugin,
		
		use: helpPlugin,
		usage: helpPlugin,
		uses: helpPlugin,
		
		reset: simPlugin,
		step: simPlugin,
		
		mod: modifyPlugin		
	},

/**
Site skinning context
*/
	"site.": { 		//< initial site context
		by: ENV.BY || "ACMESDS",
		
		explorer: {
			Root: "/root/", 
			Earth: `${ENV.URL_CESIUM}/Apps/earth.html`, 
			Graph: `${ENV.URL_NEO4J}/neo4j`, 
			Streets: `${ENV.URL_OSM}/`, 
			Process: `${ENV.URL_NODERED}/`, 
			Totem: "/brief.view?_project=totem",  
			Notebooks: "/notebooks.html", 
			API: "/api.view", 
			SkinGuide: "/skinguide.view", 
			//JIRA: ENV.JIRA || "JIRA.undefined", 
			//RAS: ENV.RAS || "RAS.undefined",
			Repo: `${ENV.URL_REPO}/`,
			Survey: "/survey.view",
			Calendar: "/calendar.view"
		},
		
		sitemap: [
			{a: "[Terms](xxx:/terms.view)" ,	
			 b: "[Issues](xxx:/issues.view)", 
			 c: "[Employee Portal](xxx:/portal.view)",
			 d: "[Facebook](https://facebook.com/?goto=totem)",
			 e: "[Leaders](xxx:/sponsors?level=leader)",
			 f: "[Federated Repo](http://github.com/totemorg/dockify)"
			},
			{a: "[Privacy](xxx:/privacy.new)",	
			 b: "[API](xxx:/api.view)",
			 c: "[Contact Us](xxx:/contact.view)",
			 d: "[Twitter](https://twitter.com/?goto=totem)",
			 e: "[Corporate](xxx:/sponsors?level=corporate)",
			 f: "[DEBE Repo](https://github.com/totemorg/debe)"
			},
			{a: "[News](xxx:/news.view)",
			 b: "[Skinning](xxx:/skinguide.view)",
			 c: "[Career Opportunities](xxx:/contact.view)",
			 d: "[Instagram](http://instagram.com?goto=totem)",
			 e: "[Platinum](http://xxx:/sponsors?level=platinum)",
			 f: "[TOTEM Repo](https://github.com/totemorg/totem)"
			},
			{a: "[Community](http://totemorg.github.io)",
			 b: "[Status](xxx:/status.view)",
			 c: "[History](http://intellipedia/swag)",
			 d: "[Telegram](https://telegram.com?goto=totem)",
			 e: "[Honorable](xxx:/sponsors?level=member)"
			},
			{b: "[Briefing](xxx:/brief.view?name=totem)",
			 d: "[SubStack](http://substack.com?goto=totem)"
			},
			{b: "[Restart](xxx:/restart) ", 
			 d: "[WeChat](http://wechat.com?goto=totem)"
			},
			{b: "[Notices](xxx:/email.view)",
			 d: "[Parler](http://Parler.com?goto=totem)"
			}
		].gridify({
			a:"Site",
			b:"Usage",
			c:"Corporate",
			d:"Follow Us",
			e:"[Sponsorships](xxx:/likeus)".linkify(),
			f:"Fork" }).replace(/xxx:/g, ""),
		
		banner: "",	// disabled
		
		JIRA: ENV.JIRA || "JIRA.undefined",
		RAS: ENV.RAS || "RAS.undefined",
		REPO: ENV.REPO || "REPO.undefined",

		reqts: {   // defaults
			js:  ["nodejs-12.14.0", "machine learning library-1.0".tag( "https://sc.appdev.proj.coe.ic.gov://acmesds/man" )].join(", "),
			py: "anconda2-2019.7 (iPython 5.1.0 debugger), numpy 1.11.3, scipy 0.18.1, utm 0.4.2, Python 2.7.13",
			m: "matlab R18, odbc, simulink, stateflow",
			R: "R-3.6.0, MariaDB, MySQL-connector"
		}
	},
	
/**
Error messages
*/
	"errors.": {  //< error messages
		pretty: err => {
			return "".tag("img",{src:"/stash/reject.jpg",width:40,height:60})
				+ (err+"").replace(/\n/g,"<br>").replace(process.cwd(),"").replace("Error:","")
				+ ". " + [
					"Issues".link( "/issues" ),
					"Browse".link( "/home/" ),
					"Site".link( "/site" ),
					"API".link( "/api" )
				].join(" || ");
		},
		ok: "ok",
		noMarkdown: new Error("no markdown"),
		noRecord: new Error("no record"),
		//noParameter: new Error("missing required parameter"),
		noPermission: new Error( "you are not authorized for this function" ),
		noPartner: new Error( "missing endservice=DOMAIN/ENDPOINT option or ENDPOINT did not confirm partner" ),
		noLicense: new Error("unpublished notebook, invalid endservice, unconfirmed endpartner, or no license available"),
		badAgent: new Error("bad agent request"),
		noOffice: new Error("office docs not enabled"),
		noContext: new Error("no notebook context") ,
		cantRun: new Error("cant run unregulated notebook"),
		noName: new Error("missing notebook Name parameter"), 
		noNotebook: new Error("no such notebook"),
		certFailed: new Error("could not create pki cert"),
		bookExists: new Error("notebook already exists"),
		bookFailed: new Error("notebook could not be created"),
		//noIngest: new Error("invalid/missing ingest dataset"),
		//badEntry: new Error("sim engines must be accessed at master url"),		
		//badRequest: new Error("bad/missing request parameter(s)"),
		//badBaseline: new Error("baseline could not reset change journal"),
		//disableEngine: new Error("requested engine must be disabled to prime"),
		//missingEngine: new Error("missing engine query"),
		//protectedQueue: new Error("action not allowed on this job queues"),
		//noCase: new Error("plugin case not found")
		//noWorker: new Error("service busy"),
		//badType: new Error("bad type"),
		//lostContext: new Error("pipe lost context"),
		//noAttribute: new Error( "undefined notebook attribute" ),
		//badEngine: new Error( "notebook improper" ),
		//noGraph: new Error( "graph db unavailable" ),
		//badDataset: new Error("dataset does not exist"),
		//noCode: new Error("notebook has no code file"),
		//badFeature: new Error("unsupported feature"),
		//noExe: new Error("no execute interface"),
		//badDS: new Error("dataset could not be modified"),
		//badLogin: new Error("invalid login name/password"),
		//failedLogin: new Error("login failed - admin notified"),
		//noUploader: new Error("file uplaoder not available")		
	},
	
/**
Paths to things
*/
	"paths.": {  //< append paths to things
		low: {
			notices: "//gold/office/office03/R/2_NonRecords/R7-Anticipatory/WeeklyUpdates/".replace(/\//g,"\\")
		},
		
		high: {
			notices: "tbd"
		},

		//xlate: "./i18n",  	//< i18n path for translation files
		
		mimes: {  // Extend mime types as needed
			rdp: "application/mstsc",
			run: "text/html",
			exe: "text/html",
			js: "text/javascript",
			py: "text/plain",
			ma: "text/plain",
			tou: "text/html",
			db: "application/json",
			pub: "",
			doc: ""
		},
		
		tou: "./jades/tou.txt",
		//notebooks: "./notebooks",
		
		skin: {
			org1: "./public/jade/Org1",
			org2: "./public/jade/Org2",
			mood1: "./public/jade/Mood1"
		},
		
		status: "file:/config/artifacts/status.csv",
		//notebooks: "file:/config/notebooks", 
		chips: "file:/chips/",
		//status: "./shares/status.xlsx",
		logins: "file:/config/shares/logins",
		newsread: "http://craphound.com:80/?feed=rss2",
		aoiread: "http://omar.ilabs.ic.gov:80/tbd",
		host: ""		
	},
	
/**
Enable to give-away plugin services
@type {boolean}
*/
	probono: true,  //< enable to run plugins unregulated
		
/**
Enabled when this is child server spawned by a master server
@type {Boolean}
*/
	isSpawned: false, 			//< Enabled when this is child server spawned by a master server

	/*
	gradeIngest: function (sql, file, cb) {  //< legacy callback cb(stats) or cb(null) if error
		
		var ctx = {
			Flow: {
				F: "tbd",
				N: file._Ingest_Actors,  // ensemble size
				T: file.Steps  // number of time steps
			}, 
			lma: [70],
			Events: sql.format(  // event query
				"SELECT * FROM openv.events WHERE fileID=? ORDER BY t LIMIT 10000", [file.ID] )
		};
		
		Trace("ingest stats ctx", ctx);
		
		if (cints = LAB.plugins.cints) 
			cints( ctx, function (ctx) {  // estimate/learn hidden process parameters
				
				if ( ctx ) {
					var stats = ctx.Save.pop() || {};  // retain last estimate at end
					Trace("ingest stats", stats);

					cb(stats);
				}
				
				else
					cb(null);
			}); 
		
	}, */
		
/**
Reserved for soap interfaces
@type {Object}
*/
	bySOAP : { 						//< action:route hash for XML-driven engines
		get: "",
		put: "",
		delete: "",
		post: "/service/algorithm/:proxy"		//< hydra endpoint
	},  		//< reserved for soap interfaces
		
/*
Enable for double-blind testing 
@type {Boolean}
*/
	//blindTesting : false		//< Enable for double-blind testing 
}, TOTEM, ".");

/**
Process an bySOAP session peer-to-peer request.  Currently customized for Hydra-peer and 
could/should be revised to support more generic peer-to-peer bySOAP interfaces.

@param {Object} req HTTP request
@param {Object} res HTTP response
@param {Function} proxy Name of APP proxy function to handle this session.
*/
function SOAPsession(req,res,peer,action) {
	sqlThread( sql => {
		req.addListener("data", function (data) {
			XML2JS.parseString(data.toString(), function (err,json) {  // hydra specific parse

				hydrareq = false
					? json["soapenv:Envelope"]["soapenv:Body"][0]["swag:SWAGRequest"][0]	// hydra soapui request
					: json["soap:Envelope"]["soap:Body"][0]["SWAGRequest"][0];				// hydra peer request

				for (var n in hydrareq)
					switch (n) {
						case "xmls":
						case "$":
						case "inFileName":
						case "outFileName":
						case "feature":
							ENV[n.toUpperCase()] = hydrareq[n][0];
							break;

						default:
							ENV[n.toUpperCase()] = parseFloat(hydrareq[n][0]);
					}
				
				var VTL = (APP[action]||{})[peer];
				
				Trace(action.toUpperCase() + peer + (VTL ? "LOCATED" : "MISSING"));
				
				if (VTL) 
					VTL(req, function (msg) {
						Trace("PEER " + peer + ":" + msg);
					});
					
			});
		});
		
		res.statusCode = 200;
		sql.reply(res,"0");
	});
}

//====================== Extend objects

/**
Convert records to requested req.type office file.
@param {Array} recs list of records to be converted
@param {Object} req Totem session request
@param {Function} res Totem session response
*/
function genDoc(recs,req,res) {
	
	if (!ODOC) 
		return res(errors.noOffice);
	
	var 
		types = {
			xdoc: "docx",
			xxls: "xlsx",
			xppt: "pptx",
			xpps: "ppsx"
		},
		type = types[req.type],
		docf = `./temps/docs/${req.table}.${type}`;
	
	if (type) {	
		res( "Claim file "+"here".link(docf) );
		
		var
			docx = ODOC({
				type: type
				//onend: function (writeBytes) { 	}
			}),			
			docs = FS.createWriteStream(docf);

		docx.generate( docs );
		docs.on("close", function () {
			Trace("CREATED "+docf);
		});

		if (false) {  // debugging
			var docp = docx.createP();
			docp.addText("hello there");

			docp.addTest(`
view || edit

1.2 All my users

ID	Client	Likeus	Updated	Banned	Liked	Joined	SnapInterval	SnapCount	Charge	Credit	QoS	Trusted	Captcha	Login	Email	Challenge	isHawk	Requested	Approved	Group	uid	gid	User	Journal	Message	IDs	Admin	Repoll	Timeout	Roles	Strength
34	brian.james@guest.org	0	Mon May 04 2015 05:52:50 GMT-0400 (EDT)		1	Mon Sep 28 2015 20:51:50 GMT-0400 (EDT)	null	null	null	0	0	0	0	null	null	0	1	null	null	app	null	null	brian.james@guest.org	null	null	{"Login":"me","Password":"test","FavColor":"blue"}	Please contact joeschome to unlock your accout	0	30000	PM,R,X	1

Totem


{"a":[{"ID":0,"SORN":"TBD","SPID":"TBD"}],"b":[{"ID":1,"NISTid":"TBD","NISTtype":"a1"},{"ID":2,"NISTid":"TBD","NISTtype":"TBD"},{"ID":3,"NISTtype":"a2"}]}


TBD

1.1 SCOPE AND APPLICABILITY

This document applies to all NGA owned, controlled, outsourced, blah blah

2. INFORMATION SYSTEM CATEGORIZATION

2.1 INFORMATION TYPES
Chapter 1

The Lorenz Equations x2=0

x˙y˙z˙=σ(y−x)=ρx−y−xz=−βz+xy

Impressive 'eh

Jα(x)=∑m=0∞(−1)mm!Γ(m+α+1)(x2)2m+α
Chapter 2
`
						);
		}

		var cols = [];
		var rows = [cols];

		recs.forEach( (rec,n) => {
			if (n == 0) 
				for (var key in rec)
					rows.push({
						val: key,
						opts: {
							cellColWidth: 4261,
							b: true,
							sz: "48",
							shd: {
								fille: "7F7F7F",
								themeFill: "text1",
								themeFillTint: "80"
							},
							fontFamily: "Avenir Book"
						}
					});

			var row = new Array();

			rows.push(row);
			for (var key in rec)
				row.push( rec[key] );
		});

		if (false)
		docx.createTable(rows, {
			tableColWidth: 4261,
			tableSize: 24,
			tableColor: "ada",
			tableAlign: "left",
			tableFontFamily: "Comic Sans MS",
			borders: true
		});
	}
	
	else
		res(DEBE.errors.badOffice);
}

/**
*/
function setAutorun(path) {
	watchFile( "."+path, exeAutorun );
}

/**
*/
function exeAutorun(sql,name,path) {

	Trace("autorun", path);
	sql.query( "SELECT * FROM openv.bricks WHERE Name=?", path.substr(1) )
	.on("result", file => {

		var 
			now = new Date(),
			startOk = now >= file.PoP_Start || !file.PoP_Start,
			endOk = now <= file.PoP_End || !file.PoP_End,
			fileOk = startOk && endOk;

		// Trace("autorun", startOk, endOk);

		if ( fileOk )
			sql.query( "SELECT Run FROM openv.watches WHERE File=?", path.substr(1) )
			.on("result", (link) => {
				var 
					parts = link.Run.split("."),
					pluginName = parts[0],
					caseName = parts[1],
					exePath = `/${pluginName}.exe?Name=${caseName}`;

				//Trace("autorun", link,exePath);
				Fetch( exePath, msg => Trace("autorun",msg) );
			});
	});

}

/**
*/
function getEngine( sql, name, cb ) {
	sql.query( 
		"SELECT * FROM openv.engines WHERE least(?,1) LIMIT 1", { Name: name }, (err, engs) => {
		cb( err ? null : engs[0] || null );
	});	
}

/**
*/
/*
function getContext( sql, host, query, cb ) {  //< callback cb(ctx) with primed plugin context or cb(null) if error

	sql.forFirst("", "SELECT * FROM app.?? WHERE least(?,1) LIMIT 1", [host,query], ctx => {
		
		if (ctx) {
			ctx.Host = host;
			// if ( ctx.Config ) config(ctx.Config, ctx);

			sql.getJsons( `app.${host}`, keys => {		// get all json stores
				keys.forEach( key => {					// look for keys that need to be parse
					if ( key.startsWith("Save") ) 		// dont waste time parsing Save_* keys
						delete ctx[key];

					else								// parse the store
						try {
							ctx[key] = JSON.parse( ctx[key] );
						}
						catch (err) {
						}
				});
				cb( ctx );
			});
		}

		else
			cb( null );	
	});

}
*/

/**
*/
function fileUpload(req, res) {
	const
		{sql, log, query, body, table, type,client } = req,
		now = new Date(),		
		rtns = [], 
		area = table,
		path = `file:/public/${area}`;

	//Trace(`INDEX ${path} FOR ${client}`, sql);
	
	if ( type == "help" ) 
	return res("Upload file to requested area.");

	switch (area) {
		case "uploads":
		case "stores":
		case "proofs":
		case "shares":

			Fetch( path, files => {

				if (files)
				files.forEach( (file,id) => {
					var link = `/${area}/${file}`;

					switch (area) {
						case "proofs":
						case "shares":

							var parts = file.split(".");

							switch (parts[1]) {
								case "jpg":
								case "png":
								case "ico":
									rtns.push({
										Name	: 
											file.tag("a", {
												href:"/files.view?goto=ELT&options="+`${area}.${file}`
											}) 	+ 
												"".tag("img",{src:link, width: 32, height: 32}),
										File	: file,
										ID		: id
									});
									break;

								default:
									rtns.push({
										Name	: file.tag("a",{href:link}),
										File	: file,
										ID		: id
									});
							}
							break;

						default:
							rtns.push({
								Name	: file.tag("a",{href:link}),
								File	: file,
								ID		: id
							});
							break;
					}
				});

			});

			res(rtns);

			break;

		case "dir": 

			["uploads", "stores", "shares"].forEach( area => {
				Fetch( `file:/public/${area}/`, file => {

					var 
						link = `/${area}/${file}`,
						stats = FS.statSync(`./public${link}`);

					rtns.push({
						Link	: link,
						Area	: area,
						Name 	: file,
						Dev 	: stats.dev,
						Mode 	: stats.mode,
						Size	: stats.size,		// Bytes
						Atime 	: stats.atime,
						Mtime	: stats.mtime,
						Isdir	: stats.isDirectory(), 
						Age	: (now.getTime()-stats.atime.getTime())*1e-3/3600/24,	// days
						ID	: n
					});
				});
			});

			res(rtns);

		default: 

			sql.query(
				"SELECT Area,Name,concat(Area,'.',Name) AS Ref, link(Name,concat('/',Area,'.',Name)) AS Link, astext(address) AS Address FROM openv.bricks HAVING ?", 
				guardQuery(query,true), function (err,rtns) {
					res(err || rtns);
			});
	}
}

/**
*/
function savePage(req,res) {
	const
		{ type,query,table,url} = req,
		master = "http://localhost:8080", //site.master,	
		Type = type.substr(1),
		name = table,
		xsrc = `${master}/${name}.${Type}`.tag("?", query),
		xtar = `/uploads/${name}.pdf`,
		src = `${master}/${name}.view`.tag("?", query),
		tar = `/uploads/${name}.${Type}`;	

	if (type == "help")
	return res("Save a web page and stage its delivery");

	switch (Type) {
		case "pdf":
		case "jpg":
		case "jpeg":
		case "png":
		case "ppm":
		case "bmp":
		case "gif":
			/*
			CP.execFile( "node", ["phantomjs", "rasterize.js", url, docf, res], function (err,stdout) { 
				if (err) Log(err,stdout);
			});  */
			res( "Claim your file".link(tar) );
			
			CP.exec(`phantomjs rasterize.js ${src} .${tar}`, (err,log) => {
				Log(err || `SAVED ${url}` );
			});
			break;

		case "html":
			res( "Claim your file".link(tar) );
			Fetch( src, html => {
				FS.writeFile( `.${tar}`, html, err => {
					Log(err || `SAVED ${url}` );
				});
			});
			break;	
			
		default:
			res( "Claim your file".link(xtar) );
			CP.exec(`phantomjs rasterize.js ${xsrc} .${xtar}`, (err,log) => {
				Log(err || `SAVED ${url}` );
			});
			
	}
}

/**
*/
function statusPlugin(req,res) {
	const 
		{ query, sql, table, type, host, client } = req,
		//ctx = { name:table, host:host, client:client, query:query},
		fetchUsers = (rec, cb) => {	// callback with endservice users
			Fetch("http://"+rec._EndService, info => { 
				//Trace("status users", info);
				cb( (info.toLowerCase().parseJSON() || [] ).join(";") ) ;
			});
		},
		fetchMods = (rec, cb) => {	// callback with endservice moderators
			sql.query(
				"SELECT group_concat( DISTINCT _Partner SEPARATOR ';' ) AS MODs FROM openv.releases WHERE ? LIMIT 1",
				{ _Product: rec.Name+".html" },
				(err, mods) => { 

					//Trace("status mods", err, mods);
					if ( mod = mods[0] || { MODs: "" } )
						cb( mod.MODs || "" );

				});
		};

	if (type == "help")
	return res("Status notebook");

	skinContext( sql, req, ctx => {

		const 
			{name,engine} = ctx;

		var
			product = name + "." + engine;

		sql.query(
			"SELECT Ver, Comment, _Published, _Product, _License, _EndService, _EndServiceID, 'none' AS _Users, "
			+ " 'fail' AS _Status, _Fails, "
			+ "group_concat( DISTINCT _Partner SEPARATOR ';' ) AS _Partners, sum(_Copies) AS _Copies "
			+ "FROM openv.releases WHERE ? GROUP BY _EndServiceID, _License ORDER BY _Published",

			[ {_Product: product}], (err,recs) => {

				//Trace("status", err, q.sql);

				if ( !err && recs.length )
					recs.serial( fetchUsers, (rec,users) => {  // retain user stats
						if (rec) {
							if ( users )
								rec._Users = users.mailify( "users", {subject: name+" request"});

							else 
								sql.query("UPDATE openv.releases SET ? WHERE ?", [ {_Fails: ++rec._Fails}, {ID: rec.ID}] );

							var 
								{origin} = new URL(rec._EndService);
								//url = URL.parse(rec._EndService),
								//host = url.host.split(".")[0];

							rec._License = rec._License.tag("a",{href:origin+`/releases.html?_EndServiceID=${rec._EndServiceID}`});
							rec._Product = rec._Product.tag("a", {href:ctx.run});
							rec._Status = "pass";
							rec._Partners = rec._Partners.mailify( "partners", {subject: name+" request"});
							//rec._EndService = origin.tag("a",{href:rec._EndService});
							delete rec._EndServiceID;
						}

						else
							recs.serial( fetchMods, (rec,mods) => {  // retain moderator stats
								if (rec) 
									rec.MODs = mods.mailify( "moderators", {subject: name+" request"});

								else 
									res( recs.gridify() );
							});
					});

				else
					res( "no transitions found" );
		});

	});
}
	
/**
*/
function matchPlugin(req,res) {
	const 
		{ query, sql, table, host, client, type } = req;
		//ctx = { name:table, host:host, client:client, query:query};

	if (type == "help")
	return res("Match notebook");

	skinContext( sql, req, ctx => {

		var
			name = ctx.name,
			type = ctx.type,
			product = name + "." + type,
			suits = [];

		sql.query(
			"SELECT Name,Path FROM openv.lookups WHERE ? OR ?",
			[{Ref: name}, {Ref:"notebooks"}], (err,recs) => {

			recs.forEach( rec => {
				//Trace([ctx.transfer, rec.Path, name]);
				suits.push( rec.Name.tag( `${ctx.transfer}${rec.Path}/${name}` ));
			});

			/*
			// Extend list of suitors with already  etc
			sql.query(
				"SELECT endService FROM openv.releases GROUP BY endServiceID", 
				[],  (err,recs) => {

				recs.forEach( rec => {
					if ( !sites[rec.endService] ) {
						var 
							url = URL.parse(rec.endService),
							name = (url.host||"none").split(".")[0];

						rtns.push( `<a href="${urls.transfer}${rec.endService}">${name}</a>` );
					}
				});

				rtns.push( `<a href="${urls.loopback}">loopback test</a>` );

				if (proxy)
					rtns.push( `<a href="${urls.proxy}">other</a>` );

				//rtns.push( `<a href="${site.worker}/lookups.view?Ref=${product}">add</a>` );

				cb( rtns.join(", ") );
			}); */
			suits.push( "loopback".tag( ctx.loopback ) );
			suits.push( "other".tag( ctx.tou ) );

			//suits.push( `<a href="${ctx.totem}/lookups.view?Ref=${product}">suitors</a>` );

			res( suits.join(", ") );
		});	
	});
}

/**
*/
function docPlugin(req,res) {
	const 
		{ table,sql,type } = req,
		name = table;

	if (type == "help")
	return res("Return notebook api help");

	skinContext( sql, req, ctx => {
		Trace(">>tou ctx",ctx);
		getEngine( sql, name, eng => {
			if ( eng ) {
				//eng.ToU = "p test";
				Trace(">>>tou", eng.ToU);
				renderJade( eng.ToU || "no ToU", ctx, tou => res( tou ) );
			}
			/*
			( eng.ToU || "ToU undefined" )
				.XFetch( html => html.Xparms( name, html => res(html) ));
				*/

			else
				res( errors.noEngine );
		});
	});
}
		
/**
*/
function trackPlugin(req,res) {
	const { query, sql, table, type } = req;
	var 
		name = table,
		product = name + "." + type;

	if (type == "help")
	return res("Find notebook licencing info");

	sql.query(
		"SELECT _License,_EndService FROM openv.releases WHERE ? LIMIT 1", 
		{_Product: product}, (err,pubs) => {

		res( err || pubs );
	});
}

/**
*/
function getPlugin(req,res) {

	/*
	function license( code, cb ) {
		licenseCode( sql, code, {
				_Partner: "totem",
				_EndService: ENV.SERVICE_MASTER_URL,
				_Published: new Date(),
				_Product: product,
				Path: path
			}, 
			if (pub)
				Trace(`LICENSED ${pub.Product} TO ${pub.EndUser}`);

			else
				Trace("FAILED LICENSE");
		});
	} */
	function serviceID(url) {
		return CRYPTO.createHmac("sha256", "").update(url || "").digest("hex");
	}

	function genLicense(code, secret) {  //< callback cb(minifiedCode, license)
		Trace("release passphrase", secret);
		if (secret)
			return CRYPTO.createHmac("sha256", secret).update(code).digest("hex");

		else
			return null;
	}

	function licenseCode(sql, code, pub, cb ) {  //< callback cb(pub) or cb(null) on error

		function returnLicense(pub) {
			var
				product = pub._Product,
				endService = pub._EndService,
				secret = product + "." + endService;

			if ( license = genLicense( code, secret ) ) {
				cb( Copy({
					_License: license,
					_EndServiceID: serviceID( pub._EndService ),
					_Copies: 1
				}, pub),  sql );

				sql.query( "INSERT INTO openv.releases SET ? ON DUPLICATE KEY UPDATE _Copies=_Copies+1", pub );

				sql.query( "INSERT INTO openv.masters SET ? ON DUPLICATE KEY UPDATE ?", [{
					Master: code,
					License: license,
					EndServiceID: pub._EndServiceID
				}, {Master: code} ] );		
			}

			else 
				cb( null );
		}

		//Trace("license code", pub);
		if (pub._EndService)  // an end-service specified so validate it
			Fetch( "http:"+pub._EndService, users => {  // check users provided by end-service
				const 
					partner = pub._Partner.toLowerCase(),
					inLoopback = endservice == "loopback",
					valid = users.parseJSON([]).concat( inLoopback ? partner : [] ).any( partner );

				Trace("release fetched users", users, partner, valid);

				if (valid) // signal valid
					returnLicense(pub);

				else	// signal invalid
					cb( null  );
			});	

		else	// no end-service so no need to validate
			returnLicense(pub);
	}

	const 
		{ query, sql, table, type, client, host } = req,
		{ endservice, proxy } = query,
		product = table,
		endPartner = client,
		{ suitor } = TOTEM.Lookups,
		Suitor = suitor || {},
		endService = (Suitor[endservice] || endservice) + `/${product}.exe`,
		types = {
			pub: "txt",
			users: "json",
			md: "txt",
			toumd: "txt",
			status: "html",
			suitors: "txt",
			publist: "txt",
			tou: "html",
			R: "txt",
			js: "txt",
			py: "txt",
			me: "txt",
			m: "txt",
			jade: "txt"
		};

	if (type == "help")
	return res("Return notebook code to authorized user");

	Trace( "release opts", {endPart: endPartner, endSrv: endService}, suitor );

	if ( endservice )
		skinContext( sql, req, ctx => {
			var 
				name = ctx.name,
				type = ctx.type,
				product = name + "." + type;

			Trace("release ctx", [name,type,product]);
			switch ( ctx.type) {
				case "R":
				case "js":
				case "py":
				case "me":
				case "m":
					sql.query(
						"SELECT * FROM openv.releases WHERE least(?,1) ORDER BY _Published DESC LIMIT 1", {
							_Partner: endPartner+".forever",
							_EndServiceID: serviceID( endService ),
							_Product: product
					}, (err, pubs) => {

						function addTerms(code, type, pub, cb) {
							var 
								prefix = {
									R: "# ",
									js: "// ",
									py: "# ",
									matlab: "% ",
									jade: "// "
								},
								pre = "\n"+(prefix[type] || ">>");

							FS.readFile( "."+paths.tou, "utf-8", (err, terms) => {
								if (err) 
									cb( errors.noLicense );

								else
									cb( pre + terms.parse$( Copy({
										service: pub._EndService,
										license: pub._License,
										published: pub._Published,
										partner: pub._Partner
									}, ctx)).replace(/\n/g,pre) + "\n" + code);
							});
						}

						//Trace(">>>>release", name, type, err, pubs );
						// May rework this to use eng.Code by priming the Code in the publish phase
						sql.query( "SELECT Code,Minified FROM openv.engines WHERE ? LIMIT 1", { Name: name }, (err,engs) => {
							//Trace(">>eng", engs[0]);
							if ( eng = engs[0] )
								FS.readFile( `./notebooks/${name}.d/source`, "utf-8", (err, srcCode) => {
									if (!err) eng.Code = srcCode;

									if ( pub = pubs[0] )	// already licensed so simply distribute
										addTerms( eng.Code, type, pub, res );

									else	// not yet released so ...
									if ( licenseOnDownload ) { // license required to distribute
										if ( eng.Minified )	// was compiled so ok to distribute
											licenseCode( sql, eng.Minified, {
												_Partner: endPartner,
												_EndService: endService,
												_Published: new Date(),
												_Product: product,
												Product: product,
												Path: "/"+product
											}, pub => {

												Trace("release license", pub);
												if (pub) // distribute licensed version
													addTerms( eng.Code, type, pub, res );

												else	// failed
													res( errors.noLicense );
											});

										else
											res( errors.noLicense );
									}

									else	// no license required
										res( eng.Code );
								});

							else
								res( errors.noEngine );
						});
					});
					break;

				case "jade":
					res( (eng.Type == "jade") ? eng.Code : null );
					break;

				default:
					res( errors.noEngine );
			}				
		});

	else
		res( errors.noPartner );
}

/**
*/
function simPlugin(req,res) {
	const { query, sql, table, type, client } = req;

	if (type == "help")
	return res("Place notebook in simulation thread");

	var crud = {
		reset: "delete",
		step: "select"
	};

	if ( route = crud[type] )
		ATOM[route](req, ctx =>	res( ctx ? errors.ok : "failed") );

	else
		res( new Error("bad sim spec") );
}
	
/*
Endpoint to blog a specifiec field from [requested](/api.view#blogPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem session response callback
*/
/*
function blogPlugin(req,res) {
	const 
		{ query, sql, table, type, client } = req,
		{ key, name, subs } = query,
		{ master } = site,
		//key = query.key || "Description",
		//name = query.name || "nocase",
		src = table.tag("?", {Name: subs ? name+"-*" : name}),
		head = [
			site.nick.tag( master ),
			"notebook".tag( `/${table}.view?name=${name}` ),
			(new Date().toDateString()) + "",
			( client.match( /(.*)\@(.*)/ ) || ["",client] )[1].tag( "email:" + client )
		].join(" || ")+"<br>";

	if (type == "help")
	return res("Blog notebook");

Trace(">>>>>>blog", table, key, type, query.subs, src);
	
	if ( key )
		sql.query(
			"SELECT * FROM app.?? WHERE ? LIMIT 1",
			[table, {Name: name}],
			(err, recs) => {

			if ( rec = recs[0] )
				if ( md = rec[key] ) 
					md.blogify(src, {}, rec, html => {
Log(html);
						res(head+html);
						//rec[key] = html;
						//res(recs);
					});

				else
					res( errors.noMarkdown );

			else
				res( errors.noRecord );
		});

	else
		sql.query(
			"SELECT * FROM app.?? WHERE ? LIMIT 1", [
			table, {Name: name}], (err,recs) => {

				if ( rec = recs[0] )
					(rec.Description||"").blog( rec, html => {
						res( html.tag("head").tag("html") );
					});
				
				else
					res(errors.noEngine);
			});
}
*/

/**
Endpoint to return users of a [requested](/api.view#usersPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem session response callback
*/
function usersPlugin(req,res) {
	const 
		{ query, sql, table, type, client } = req,
		debug = true,
		users = (debug ? [client] : []).concat( site.pocs.overlord.split(";") );

	if (type == "help")
	return res("Return list of notebook users");

	Trace("users", users);
	res( users );
}
					 
/**
Endpoint to export [requested](/api.view#usersPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem session response callback
*/
function exportPlugin(req,res) {
	const 
		{ query, sql, table, type } = req,
		name = table;

	if (type == "help")
	return res("Export notebook");

	res( "exporting" );
	CP.exec(
		`mysqldump -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST --add-drop-table app ${name} >./notebooks/${name}.nb`,
		(err,out) => Trace( `EXPORTED ${name} `, err||errors.ok ) );	
}

/**
Endpoint to import [requested](/api.view#usersPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem session response callback
*/
function importPlugin(req,res) {
	const 
		{ query, sql, table, type } = req,
		name = table;

	if (type == "help")
	return res("Import notebook");

	res( "importing" );
	CP.exec(
		`mysql -u$MYSQL_USER -p$MYSQL_PASS -h$MYSQL_HOST --force app < ./notebooks/${name}.nb`,
		(err,out) => Trace( `IMPORTED ${name} `, err||errors.ok ) );							
}

/*
docPlugin: function (req,res) {
	const { query, sql, table, type } = req;

	getEngine( sql, table, eng => {
		if ( eng )
			res( eng.ToU || "No Terms-Of-Use defined" );
/ * `
MathJax.Hub.Config({
extensions: ["tex2jax.js"],
jax: ["input/TeX","output/HTML-CSS"],
tex2jax: {inlineMath: [["$","$"],["\\(","\\)"]]}
}); `.tag("script", {src: "/clients/mathjax/MathJax.js?config=default"})

+ "".tag("link", { rel: 'stylesheet', href: '/clients/reveal/lib/css/zenburn.css' })

+ `
code  {
font-family: consolas, courier, monospace;
font-size: 1em;
line-height: 1.2em;
white-space: pre;
background-color: #acf; 
color: #000; 
border: 1px solid #666;
-moz-border-radius: 0.5em;
-webkit-border-radius: 0.5em;
border-radius: 0.5em; 
padding: 25px;
margin: 1.2em 1em;
width: 100%;
float: left;
}`.tag("style",{}) * /

		else 
			res( errors.noEngine );
	});
}, */
	
function wikiPlugin(req,res) {
	const 
		{ query, sql, table, type, host, client } = req,
		book = table,
		ds = "app."+book,
		inputs = {},
		outputs = [],
		keys = [];
	
	function genWikiPage( {keys,inputs,outputs,stats}, cb ) {
		const
			{ctime} = stats;
		
		renderJade( jade = `extends base
append base_parms
	- tech = "layout"
append base_body
	:markdown
		The interface for TOTEM's **#{Name}** notebook is shown below<br><br> !{interface()}

		And here is a ConOps picture:

		model(inputs='#{inputs}',outputs='#{outputs}')

	:markdown
		Creation date: #{created}

	p!= sitemap
`, Copy( site, {
			name: book,
			Name: book.toUpperCase(),
			filename: "./jades/ref.jade",
			interface: () => keys.map(f => {
				return {
					Key: f.key, 
					Type: f.type, 
					Details: f.doc
				}; 
			}).gridify({}),
			inputs: inputs,
			outputs: outputs,
			created: ctime
		}), html => {
			//Trace(">>>html", html.length);
			cb(html);
		});
		
		//Trace(jade);
	}
	
	res( "Retrieve your WIKI page "+"here".link(`./uploads/${book}.html`) );
	
	sql.getKeysFull( ds, "", ({Field,Type,Comment}) => {
		sql.Select(ds, {Pipe:"Pipe$"}, {}, {}, (err,recs) => {
			recs.forEach( rec => {
				if ( pipe = rec.Pipe ) 
					inputs[ isString(pipe) ? pipe : pipe.Pipe || "" ] = "input";
			});
			
			Field.map( (key,i) => {
				if ( key.startsWith("Save") ) 
					outputs.push(key);
				
				else
					keys.push({
						key: key,
						type: Type[i],
						doc: unescape(Comment[i])
					});
			});
			
			genWikiPage({
				name: book,
				keys: keys, 
				inputs: Object.keys(inputs),
				outputs: outputs,
				stats: FS.statSync( `./notebooks/${book}.js` )
			} , html => {
				
				FS.writeFile( `./uploads/${book}.html`, html, err => Trace(err||"saved") );
				
			});
		});
	});
	
}

function publishPlugin(req,res) {

	function getModule( path ) {
		try {
			return require( path );
		}

		catch (err) {
			return null;
		}
	}	

	function genTable( sql, name, mod ) {
		function minifyCode( code, cb ) {  //< callback cb(minifiedCode)
			//Trace(">>>>min", code.length, type, name);

			switch (type) {
				case "html":
					cb( HMIN.minify(code.replace(/<br>/g,""), {
						removeAttributeQuotes: true
					}) );
					break;

				case "js":
					var
						e6Tmp = "./pubmin/e6/" + product,
						e5Tmp = "./pubmin/e5/" + product;

					FS.writeFile(e6Tmp, code, "utf-8", err => {
						CP.exec( `babel ${e6Tmp} -o ${e5Tmp} --presets /local/nodejs/lib/node_modules/@babel/preset-env`, (err,log) => {
							Trace("PUBLISH BABEL", err?"failed":errors.ok );
							try {
								FS.readFile(e5Tmp, "utf-8", (err,e5code) => {
									if ( err ) 
										cb( null );

									else {
										var min = JSMIN.minify( e5code );

										if ( min.error ) 
											cb( null );

										else   
											cb( min.code );
									}
								});
							}
							catch (err) {
								cb( null );
							}
						});
					});
					break;						

				case "py":
					/*
					minifying python is problematic as the pyminifier obvuscator has no option
					to reseed; thus the pyminifier was modified to reseed its rv generator (see install
					notes).
					*/

					var pyTmp = "./temps/py/" + product;

					FS.writeFile(pyTmp, code.replace(/\t/g,"  ").replace(/^\n/gm,""), "utf-8", err => {
						CP.exec(`pyminifier -O ${pyTmp}`, (err,minCode) => {
							//Trace("pymin>>>>", err);

							if (err)
								cb(err);

							else
								cb( minCode );
						});
					});
					break;

				case "m":
				case "mj":
					/*
					Could use Matlab's pcode generator - but only avail within matlab
							cd to MATLABROOT (avail w matlabroot cmd)
							matlab -nosplash -r script.m
							start matlab -nospash -nodesktop -minimize -r script.m -logfile tmp.log

					but, if not on a matlab machine, we need to enqueue this matlab script from another machine via curl to totem

					From a matlab machine, use mcc source, then use gcc (gcc -fpreprocessed -dD -E  -P source_code.c > source_code_comments_removed.c)
					to remove comments - but you're back to enqueue.

					Better option to use smop to convert matlab to python, then pyminify that.
					*/

					var 
						mTmp = "./temps/matsrc/" + product,
						pyTmp = "./temps/matout/" + product;

					FS.writeFile(mTmp, code.replace(/\t/g,"  "), "utf-8", err => {
						CP.execFile("python", ["matlabtopython.py", "smop", mTmp, "-o", pyTmp], err => {	
							//Trace("matmin>>>>", err);

							if (err)
								cb( err );

							else
								FS.readFile( pyTmp, "utf-8", (err,pyCode) => {
									if (err) 
										cb( err );

									else
										CP.exec(`pyminifier -O ${pyTmp}`, (err,minCode) => {
											if (err)
												cb(err);

											else
												cb( minCode, mod );
										});										
								});									
						});
					});
					break;

				case "jade":
					cb( 
						code
							.replace(/\n/g," ")
							.replace(/\t/g," ")
							.replace(/  /g,"")
							.replace(/, /g,",")
							.replace(/\. /g,".")  );
					break;

				case "":
				case "R":
				default:
					cb( code );
			}
		}

		function getResource( file ) {	
			try {
				return FS.readFileSync( `./notebooks/resource/${file}`, "utf-8").replace( /\r\n/g, "\n");
			}
			catch (err) {
				return null;
			}
		}

		function getComment( sql, cb ) {
			var com = sql.replace( /(.*) comment '((.|\n|\t)*)'/, (str,spec,doc) => { 
				//Trace(">>>>>>>>>>>>>>spec", spec, doc);
				cb( spec, doc );
				return "#";
			});

			if ( !com.startsWith("#") ) cb( sql, "" );			
		}

		const
			path = `./notebooks/${name}`,
			type = ("js" in mod) ? "js" : ("py" in mod) ? "py" : ("R" in mod) ? "R" : ("cv" in mod) ? "cv" : ("m" in mod) ? "m" : ("mj" in mod) ? "mj" : "js",
			code = ((mod[type] || mod.code || mod.engine)+"") || getResource( `${name}.${type}` ),
			tou = mod.tou || mod.doc || getResource( `${name}.tou` ) || getResource( `${name}.doc` ) || getResource( "default.tou" ),
			modkeys = mod.mods || mod.modkeys || mod.MODs,
			addkeys = mod.adds || mod.addkeys || mod.keys,
			prokeys = modkeys || addkeys || {},
			product = name + "." + type;

		Trace("publish", path, name, type);

		skinContext( sql, req, ctx => {	// get a skinning ctx to generate the ToU
			const 
				{ dockeys, speckeys } = Copy({
					speckeys: {},
					dockeys: {},
					defaultDocs: defaultDocs
				}, ctx);

			Object.keys(prokeys).stream( (prokey,key,cb) => {	// expand product key comments
				const def = prokeys[prokey];
				
				if ( cb )	// still streaming keys
					getComment( def, (spec, doc) => {	// extract key's comment
						var
							comment = (defaultDocs[key] || "") + (doc || "");

						comment.blog( ctx, html => { 	// blog the comment
							function makeSkinable( com ) {
								return escape(com).replace(/[\.|\*|_|']/g,arg=>"%"+arg.charCodeAt(0).toString(16) );
							}

							//Trace("gen", key,spec,html.substr(0,100));
							speckeys[key] = spec;
							dockeys[key] = makeSkinable(html);
							cb();
						});
					});

				else {		// all keys expanded so ...
					// renderJade(tou, ctx, tou => {	// generate ToU in this blogctx
					// });
					Trace( `PUBLISH ${name} tou=${tou.length}` );

					if ( mod.clear || mod.reset )
						sql.query("DROP TABLE app.??", name);

					sql.query(
						"INSERT INTO OPENV.projects SET ?", {
							Name: name,
							Title: `Notebook ${name}`,
							Lead: "tbd",
							Status: "started",
							JIRA: "tbd"
					});

					sql.query( 
						`CREATE TABLE app.${name} (ID float unique auto_increment, Name varchar(32) unique key )` , 
						[], err => {

						if ( modkeys )
							Each( modkeys, key => {
								var 
									keyId = sql.escapeId(key),
									spec = speckeys[key],
									doc = dockeys[key];

								sql.query( `ALTER TABLE app.${name} MODIFY ${keyId} ${spec} comment '${doc}'`, [], err => {
									if ( err ) Trace("PUBLISH NOMOD:"+key);
								});
							});

						else
						if ( addkeys )
							Each( addkeys, key => {
								var 
									keyId = sql.escapeId(key),
									spec = speckeys[key],
									doc = dockeys[key];

								//Trace("add", keyId, spec);
								sql.query( `ALTER TABLE app.${name} ADD ${keyId} ${spec} comment '${doc}'`, [], err => {
									if ( err ) Trace("PUBLISH NOADD:"+key);
								});
							});

						else
							Trace( `PUBLISH ${name} NO mods||adds KEY` );

						if ( inits = mod.inits || mod.initial || mod.initialize )
							inits.forEach( init => {
								sql.query("INSERT INTO app.?? SET ?", init);
							});

						/*
						if  ( readme = mod.readme )
							FS.writeFile( path+".md", readme, "utf-8" );
						*/

						if ( code ) 
							minifyCode( code, minCode => {	// get minified code for license tracking
								const 
									from = type,
									to = mod.to || from,
									fromFile = path + `.${from}`,
									toFile = path + `.${to}`,
									imports = {},
									rec = {
										Code: code,
										Minified: minCode,
										Wrap: mod.wrap || "",
										ToU: tou,
										State: JSON.stringify(mod.state || mod.context || mod.ctx || {})
									};

								Trace( `PUBLISH ${name} CONVERT ${from}=>${to}` );
								// Trace(">>>save ",name, type, code);

								if ( from == to )  { // use code as-is
									sql.query( 
										"INSERT INTO openv.engines SET ? ON DUPLICATE KEY UPDATE ?", [ 
											Copy(rec, {
												Name: name,
												Type: type,
												Enabled: 1
											}), 
											rec 
										]);

									// if (from == "js") FLEX.import(name,code);
								}

								else  // convert code to requested type
									//CP.execFile("python", ["matlabtopython.py", "smop", fromFile, "-o", toFile], err => {
									FS.writeFile( fromFile, code, "utf-8", err => {
										CP.exec( `sh ${from}to${to}.sh ${fromFile} ${toFile}`, (err, out) => {
											if (!err) 
												FS.readFile( toFile, "utf-8", (err,code) => {
													rec.Code = code;
													if (!err)
														sql.query( 
															"INSERT INTO openv.engines SET ? ON DUPLICATE KEY UPDATE ?", [ Copy(rec, {
																Name: name,
																Type: type,
																Enabled: 1
															}), rec ] );
												});									
										});
									});	
							});

						else
							Trace( `PUBLISH ${name} NO ENGINE KEY` );
					});

					/*
					sql.query(
						"UPDATE app.?? SET ? WHERE least(?,1)", [
							name, 
							{Code: code, ToU: tou}}, 
							{Name: name, Type: type}
						], err => Trace( err || `PUBLISHED ${name}` ) );
					*/

					// CP.exec(`cd ${name}.d; sh publish.sh`);
				}
			});
		});
	}

	function genReadme( name ) {
		const
			sh = [
				`cd ./artifacts/${name}`,
				`curl localhost:8080/${name}.tou > README.md`,
				`curl localhost:8080/${name}.status >> README.md` ,
				`curl "localhost:8080/${name}.html?_blog=Description" >> README.md`,
				`cd ./artifacts`,
				`git commit -am "update readme"`,
				`git push agent master`
			].join(";");

		CP.exec(sh, (err,log) => {
			Trace("gen readme", err,log);					
		});
	}

	function genArtifacts( name, uid ) {
		const 
			remote = "164.187.33.219",
			gitsite = "git@github.com:totemorg/artifacts",
				//"https://sc.appdev.proj.coe/acmesds",
			short = {
				pub: "publish",
				run: "run",
				view: "view" ,
				brief: "brief"
			};

		FS.mkdir( `./artifacts/${name}`, err => {
			if ( err ) 
				Log(err);
			
			else { // prime the notebook
				// make a login link
				
				FS.writeFile( `./artifacts/${name}/login.rdp`, 
`screen mode id:i:2
desktopwidth:i:1366
desktopheight:i:768
session bpp:i:32
winposstr:s:0,3,0,0,800,600
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:2
displayconnectionbar:i:1
username:s:${uid}
disable wallpaper:i:1
allow font smoothing:i:0
allow desktop composition:i:0
disable full window drag:i:1
disable menu anims:i:1
disable themes:i:0
disable cursor setting:i:0
bitmapcachepersistenable:i:1
full address:s:${remote}
audiomode:i:0
redirectprinters:i:1
redirectcomports:i:0
redirectsmartcards:i:1
redirectclipboard:i:1
redirectposdevices:i:0
redirectdirectx:i:1
drivestoredirect:s:
autoreconnection enabled:i:1
authentication level:i:2
prompt for credentials:i:0
negotiate security layer:i:1
remoteapplicationmode:i:0
alternate shell:s:"C:\"
shell working directory:s:"C:\"
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:1
use redirection server name:i:0
use multimon:i:0
networkautodetect:i:1
bandwidthautodetect:i:1
enableworkspacereconnect:i:0
gatewaybrokeringtype:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:
`, 
							 "utf-8", err => {} );

				CP.exec( [
							`cp -r ./artifacts/temp/* ./artifacts/${name}`,
							`git add ./artifacts/${name}`
							//`cd ./artifacts/${name}`
							//"git init",
							//`git remote add origin ${gitsite}/${name}`
						].join(";"), err => {

					["pub","run","exam","brief"].forEach( type => {	// make nb shortcuts
						
						// make the shortcut
						
						FS.writeFile( `./artifacts/${name}/${short[type]}.url`, 

`[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
[InternetShortcut]
URL=https://totem.west.ile.nga.ic.gov/${name}.${type}
IDList=
`,
							"utf-8",
							err => {} );
					});	

				});

			}
		});
	}

	const 
		{ query, sql, table, type, host, client, profile } = req,
		book = table,
		modPath = `./notebooks/${book}`;
	
	if (type == "help")
	return res("Publish notebook");

	//Trace(flags, profile);
	
	if ( mod = getModule( modPath ) ) {
		res( errors.ok );
		genTable( sql, book, mod );
		genReadme( book );
	}
	
	else
	if ( profile.Creator )
		CP.exec( `cp ./notebooks/temp.js ${modPath}.js --no-clobber`, err => {
			if (err) 
				res( errors.bookFailed );

			else 
			if ( mod = getModule( modPath ) ) {
				res( errors.ok );

				genArtifacts( book, "T"+profile.ID );
				genTable( sql, book, mod );
				genReadme( book );
			}

			else
				res( errors.bookFailed );
		})

	else
		res( errors.noPermission );	
}
	
function storesPlugin(req,res) {
	const
		{ sql, table,type } = req,
		name = table,
		info = [];

	if (type == "help")
	return res("Return notebook stores");

	sql.query( "SHOW COLUMNS FROM app.?? LIKE 'Save_%'", [name])
	.on("result", col => {
		info.push( col.Field.link( `/browse.view?json=${col.Field}$&name&src=/${name}.json?` ));
	})
	.on("end", () => res( info.join(" || ") ) );

}
	
/**
Endpoint to execute plugin req.table using usecase req.query.ID || req.query.Name.

@param {Object} req http request
@param {Function} res Totem session response callback
*/	
function exePlugin(req,res) {	//< execute plugin in specified usecase context
	const 
		{ sql, client, profile, table, query, index, type } = req;

	//Trace("Execute", query);
	
	if (type == "help")
	return res("Execute notebook");

	if ( query.name || query.Name )  // run using named usecase
		runPlugin(req, status => res( status || errors.noContext ) );

	else
	if ( isEmpty(query) ) 
		res( errors.noName );			
	
	else
	if (TOTEM.probono)   // execute unregulated engine using query as usecase
		ATOM.select(req, ctx => {	// index ctx json stores, if requested
			if ( ctx ) // all is well so ...
				if ( isEmpty(index) )	// no indexing
					if ( save = ctx.Save )
						res( save.forEach ? save.slice(1) : save );

					else								
						res( ctx );

				else {	// indexing 
					var ctxRtn = {};
					Each( index, (rtnKey,ctxKey) => {
						var
							[x,lhs,rhs] = ctxKey.match( /(.*?)\$(.*)/ ) || [ ];
//Trace("index", rtnKey, ctxKey, lhs,rhs);

						if ( x ) {
							var 
								store = {$: ctx[lhs] },
								rtn = ctxRtn[rtnKey] = [];

							//Trace("arg=", store, "key=", ctxKey);
							rhs.split(",").forEach( ctxKey => rtn.push( ("$"+ctxKey).parseJS( store, err => null ) ) );
						}

						else 
							ctxRtn[rtnKey] = ctxKey.parseJS( ctx ); 

					});
					res(ctxRtn);
				}

			else
				res( errors.noNotebook );
		});

	else
		res(errors.cantRun);
}

/**
Endpoint to add keys to [requested](/api.view#modifyPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem session response callback
*/
function modifyPlugin(req,res) {	//< add usecase keys to plugin
	const 
		{ query, sql, table, type } = req,
		mods = [];

	if (type == "help")
	return res("Modify notebook keys");

	res( errors.ok );

	Each(query, (type, keys) => {
		if ( keys )
			switch (type) {
				case "bool":
					keys.split(",").forEach( key => mods.push( `add ${key} boolean` ));
					break;
				case "int":
					keys.split(",").forEach( key => mods.push( `add ${key} int(11)` ));
					break;
				case "doc":
					keys.split(",").forEach( key => mods.push( `add ${key} mediumtext` ));
					break;
				case "date":
					keys.split(",").forEach( key => mods.push( `add ${key} datetime` ));
					break;
				case "drop":
					keys.split(",").forEach( key => mods.push( `drop ${key}` ));
					break;
				case "json":
				case "float":
				default:
					keys.split(",").forEach( key => mods.push( `add ${key} ${type}` ));
					break;
			}
	});

	sql.query("ALTER TABLE app.?? "+mods.join(", "), [table]);
}

/**
Endpoint to remove keys from [requested](/api.view#retractPlugin) plugin/notebook/table given.

@param {Object} req http request
@param {Function} res Totem session response callback
*/
function retractPlugin(req,res) {	//< remove usecase keys from plugin
	const { query, sql, table, type } = req;

	if (type == "help")
	return res("Remove notebook keys");

	res( errors.ok );

	Each(query, (key, val) => {
		sql.query("ALTER TABLE app.?? DROP ?? ", [table,key]);
	});
}

/**
Endpoint to return plugin/notebook/table usage info.

@param {Object} req http request
@param {Function} res Totem session response callback
*/
function helpPlugin(req,res) {
	const
		{ sql,table,type } = req,
		name = table;

	if (type == "help")
	return res("Return notebook links");

	res([
		"execute".link( `/${name}.exe?name=CASE` ),
		"run".link( `/${name}.run` ),
		"view".link( `/${name}.view` ),
		"exam".link( `/${name}.exam` ),
		"terms".link( `/${name}.tou` ),
		"publish".link( `/${name}.pub` ),
		"usage".link( `/${name}.use` ),
		"project".link( `/${name}.proj` ),
		"export".link( `/${name}.export` ),
		"import".link( `/${name}.import` ),
		"artifacts".link( `/${name}.browse` ),
		"brief".link( `/${name}.brief` ),
		"download".link( `/${name}.js` ),
		"stores".link( `/${name}.stores` ),
		"rtp".link( `/rtpsqd.view?notebook=${name}` ),
		"reset".link( `${name}.reset` )
	].join(" || ") );
}

/**
Endpoint to run a dataset-engine plugin named X = req.table using parameters Q = req.query
or (if Q.id or Q.name specified) dataset X parameters derived from the matched  
dataset (with json fields automatically parsed). On running the plugin's engine X, this 
method then responds on res(results).   If Q.Save is present, the engine's results are
also saved to the plugins dataset.  If Q.Pipe is present, then responds with res(Q.Pipe), 
thus allowing the caller to place the request in its job queues.  Otherwise, if Q.Pipe 
vacant, then responds with res(results).  If a Q.agent is present, then the plugin is 
out-sourced to the requested agent, which is periodically polled for its results, then
responds with res(results).  

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
function runPlugin(req, res) {  //< callback res(ctx) with resulting ctx or cb(null) if error

	const 
		{ sql, table, query, type, client } = req,
		{ random } = Math,
		book = "app."+table,
		trace = true,			
		{ agent } = query;

	// Trace(">>run", book);

	if (type == "help")
	return res("Run notebook");

	sql.getContext( book, query, ctx => {		// get context for this notebook
		function enumPipe( Pipe ) {
			function crossParms( depth, keys, forCtx, setCtx, idxCtx, cb ) {	// cross forCtx keys with callback cb(setCtx)
				if ( depth == keys.length ) 
					cb( setCtx, idxCtx );

				else {
					var 
						key = keys[depth],
						values = forCtx[ key ];

					if (values) 
						if ( values.forEach )	// enumerate over array values
							values.forEach( (value,idx) => {
								setCtx[ key ] = value;
								idxCtx[ key ] = idx;
								crossParms( depth+1, keys, forCtx, setCtx, idxCtx, cb );
							});

						else {	// set to specified value
							setCtx[ key ] = values;
							idxCtx[ key ] = 0;
							crossParms( depth+1, keys, forCtx, setCtx, idxCtx, cb );
						}
				}
			}

			const
				runCtx = Copy(ctx, {}), 
				jobs = [], sets = [], inserts = 0,
				run = `//${book}.exe`,
				noClobber = (Pipe.noClobber||"0").parseJS(ctx),
				noRun = (Pipe.noRun||"0").parseJS(ctx);

			delete Pipe.noClobber;
			delete Pipe.noRun;

			// purge DNC keys from the run context 
			delete runCtx.ID;
			//delete runCtx.Host;
			delete runCtx.Name;
			delete runCtx.Pipe;
			//for (var key in runCtx) if ( key.startsWith("Save") ) delete runCtx[key];

			//Trace(">>>init run", runCtx);
			//Trace(">>>book", TOTEM.$master);

			sql.getFields( `app.${book}`, "Field NOT LIKE 'Save%'", ({Field,Type}) => {		// generate use cases

				sql.query( `DELETE FROM app.${book} WHERE Name LIKE '${ctx.Name}-%' ` );

				crossParms( 0 , Object.keys(Pipe), Pipe, {}, {}, (setCtx,idxCtx) => {	// enumerate keys to provide a setCtx key-context for each enumeration
					//Trace("set", setCtx, idxCtx, Pipe.Name);
					const 
						fix = {X: idxCtx, L:jobs.length, N: ctx.Name},
						set = Copy(setCtx, {}, "."),
						job = Copy(setCtx, Copy(runCtx, {}), "." );

					//Trace(">>>set", setCtx, set, fix);
					Field.forEach( (key,i) => {
						if ( (key in job) && (Type[i] == "json") ) 
							job[key] = JSON.stringify( job[key] );
					});

					Each( set, (key,val) => set[key] = job[key] );

					//Trace(">>set", job, set);

					job.Name = ( Pipe.Name || "${N}-${L}" ).parse$( fix );

					//Trace(">>>>debug", job);
					
					Each( job, (key,val) => {	// build sub replaceor
						if ( val )
							if ( !(key in ctx) ) // remove job keys not in the ctx
								delete job[key];
					});

					jobs.push( job );
					sets.push( set );
				});

				//tracePipe("enumerate", jobs);

				jobs.forEach( (job,idx) => {
					//Trace(idx,job,sets[idx]);

					sql.query( 
						noClobber
							?	`INSERT INTO app.${book} SET ?`
							:	`INSERT INTO app.${book} SET ? ON DUPLICATE KEY UPDATE ?`, 

						[job,sets[idx]], err => {

						//Trace(">>>ins", err, [inserts,jobs.length]);
						if ( ++inserts == jobs.length )  // run usecases after they are all created
							if ( !noRun )
								jobs.forEach( job => {
									Fetch( `${run}?name=${job.Name}`, info => {} );
								});
					});
				});
			});
		}

// Trace(">>>notebook ctx", ctx);

		if (ctx) {
			res(errors.ok);

			const { Pipe } = ctx;

			if (Pipe)
				switch ( Pipe.constructor ) {
					case String: // source pipe
						req.query = Copy({
							$trace: (msg,args) => `pipe ${book}`.trace( msg, args ),
							$pipe: cb => Fetch(Pipe.tag("?",{_task:book,_name:ctx.Name,_client:client}),cb)
						}, ctx);

						ATOM.select(req, ctx => {
							if ( ctx )
								Trace( sql.saveContext( ctx ) );
						});

						break;

					case Array:  // event pipe
						req.query = Copy({
							$trace: (msg,args) => `pipe ${book}`.trace( msg, args ),
							$pipe: cb => cb(Pipe)
						}, ctx);
						
						ATOM.select(req, ctx => {
							//Trace(">>>engine select", ctx);
							if ( ctx )
								Trace( sql.saveContext( ctx ) );

							else
								Trace( "lost context" );
						});
						break;

					case Object:  // enumeration pipe

						if ( script = Pipe.$ ) // $-scripting pipe
							Trace("pipe scripting unsupported" );

						enumPipe(Pipe);

						break;
				}
			
			else {
				req.query = Copy({
					$trace: (msg,args) => `pipe ${book}`.trace( msg, args ),
					$pipe: cb => cb(null)
				}, ctx);

				ATOM.select(req, ctx => {
					//Trace("pipe run ctx", ctx);
					Trace("save ctx?", ctx);
					if ( ctx )
						Trace( sql.saveContext( ctx ) );
				});
			}
		}

		else
			res( null );
	});

}

/**
Endpoint to create/return public-private certs of given [url query](/api.view#getCert) 

@param {Object} req Totem session request
@param {Function} res Totem session response
*/
function getCert(req,res) { // create/return public-private certs

	const 
		{ query, type } = req,
		{ owner, pass } = query;

	if (type == "help")
	return res("Generate and return a pki cert");

	TOTEM.prime(owner, pass, {}, function () {

		CP.exec(
			`puttygen ${owner}.key -N ${pass} -o ${owner}.ppk`, 

			err => {

			if (err) 
				res( errors.certFailed );

			else {	
				var 
					master = site.master,
					FF = "Firefox".tag( master+"/stash/firefox.zip" ),
					Putty = "Putty".tag( master+"/stash/putty.zip" ),
					Cert = "Cert".tag( master+"/cert/${owner}" );

				res( function () {
					return {
						area: "",
						name: `${owner}.ppk`
					}
				});

				sendMail({
					from:  site.ASP,
					to:  site.ISP,
					cc: name,
					subject: `${site.Nick} account request`,
					html: 
`Greetings from ${site.Nick.tag(master)}-

Please create an AWS EC2 account for ${owner} using attached cert.

To connect to ${site.Nick} from Windows:

1. establish gateway ${Putty} | SSH | Tunnels | (SourcePort, Destination):

	5001, ${site.Host}:22
	5100, ${site.Host}:3389
	5200, ${site.Host}:8080
	5910, ${site.Host}:5910
	5555, Dynamic

2. setup ${Putty} interface:

	Pageant | Add Keys | your private ppk cert

3. start a ${site.Nick} session using one of these methods:

	${Putty} | Session | Host Name = localhost:5001 
	Remote Desktop Connect| Computer = localhost:5100 
	${FF} | Options | Network | Settings | Manual Proxy | Socks Host = localhost, Port = 5555, Socks = v5
`.replace(/\n/g,"<br>"),

					attachments: [{
						fileName: Cert,
						path: `${paths.certs+name}.pub`
					}],	
					alternatives: [{
						contentType: 'text/html; charset="ISO-59-1"',
						contents: ""
					}]
				});
			}

		});

	});

}

Start("debe", Copy({			// start unit test
	"??": () => 
		Trace("$", {
			siteContext: site
		}),
	
	/*
	res: cmd => {
		if ( cmd.startsWith("?") ) {
			const 
				n = cmd.substr(1) || "",
				x = n ? $ctx[ n ] || $.imports[ n ] : $ctx;

			if ( book = n.match( /(.*)\:\:(.*)/ ) ) {
				const [nb,uc] = book;
			}
				
			else
	  		if ( url = n.match( /(.*)\:(.*)/ ) ) {
			}

	  		else
	  		if (x.name)
				CP.exec( `firefox ${site.master}/${x.name}.view` );

			else
				console.log( x );
		}

		else
			$(cmd,$ctx);
	},
	 */
	
	lab: () => 
		config({}, sql => {			
			const
				{$help} = $ctx = $libs;

			Trace( "Welcome to TOTEM lab" );
				
			$help();
			//Each( $libs, (key,lib) => ctx[key] = lib );
		}),

	chip: () =>
		config({
			onFile: {
				"./uploads/": (sql, name, path) => {  // watch changes to a file				

					sql.forFirst(  // get client for registered file
						"UPLOAD",
						"SELECT ID,Client,Added FROM openv.bricks WHERE least(?) LIMIT 1", 
						{Name: name}, file => {

						if (file) {  // ingest only registered file
							var 
								now = new Date(),
								exit = new Date(),
								client = file.Client,
								added = file.Added,
								port = name.link( "/files.view" ),
								url = site.worker,
								metrics = "metrics".link( url+"/airspace.view" ),
								poc = site.distro.d;

							sql.forFirst(  // credit client for upload
								"UPLOAD",
								"SELECT `Group` FROM openv.profiles WHERE ? LIMIT 1", 
								{Client:client}, 
								prof => {

								exit.offsetDays( 30 );

								if ( prof ) {
									var 					
										group = prof.Group,
										revised = "revised".link( `/files.view?ID=${file.ID}` ),
										notes = `
Thank you ${client} for your sample deposited to ${port} on ${now}.  If your 
sample passes initial quality assessments, additional ${metrics} will become available.  Unless
${revised}, these samples will expire on ${exit}.  Should you wish to remove these quality 
assessments from our worldwide reporting system, please contact ${poc}.
`;
									sql.query("UPDATE openv.bricks SET ? WHERE ?", [{
											_State_Notes: notes,
											Added: now,
											PoP_Expires: exit
										}, {ID: file.ID}
									], err => {
										ingestFile(sql, path, file.ID, aoi => {
											//Trace( `CREDIT ${client}` );

											sql.query("UPDATE openv.profiles SET Credit=Credit+? WHERE Client=?", [aoi.snr, client]);

											if (false)  // put upload into LTS - move this to file watchDog
												exec(`zip ${path}.zip ${path}; rm ${path}; touch ${path}`, err => {
													Trace(`PURGED ${name}`);
												});
										});
									});

								}
							});
						}
					});
				}
			} 
		}, sql => {
			
			const
				{ ingestFile } = require("../chip");
			
			Trace( 
`Yowzers - this does everything but eat!  An encrypted service, a database, a jade UI for clients,
usecase-engine plugins, file-upload watchers, and watch dogs that monitor system resources (jobs, files, 
clients, users, system health, etc).` 
			);
			
		}),
		
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var admin
	@memberof UnitTest
	*/

	admin: () =>
		config({
			"secureLink.challenge.extend": 10
		}, sql => {
			Trace( 
`Yowzers - this does everything but eat!  An encrypted service, a database, a jade UI for clients,
usecase-engine plugins, file-upload watchers, and watch dogs that monitor system resources (jobs, files, 
clients, users, system health, etc).` 
			);
			
		}),
		
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var D2
	@memberof UnitTest
	*/
	D2: () =>
		config({
			"secureLink.challenge.extend": 10,
			"byNode.": {
				wfs: function (req,res) {
					res("here i go again");

					Fetch(ENV.WFS_TEST, data => {
						Log(data);
					});
				}
			}
		}, sql => {
			Trace( "This bad boy in an encrypted service with a database and has an /wfs endpoint" );
		}),
		
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var D3
	@memberof UnitTest
	*/
		
	D3: () =>
		config({
		}, sql => {
			Trace( "Stateful network flow manger started" );
		}),
		
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var D4
	@memberof UnitTest
	*/
		
	D4: () =>
		config({
		}, sql => {
			function readFile(sql, path, cb) {
				const {xlsx} = readers;

				sql.beginBulk();
				xlsx( "./config.stores/test.xls", rec => { 
					if (rec) 
						cb(rec,sql);

					else 
						sql.endBulk();
				});
			}
			
			var recs = 0, now = new Date();
			readFile( sql, "./config.stores/test.xls", (rec,sql) => {
				if ( ++recs<5 ) {
					var 
						doc = (rec.doc || rec.Doc || rec.report || rec.Report || "")
								.replace( /\n/g, " ")
								.replace( /\&\#10;/g, " "),

						docs = doc				
								.match( /(.*)TEXT:(.*)COMMENTS:(.*)/ ) || [ "", "", doc, ""],

						text = "";

					docs[2].replace( /\.  /g, "\n").replace( /^[0-9 ]*\. \(.*\) (.*)/gm, (str,txt) => text += txt + ".  " );

					sql.query("INSERT INTO openv.docs SET ?", {
						Reported: rec.reported || rec.Reported || now,
						Name: rec.reportID || ("tbd-"+recs),
						Pipe: JSON.stringify( text )
					}, err => Trace("add", err) );
				}
			});
		}),
		
	D5: () => {
		const {pdf} = readers;
		pdf( "./config.stores/ocrTest01.pdf", txt => Trace(txt) );
	},
		
	raster: () => 
		config({
		}, sql => {
			const 
				[xcmd,xdebe,xblog,src,tar] = process.argv;
		
			Trace(`Rasterizing ${src} => ${tar}`);
			
			if ( tar.endsWith(".html") ) 
				Fetch( src, html => {
					FS.writeFile(tar, html, err => {
						Trace(err || "rastered");
						DEBE.stop( () => process.exit() );
					});
				});

			else
				CP.exec(`phantomjs rasterize.js ${src} ${tar}`, (err,log) => {
					Trace(err || "rastered");
					DEBE.stop( () => process.exit() );
				});
		})
}, (cmd,ctx) => $(cmd,ctx) ));

// UNCLASSIFIED
