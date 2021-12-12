// UNCLASSIFIED 

const 									
	// globals
	ENV = process.env,
	READ = require("reader"),		// partial config of NLP (avoids string prototype collision)
	
	// NodeJS modules
	CLUSTER = require("cluster"),
	STREAM = require("stream"), 		//< pipe streaming
	CRYPTO = require("crypto"),
	CP = require("child_process"), 		//< Child process threads
	FS = require("fs"), 				//< filesystem and uploads
	VM = require("vm"),					//< virtual machines
	OS = require("os"),					//< os utilities
	REPL = require("repl"),
			
	// 3rd party modules
	  
	JSMIN = require("uglify-js"), 		//< code minifier
	HMIN = require("html-minifier"), 	//< html minifier
	MAIL = require('nodemailer'),		// MAIL mail sender
	IMAP = require('imap'),				// IMAP mail receiver
	RSS = require('feed'),				// RSS / ATOM news feeder
	//PDF = require('pdffiller'), 		// pdf form processing
	//SMTP = require('nodemailer-smtp-transport'),
	//RSS = require('feed-read'), 		// RSS / ATOM news reader
			
	ODOC = require("officegen"), 		//< office doc generator
	LANG = require('i18n-abide'), 		//< I18 language translator
	ARGP = require('optimist'),			//< Command line argument processor
	TOKML = require("tokml"), 			//< geojson to kml convertor
	
	// include modules
	EAT = require("./ingesters"),	
	
	// totem modules
	TOTEM = require("totem"),
	ATOM = require("atomic"), 
	ENUMS = require("enums"),
	$ = require("man"),
	RAN = require("randpr"),
	PIPE = require("pipe"),
	SKIN = require("skin"),
	BLOG = require("blog"),
	DOGS = require("dogs");

const 
	{ exec } = CP,
	{ Copy,Each,
	 isKeyed,isString,isFunction,isError,isArray,isObject,isEmpty,
	 typeOf,Stream, Fetch } = ENUMS,
	{ readers, scanner } = READ,
	{ skinContext, renderSkin, renderJade } = SKIN,
	{ runTask, queues, 
		sqlThread, errors, paths, cache, site, byTable, 
		watchFile, timeIntervals, neoThread, startJob, $master } = TOTEM,
	{ JIMP } = $,
	{ 
		/*
		savePage,
		exePlugin, simPlugin,
		exportPlugin, importPlugin, blogPlugin, statusPlugin, storesPlugin, usersPlugin, suitorsPlugin, helpPlugin, getPlugin, 
		modifyPlugin, docPlugin, 
		matchPlugin, trackPlugin, publishPlugin,
		*/
		//feedPlugin, savePlugin,
		navigate } = byTable;

/**
@module DEBE.String
*/
Copy({
	/**
	Returns a ref-joined list of links
	@extends Array
	@param {String} ref
	*/
	linkify: function (ref) {
		return ref ? this.link(ref) : this.replace( /\[([^\[\]]*)\]\(([^\)]*)\)/g, (str,lab,url) => lab.link(url) );
	},
	
	mailify: function ( label, tags ) {
		return this ? label.link( "mailto:"+this.tag("?", tags || {}) ) : "missing email list";
	},
	
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
			
			if ( !n ) Log(hit.title,aligns);
			
			aligns[0].forEach( al => aligned.push( al.y ) );
			hit.score = score;
			hit.title += " => " + aligned.join(" ");
			//Log(">>>t", x0.join(">"), y0.join(">") );
		});
		
		hits = hits.sort( (a,b) => b.score-a.score );
	},
	
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
	Creates an html table from an array.
	@param {Boolean} noheader switch to enable header processing
	*/
	gridify: function (rehead,style) {	//< dump dataset as html table
		function join(recs,sep) { 
			switch (recs.constructor) {
				case Array: 
					return this.join(sep);

				case Object:
					var rtn = [];
					for (var n in this) rtn.push(this[n]);
					return rtn.join(sep);

				default:
					return this;
			}
		}

		function table(recs) {  // generate an html table from given data or object
			switch (recs.constructor) {
				case Array:  // [ {head1:val}, head2:val}, ...]  create table from headers and values

					var rtn = "";
					const heads = {}, rec0 = recs[0];

					if (rehead && rec0) {
						if ( rec0.forEach )
							rec0.forEach( (val,key) => heads[key] = rehead[key] || key );

						else																		
							Each(rec0, (key,val) => heads[key] = rehead[key] || key );

						var row = "";
						Each(heads, (key,val) => row += val.tag("th", {}) );

						rtn += row.tag("tr", {});
					}

					recs.forEach( (rec,idx) => {
						var row = "", intro = true;
						Each(heads, (key,val) => {
							if (val = rec[key])
								row += val.forEach
									? table(val)
									: (val+"").linkify().tag("td", intro ? {class:"intro"} : {});
							else
								row += ((val==0) ? "0" : "").tag("td", {});

							intro = false;
						});
						rtn += row.tag("tr", {});
					});

					return rtn.tag("table",style || {border:0,width:"100%"}); //.tag("div",{style:"overflow-x:auto"});

				case Object: // { key:val, ... } create table dump of object hash

					var rtn = "";
					Each(recs, (key,val) => {
						if (val)
							rtn += isArray(val)
								? table(val)
								: (key.tag("td", {}) + JSON.stringify(val).tag("td", {})).tag("tr", {});
					});

					return rtn.tag("table",{});

				default:
					return recs+"";
			}
		}

		function dump(x) {
			rtn = "";
			for (var n in x)  {
				switch ( x[n].constructor ) {
					case Object:
						rtn += dump( x[n] ); break;
					case Array:
						rtn += n+"[]"; break;
					case Function:
						rtn += n+"()"; break;
					default:
						rtn += n;
				}
				rtn += "; ";
			}
			return rtn;
		}

		return  table( this );
	},
	
	/**
	Groups each "x.y.z. ...." spec in the list.

	@param {string} dot item seperator
	*/
	groupify: function (dot) {
		var src = {};
		this.forEach( key => src[key] = key.split(dot).pop() ); 

		return [].joinify( Copy(src, {} ,dot) );
	},

	/**
	Blogs each string in the list.

	@see totem:blogify
	@param {List} keys list of keys to blog
	@param {String} ds Name of dataset being blogged
	@param {Function} cb callback(recs) blogified version of records
	*/
	blogify: function ( req, key, ds, cb ) {
		const 
			{ sql, flags, client, profile, table, type, host } = req,
			{ site, licenseCode } = DEBE,
			//{ master } = site,
			book = ds;

		var 
			product = table+".html",
			recs = this,
			ctx = {
				host: host,
				table: table,
				client: client,
				type: type
			};


		//Log(">>>blog", ctx);
		var
			fetchBlog = ( rec, cb ) => {
				var 
					isEnum = (rec.Pipe||"").startsWith("{"),		// is client doing an enumerated pipe ?
					src = (ds+".json").tag("?", { 		// define default src key
						name: isEnum
							? rec.Name + "-*"	// request all children cases
							: rec.Name			// request only this case
					});

				//Log(">>>>>>>>>>blog", src, ds, key, rec[key]);

				if ( md = rec[key] ) // have valid markdown
					md.blogify(src, ctx, rec, html => {	// blog it
						cb( flags.kiss
								? html 	// keep it simple
								: [	// add options
									site.nick.link( "/" ),
									"schema".link( `xfan.view?src=${ds}.schema?name=${rec.Name}&w=4000&h=600` ),
									"run".link( `${book}.exe?Name=${rec.Name}` ),
									"goto".link( `${book}.view` ),
									"publish".link( `${book}.pub` ),
									"tou".link( `${book}.tou` ),
									"open".link( `${book}.blog?key=${key}&name=${rec.Name}&subs=${isEnum}` ),
									(new Date().toDateString()) + "",
									( client.match( /(.*)\@(.*)/ ) || ["",client] )[1].link( "email:" + client )
								].join(" || ") + "<br>" + html
						);

						if ( profile.Track ) 	// client is being tracked
							if ( licenseCode ) { // code licensor installed
								licenseCode( sql, html, {  // register this html with this client
									_Partner: client,
									_EndService: "",  // leave empty so lincersor wont validate by connecting to service
									_Published: new Date(),
									_Product: product,
									Path: "/tag/"+product
								}, pub => {
									if (pub) {
										//cb( `${rec.topic}=>${req.client}`.link( "/tags.view" ) );
										sql.query("INSERT INTO openv.tags SET ? ON DUPLICATE KEY UPDATE Views=Views+1", {
											Viewed: pub._Published,
											Target: pub._Partner,
											Topic: table,
											License: pub._License,
											Message: "viewed".link( "/decode.html".tag("?", {
												Target:pub._Partner,
												License:pub._License,
												Topic:table
											}))
										});
									}
								});		
								Log(`TRACKING ${client}`);
							}
					}); 

				else
					cb( "empty" );
			};

		recs.serialize( fetchBlog, (rec, blog) => {
			if (rec) 
				rec[key] = blog;

			else 
				cb( recs );
		});
	},

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
	//Log([n,k,recs.length, Recs.length, idx, rec[idx], Rec[idx]]);

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
			//Log("node>>", "isobj", isKeyed(store), store.constructor.name );

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

		//Log(">>root", root);

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

	//Log([level,keys,ref,idx]);

		if (key)
			for (var ref = rec[key]; pos < end; ) {
				var stop = (idx==end) ? true : (rec[key] != ref);

				if ( stop ) {
					//Log([pos,idx,end,key,ref,recs.length]);

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
	},

	/**
	Joins a list with an optional callback cb(head,list) to join the current list 
	with the current head.

	@param {Function} cb
	@example
		[	a: null,
			g1: [ b: null, c: null, g2: [ x: null ] ],
			g3: [ y: null ] ].joinify()

	returning a string
		"a,g1(b,c,g2(x)),g3(y)"
	*/
	joinify: function (src) {
		var 
			rtn = [];

		//Log(">keys=", Object.keys(src));

		Object.keys(src).forEach( key => {
			var list = src[key];

			if ( isString(list) )
				rtn.push( list );

			else
				rtn.push( key + "(" + [].joinify(list) + ")" );
		});

		//Log(">>rtn", rtn);
		return rtn.join(",");
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
Provides UI interfaces to the [barebone TOTEM web service](https://github.com/totemstan/totem) 
to support notebooks and other entities.  This module documented 
in accordance with [jsdoc]{@link https://jsdoc.app/}.

@module DEBE
@author [ACMESDS](https://totemstan.github.io)

@requires crypto
@requires child_process
@requires fs
@requires stream
@requires cluster
@requires repl

@requires i18n-abide
@requires optimist
@requires tokml
@requires mathjax-node

@requires totem
@requires atomic
@requires geohack
@requires man
@requires randpr
@requires enums
@requires reader
@requires skin
@requires blog
@requires dogs

@example 

// npm test D2
// Start challenge-protected server with additional byTable-routed entpoints.

DEBE.config({
	riddles: 10,
	"byTable.": {
		wfs: function (req,res) {
			res("here i go again");

			Fetch(ENV.WFS_TEST, data => {
				Log(data);
			});
		}
	}
}, sql => {
	Log( "This bad boy in an encrypted service with a database and has an /wfs endpoint" );
});	

@example 

// npm test D3
// Start server using default config

DEBE.config({
}, sql => {
	Log( "Stateful network flow manger started" );
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

DEBE.config({
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
			}, err => Log("add", err) );
		}
	});
});

*/

const
	{ sendMail, Log, Trace, routeTable, pluginLibs,
	 	licenseOnDownload, defaultDocs } = DEBE = module.exports = Copy({
	
	Log: (...args) => console.log(">>>debe", args),
	Trace: (msg,req,res) => "debe".trace(msg,req,res),
		
	/**
	Inspect doc - kludge i/f to support nlp project
	*/
	inspector: (doc,to,cb) => {
		
		Log("sendmail", doc,to);
		
		if ( ! to.endsWith("@totem.org") && ! to.endsWith(".mil") )
			sendMail({	// send email to those outside totem's eco system
				subject: "Important totem message",
				text: doc,
				to: to
			});
		
		const
			[x,Doc,Topic] = doc.match( /(.*)#(.*)/ ) || ["",doc,""];
		
		scanner(Doc, Topic||"default", 0.1, score => {
			Log(doc,score);
			cb(score);
		});
			
	},
		
	pluginLibs: {   // share these modules with engines
		$: $,
		$ran: opts => new RAN(opts),
		$log: console.log,
		$task: runTask,
		$jimp: JIMP,
		$sql: sqlThread,
		$neo: neoThread,
		$copy: Copy,
		$each: Each,
		$api: () => CP.exec( `firefox ${site.master}/quickapi.view` )
	},
	
	/**
	License code
	*/
	licenseCode: ( sql, code, pub, cb ) => {  //< callback cb(pub) or cb(null) on error

		function validateLicense(pub, cb) {

			function genLicense(code, secret) {  //< callback cb(minifiedCode, license)
				Log("gen license", secret);
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
	
	/*
	pipeSuper: {		//<  pipe supervisor by pipe type
		stream: pipeExport,
		export: pipeExport,
		csv: pipeCsv,
		nitf: pipeImage,
		png: pipeImage,
		jpg: pipeImage,
		json: pipeJson,
		exe: pipeJson,
		txt: pipeDoc,
		xls: pipeDoc,
		html: pipeDoc,
		odt: pipeDoc,
		odp: pipeDoc,
		ods: pipeDoc,
		pdf: pipeDoc,
		xml: pipeDoc,
		nb: pipeBook,
		db: pipeBook,
		"": pipeBook,
		aoi: pipeAOI
	}, */
	
	/**
	Route table to a database according to security requirements.
	*/
	"tableRoutes.": {  //< sql table re-routers
		profiles: req => "openv.profiles",
		sessions: req => "openv.sessions",
		relays: req => "openv.relays",
		nlprules: req => "openv.nlprules",
		
		lookups: req => "openv.lookups",
		
		projects: req => "openv.projects",
		
		milestones: req => "openv.milestones", 
		
		engines: req => { // protect engines 
			//Log("<<<", req);
			return "openv.engines";
			
			const { overlord } = {overlord: "guest@guest.org"}; //site.pocs;
			
			//Log(">>>sec check", site.pocs, req.client);
			
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
		
		faqs: req => {
			if ( set = req.set ) {
				set._By = req.client;
				set._Dirty = true;
			}
			return "openv.faqs";
		}
	},

	// blogContext: BLOG,		//< blogging / skinning context
	
	defaultDocs: {	// default plugin docs (db key comments)
		nodoc: "no documentation provided",

		Export: "Write notebook results [into a file](/api.view)",
		Ingest: "Ingest notebook results [into the database](/api.view)",
		
		Batch: "Batch size during pipe",
		Threshold: "Acceptance threshold during pipe",
		Limit: "Number of accepted records during pipe",
		
		Name: "Unique usecase name",
		
		//Script: `Script to munge data: $.X(...) with X = resize || greyscale || sym || shuffle || get.`,
		
		Pipe: `
Place data source into a buffered, regulated, enumerated, event or named *Pipe*:
	"PROTOCOL://HOST/ENDPOINT ? QUERY"
	"/FILE.TYPE ? _batch=N & _limit=N & _start=DATE & _end=DATA & _every=sec||min||hr||... & _util=N & _on=N & _off=N & _watch=N & _propose=N & _basline=N,...N & _agent=X & REKEY=EVAL||KEY"
	{ "KEY" :  [N, ...] || "MATHJS" , noClobber:N, noRun:N } || { "$" : "MATHJS" } 
	[ EVENT, ... ]
	".CASE.NOTEBOOK"

as described in the [api](/api.view).  `,

		Description: `
Document your notebook's usecase using [markdown](/api.view):
	$VIEW{ SRC ? w=WIDTH & h=HEIGHT & x=KEY$INDEX & y=KEY$INDEX ... }
	\${ JS }
	[ LINK ] ( URL )
	$$ inline TeX $$ || n$$ break TeX $$ || a$$ AsciiMath $$ || m$$ MathML $$
	TeX := TeX || #VAR || VAR#KEY#KEY...
	| GRID | ... |
	# SECTION
	ESCAPE || $with || $for || $if:
		BLOCK

as described in the [Notebooks api](/api.view). `,

		Entry: `
Prime your notebook's context KEYs on entry:
	{ "KEY": "SELECT ...." || VALUE, ... }  

as described in the [Notebooks api](/api.view). `,

		Exit: `
Save your notebook's context KEYs on exit:
	{ "KEY": "UPDATE ....", ... }

as described in the [Notebooks api](/api.view). `,

		Ring: "[[lat,lon], ...] in degs 4+ length vector defining an aoi",
		
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
	
	licenseOnDownload: true,
			
	/**
	*/
	sendMail: (opts,cb) => {
	
		const {txMail} = DEBE;
		
		if (opts.to) {
			//opts.from = "totem@noreply.net"; 
			/*opts.alternatives = [{
				contentType: 'text/html; charset="ISO-59-1"',
				contents: ""
			}]; */

			//Log(">>>sendmail", opts);
			txMail.sendMail(opts, (err,info) => {
				//Log(">>>email", err,info);
				if ( cb ) cb(info);
			});
		}
	},
	
	onUpdate: function (sql,ds,body) { //< runs when dataset changed
		//Log("update", ds, body);
		if (false)
		sql.Hawk({Dataset:ds, Field:""});  // journal entry for the record itself
		
		if (false)   // journal entry for each record key being changed
			for (var key in body) { 		
				sql.Hawk({Dataset:ds, Field:key});
				sql.Hawk({Dataset:"", Field:key});
			}
	},

	/**
	Initialize DEBE on startup.
	@param {Object} sql MySQL connector
	@param {Function} init callback(sql) when service init completed
	*/
	initialize: (sql,init) => {	//< initialize service
		
		function startNews(sql, engine) {
			
			var
				news = new RSS({					
					title:          site.nick,
					description:    site.title,
					link:           `${paths.HOST}/feed.view`,
					image:          'http://example.com/image.png',
					copyright:      'All rights reserved 2013',
					author: {
						name:       "tbd",
						email:      "noreply@garbage.com",
						link:       "tbd"
					}
				});
			
			sql.query("SELECT * FROM openv.feeds WHERE NOT ad")
			.on("result", feature => {
				news.addItem({
					title:          feature.feature,
					link:           `${paths.host}/feed.view`,
					description:    JSON.stringify(feature),
					author: [{
						name:   "tbd", //FLEX.site.title,
						email:  "tbd@undefined",
						link:   paths.host
					}],
					/*contributor: [{
						name:   FLEX.TITLE,
						email:  site.email.SOURCE,
						link:   paths.host
					}],*/
					date:           feature.found
					//image:          posts[key].image
				});
			});	

			news.render("rss-2.0");  // or "atom-1.0"
		}

		function startMail(cb) {
			
			const
				[rxHost,rxPort] = (ENV.RXMAIL_HOST || "").split(":"),
				[rxUser,rxPass] = (ENV.RXMAIL_USER || "").split(":"),
				[txHost,txPort] = (ENV.TXMAIL_HOST || "").split(":"),
				[txUser,txPass] = (ENV.TXMAIL_USER || "").split(":"),
					
				rxMail = DEBE.rxMail = rxHost
					? new IMAP({
						user: rxUser,
						password: rxPass,
						host: rxHost,
						port: parseInt(rxPort),
						secure: true,
						//debug: err => { console.warn(ME+">"+err); } ,
						connTimeout: 10000
					})
			
					: null,

				txMail = DEBE.txMail = txHost 
					? MAIL.createTransport({
						host: txHost,
						port: parseInt(txPort),
						auth: txUser
							? {
								user: txUser,
								pass: txPass
							}
							: null
					})

					: {
						sendMail: (opts, cb) => {
							Log(opts);   // -r "${opts.from}" 
			
							if ( DEBE.watchMail ) 
								sqlThread( sql => {
									sql.query("INSERT INTO openv.email SET ?", {
										To: opts.to,
										Body: opts.body,
										Subject: opts.subject,
										Send: false,
										Remove: false
									});
								});

							else
								exec(`echo -e "${opts.body}\n" | mailx -s "${opts.subject}" ${opts.to}`, err => {
									cb( err );
									//Log("MAIL "+ (err || opts.to) );
								});
						}
					};

			if (rxMail)					// Establish server's email inbox	
				rxMail.connect( err => {  // login cb
					if (err) Log(err);

					rxMail.openBox('INBOX', true, (err,mailbox) => {

						if (err) Log(err);

						rxMail.search([ 'UNSEEN', ['SINCE', 'May 20, 2012'] ], (err, results) => {

							if (err) Log(err);

							rxMail.Fetch(results, { 
								headers: ['from', 'to', 'subject', 'date'],
								cb: fetch => {
									fetch.on('message', msg => {
										Log('Saw message no. ' + msg.seqno);
										msg.on('headers', hdrs => {
											Log('Headers for no. ' + msg.seqno + ': ' + hdrs);
										});
										msg.on('end', () => {
											Log('Finished message no. ' + msg.seqno);
										});
									});
								}
							}, err => {
								if (err) throw err;
								Log('Done fetching all messages!');
								rxMail.logout();
							});
						});
					});
				});
				
			if (cb) cb(null);
		}
				
		function initSES(cb) {	// init sessions
			Log(`INIT SESSIONS`);

			/*
			Each( CRUDE, function (n,routes) { // Map engine CRUD to DEBE workers
				DEBE.byTable[n] = ATOM[n];
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
			Log(`INIT ENVIRONMENT`);

			var 
				args = ARGP
				.usage("$0 [options]")

				.default('spawn',DEBE.isSpawned)
				.boolean('spawn')
				.describe('spawn','internal hyper-threading option')
				.check(function (argv) {
					DEBE.isSpawned = argv.spawn;
				})

				.default('blind',DEBE.blindTesting)
				.boolean('blind')
				.describe('blind','internal testing flag')  
				.check(function (argv) {
					DEBE.blindTesting = argv.blind;
				})

				.default('dump',false)
				.boolean('dump')
				.describe('dump','display derived site parameters')  
				.check(function (argv) {
					//Log(site);
				})

				/*
				.default('start',DEBE.site.Name)
				.describe('start','service to start')  
				.check(function (argv) {
					DEBE.site.Name = argv.start;
				})
				* */

				.boolean('version')
				.describe('version','display current version')
				.check(function(argv) {
					if (argv.version) 
						Log(DEBE.site);
				})

				/*
				.default('echo',DEBE.FLAGS.DEBUG)
				.boolean('echo')
				.describe('echo','echo adjusted http request parameters')
				.check(function(argv) {
					DEBE.FLAGS.DEBUG = argv.echo;
				})*/

				.boolean('help')
				.describe('help','display usage help')
				.check( argv => {
					if (argv.help) {
						Log( ARGP.help() );

						Log("Available services:");
						sql.query("SELECT * FROM openv.apps WHERE ?",{Enabled:1})
						.on("result", app => {
							Log(app.Name+" v"+app.Ver+" url="+app.Host+":"+app.Port+" db="+app.DB+" nick="+app.Nick+" sockted="+(app.Sockets?"yes":"no")+" cores="+app.Cores+" pki="+app.PKI);
						})
						.on("error", err => Log(err) )
						.on("end", () => process.exit() );
					}
				})
				.argv;

			if (cb) cb();
		}

		function initNIF(cb) {
			sql.getTables( "app", books => {	// config notebook i/f
				books.forEach( book => {
					pluginLibs["$"+book] = (index, cb) => {
						
						function logRun( data ) {
							Log(">"+book, data);
						}
						
						function run(sql,ctx) {
							const
								req = {
									sql: sql,
									table: book,
									query: ctx,
									type: "exe"
								};

							runPlugin(req, status => cb || logRun );
						}

						if ( isString(index) ) {
							const
								[name,query] = index.split("?");

							if ( query ) 
								`/${book}.db?name=${name}&${query}`.get( cb || logRun );
								
							else
								switch (name) {
									case "view":
									case "run":
									case "xpdf":
									case "xjpg":
									case "tou":
									case "usage":
									case "brief":
									case "rtp":
									case "pub":
									case "stores":
										CP.exec( `firefox ${site.master}/${book}.${name}`, logRun );
										break;

									default:
										sqlThread( sql => run(sql, {Name:name}) );
								}
						}
						
						else
							sqlThread( sql => run(sql, Copy( index, {Name:book} )) );
					};
				});
				cb();
			});
		}
		
		/*
		function initIFS(cb) {	// init interfaces
			["select", "delete", "insert", "update", "execute"].forEach( crud => {
				DEBE.byAction[crud] = FLEX[crud];
			});

			if (cb) cb();	
		} */
		const 
			{lookups} = SKIN,
			{pocs,host} = site;
		
		sql.query("SELECT Ref AS `Key`,group_concat(DISTINCT Path SEPARATOR '|') AS `Select` FROM openv.lookups GROUP BY Ref", [], (err,recs) => {
			recs.forEach( rec => {
				lookups[rec.Key] = rec.Select;
			});
		});
		
		initNIF( () => {  // init nootbook i/f
		initENV( () => {  // init environment
		initSES( () => {  // init sessions
			
			if ( CLUSTER.isMaster ) {
				if ( false ) startNews(sql);

				startMail( err => {
					if (false)
					sendMail({		// notify admin service started
						to: site.pocs.admin,
						subject: site.nick + " started", 
						text: "Just FYI"
					} );
				});

				// reset file watchers
				/*
				sql.query( "SELECT File FROM openv.watches WHERE substr(File,1,1) = '/' GROUP BY File", [] )
				.on("result", link => {
					ENDPTS.autorun.set( link.File );
				});	*/

				if ( false ) {	// clear graph database
					sql.query("DELETE FROM openv.nlpactors");
					sql.query("DELETE FROM openv.nlpedges");
				}
				
				/*	
				if ( false ) // build endpoint docs					
					Stream(byTable, {}, (val,skey,cb) => {	// system endpoints
						if ( cb ) // streaming
							if ( val.name == "sysNav" ) 
								cb( "Navigator".replace(/\n/mg,"<br>") );
						
							else
								Fetch( `${host}/${skey}.help`, help => {
									//Log(">>>>help",key,val.name, help);
									cb( `${skey}: ${help}`.replace(/\n/mg,"<br>") );
								});

						else	// stream terminated
							Stream( FLEX.select, {}, (val,fkey,cb) => {	// flex endpoints
								if ( cb )	// streaming
									Fetch( `${host}/${fkey}.help`, help => {
										//Log(">>>>help",key,val.name, help);
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
				*/
			}

			site.mods.forEach( mod => site["$"+mod] = site.$repo+"/"+mod );
			
			SKIN.config({
				context: site,
				route: routeTable
			});
			
			/*
			FLEX.config({ 		// table emulation
				sqlThread: sqlThread,
				//emitter: DEBE.IO ? DEBE.IO.sockets.emit : null,
				//skinner: JADE,
				// $libs: pluginLibs,
				sendMail: sendMail,
				createCert: TOTEM.createCert,
				//diag: TOTEM.diag,
				getList: TOTEM.filterFile,
				Fetch: TOTEM.Fetch,
				site: TOTEM.site						// Site parameters
			}); */

			$.config({		// matrix manipulator
				sqlThread: sqlThread,
				runTask: runTask,
				//fetch: fetch
			}, $ => {
				
				sqlThread( sql => {
					const 
						{saveKeys,scripts} = $;

					/*
					sql.getFields("openv._stats", {}, keys => {		//  init shared file stats
						keys.forEach( key => saveKeys[key] = true );
					}); */

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
											Log( "Bad $script", script );
										}

									else
										scripts[ rec.Name ] = script;
								}
							});
					});
				});

			});

			ATOM.config({		// plugin/notebook/engine manager
				//ipcFeed: feedPlugin,
				//ipcSave: savePlugin,
				sqlThread: sqlThread,
				cores: 0,
				node: ENV.HOSTNAME,
				"$libs.": pluginLibs
			});

			READ.config({
				jimp: JIMP,
				sqlThread: sqlThread
			});
			
			init(sql);
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
	Filters via request flags
	*/
	"filterFlag." : {  
		
		"traps.": {  // TRAP=name flags can modify the request flags
			/*
			save: function (req) {  //< _save=name retains query in named engine
				var 
					sql = req.sql,
					cleanurl = req.url.replace(`_save=${req.flags.save}`,"");

				Log(`PUBLISH ${cleanurl} AT ${req.flags.save} FOR ${req.client}`, req);sql
				sql.query("INSERT INTO openv.engines SET ?", {
					Name: req.flags.save,
					Enabled: 1,
					Type: "url",
					Code: cleanurl
				});
			}, */

			browse: function(req) {	//< _browse=name navigates named folder
				var query = req.query, flags = req.flags;
				query.NodeID = parseInt(query.init) ? "" : query.target || "";
				flags.nav = [query.NodeID, query.cmd];
				delete query.cmd;
				delete query.init;
				delete query.target;
				delete query.tree;
			},

			view: function (req) {   //< ?_view=name correlates named view to request dataset
				req.sql.query("INSERT INTO openv.viewers SET ?", {
					Viewer: req.flags.view,
					Dataset: req.table
				});	
			}
		},
		
		select: (recs,req,res) => {
			const
				{ flags } = req,
				{ select } = flags,
				opts = [],
				id = "_"+select;
			
			//Log("select", recs);
			// _select=Client,window.open(`/
			//  iframe(src="/junk.html")
			recs.forEach( rec => opts.push( rec[select].tag("option",{value:rec[select]}) ));
			res( opts.join("").tag("select",{id:id,src:"/test.txt",onchange: `alert(${id}.getAttribute("src"))` }) );
											 	// `window.open("/nb.mod?"+_Client_Type.value+"="+${id}.value)`}) );			
		},
		
		blog: (recs,req,res) => {  //< renders dataset records
			const 
				{ flags, table, query } = req,
				{ blog } = flags;
			
			//Log("blog", flags);
			
			if ( blog )
				if ( recs.forEach )
					recs.blogify( req, "Description", "/"+table, res );
			
				else
					res(recs);
			
			else
				res(recs);
		},
		
		$: (recs,req,res) => {
			const { flags } = req;
			var rtn = recs;
			
			Each( flags, (flag,script) => {
				
				function indexArray(ctx) {
					Each( store[0] || {} , (key,val) => ctx[key] = store.get(key) );
					//Log("getctx", store, script);
					if ( script ) $( "$="+script, ctx );
					return $.toList(ctx.$);					
				}
				
				function indexObject(ctx) {
					Each( store, (key,val) => ctx[key] = store[key] );
					//Log("getctx", store, script);
					if ( script ) $( "$="+script, ctx );
					return $.toList(ctx.$);					
				}
				
				if ( flag.startsWith("$") ) {
					var 
						ctx = { 
							$: flag.parseJS({$: recs}) || 0,
							list: function () {
								var 
									args = Object.keys(arguments),
									rtn = [];

								args.forEach( arg => rtn.push( $.toList(arguments[arg] )) );
								return rtn;	
							}
						},
						store = ctx.$;
					
					//Log("$>>>>>>", flag, script, typeOf(store) );
					if ( isArray(store) )
						rtn = indexArray(ctx);
					
					else
					if ( isObject(store) )
						rtn = indexObject(ctx);
					
					else
						rtn = store;
				}
			});
			
			res( rtn );
		}
		
		/*
		calc: (recs,req,res) => {
			const { flags } = req;
			var 
				recs = recs.unpack(),
				rec = recs[0] || {},
				ctx = { 
					//nomap: true,
					$: recs,
					$$: rec,
					$$$: rec.Save || [],
					x: rec.x || [],
					y: rec.y || [],
					scale: (x,a) => {
						var 
							X = x._data || x,
							A = a._data || a,
							K = A.length,
							N = X.length;
						
						return $.toMatrix( $(N, (n,v) => {
							v[n] = $( K, (k,u) => u[k] = X[n][k] * A[k] );
						}) );
					},
					cat: function () {
						var 
							args = Object.keys(arguments),
							rtn = [];
						
						args.forEach( arg => rtn.push( $.toList(arguments[arg] )) );
						return rtn;	
					},
					get: function ( x, idx ) {
						var 
							args = Object.keys(arguments).slice(1),
							N = args.length,
							X = x._data || x;

						if ( idx )
							if ( N > 1 ) 
								return $( N, (n,R) => R[n] = X.get( arguments[args[n]] ) );

							else
							if ( isArray(X) ) 
								return X.get(idx);

							else
								return X[idx];
						
						else
							return x;
					}
				};
			
			$( "calc="+flags.calc, ctx, ctx => {
				if ( ctx ) 
					if ( calc = ctx.calc ) {
						if ( typeOf(calc) == "Object" )
							Each(calc, (key,val) => calc[key] = $.toList(val) );

						res( calc );
					}

					else
						res( null );
				
				else
					res( null );
			});
		} */
		
	},
											 
	/**
	Filter dataset recs on specifed req-res thread
	*/	
	"filterType." : { 
		
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
			Log(Recs);
		},
		
		db: (recs, req, res) => {	
			res({ 
				success: true,
				msg: "ok",
				count: recs.found || recs.length,
				data: recs
			});
			/*
			req.sql.query("select found_rows()")
			.on('result', stat => {		// records sourced from sql	
				Log(">>>>>>", stat);
				res({ 
					success: true,
					msg: "ok",
					count: stat["found_rows()"] || 0,
					data: recs
				});
			})
			.on("error", () => {  		// records sourced from virtual table
				res({ 
					success: false,
					msg: "busy",
					count: 0,
					data: []
				});
			}); */
		},
		
		kml: (recs,req,res) => {  //< dataset.kml converts to kml
			res( TOKML({}) );
		},
		
		flat: (recs,req,res) => { //< dataset.flat flattens records
			recs.forEach( (rec,n) => {
				var rtns = new Array();
				for (var key in rec) rtns.push( rec[key] );
				recs[n] = rtns;
			});
			res( recs );
		},
		
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
		
		html: (recs,req,res) => { //< dataset.html converts to html
			res( recs.gridify({},{border: "1"}) );
		},

		// MS office doc types
		xdoc: genDoc,
		xxls: genDoc,
		xpps: genDoc,
		xppt: genDoc,
		
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
		
		schema: (recs,req,res) => { //< dataset.schema 
			var 
				flags = req.flags,
				query = req.query,
				src = ("/"+req.table+".json").tag("?",{name:query.name});
			
			//Log(">>src", src);
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
	Endpoints /AREA/FILE routes by file area on specifed req-res thread
	*/
	"byArea.": {
		default: navigate
	},

	/**
	Endpoints /TABLE routes by table name on specifed req-res thread
	*/
	"byTable.": {
		// nlp

		/**
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
		*/
		searches: (req,res) => {
			const 
				{ sql, query, type } = req,
				//{ getList, Fetch } = FLEX,
				{ file, find, out, htmlout } = query,
				[x,name,Type] = (file||"").match(/(.*)\.(.*)/) || [],
				path = "/config/stores/" + file,
				save = "/config/uploads/" + name + (htmlout ? ".html" : ".txt");

			Log(name,Type,path,save);

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

									//Log( json.items[0] );

									json.items.forEach( (item,n) => {
										var 
											map = item.pagemap || {},
											tags = map.metatags || [],
											meta = tags[0] || {};

										if ( !n ) Log( JSON.stringify( item) );							
										Log(n,item.title,"=>", item.title.trimGoogle() );

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
								//FS.writeFile( save, JSON.stringify(hits), "utf8", err => {} );
							});

						else
							res( new Error("bad search engine specified") );

						break;

					case "list":
						//req.type = "html";
						res( "claim results "+"here".link(save.substr(1)) );

						FS.writeFileSync(save,"","utf8", err => {});

						getList( path, {batch: 100, keys: ["file"]}, recs => {
							if ( recs )
								recs.forEach( rec => {
									Fetch( `http:/read?file=${rec}`, txt => {
										FS.appendFile(save, txt, "utf8", err => {});
									});
								});

							else
								Log("done!");
						});

						break;

					default:
						if ( reader = readers[Type] ) 
							reader( path, txt => {
								//FS.writeFile(save,txt,"utf8",err => {});
								res(txt);
							});	

						else
							res( new Error("no reader for specified file") );
				}

			else
				res( new Error("no file specified") );

		},

		/**
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

			Log(src,_keys,N);

			if ( src )
				Fetch( "file:/config/stores/", files => {

					files.forEach( file => {
						var [matched,evid] = file.match(search) || [] ;
						if ( matched ) 
							matches.push( {evid: evid, file: `./config/stores/${file}`} );
					});

					if ( N ) matches = matches.slice(0,N);

					Log(matches);
					matches.forEach( match => {

						FS.readFile( match.file, "utf8", (err,text) => {
							if (!err) 
								sql.query("SELECT * FROM app.?? WHERE ? LIMIT 1", ["gtd",{evid: match.evid}], (err,recs) => {
									//Log(err);
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
		*/
		wms: (req,res) => {

			const
				{sql,query,type} = req,
				{src} = query;

			if ( type == "help" ) 
			return res("Provided image catalog service for src = dglobe | omar | ess.");

			res("ok");
			switch (src) {
				case "dglobe":
				case "omar":
				case "ess":
				default:
			}

			if ( url = ENV[`WMS_${src.toUpperCase()}`] ) 
				Fetch(url.tag("?", query), rtn => Log("wms returned", rtn) );
		},

		/**
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

									//Log(collect);
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
						Log("tips",[err,q.sql]);
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
		*/
		follow: (req,res) => {  // follow a link
			const {sql,query,type} = req;

			if ( type == "help" ) 
			return res("Track client's link selections.");

			res("ok");

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

			//Log(query.score, query.pass, [topic, set, mod, mods].join("."));

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

		uploads: fileUpload,
		stores: fileUpload, 

		/**
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
		Folder navigator.
		*/
		navigate: (req,res) => {
			function sendFolder(res,recs) {
				//Log("sending",cwd, recs);
				if ( false ) // debug
					res({  
						cwd: { 
							"mime":"directory",
							"ts":1334071677,
							"read":1,
							"write":0,
							"size":0,
							"hash": "/root/",
							"volumeid":"l1_",
							"name":"Demo",
							"locked":1,
							"dirs":1},

						/*"options":{
							"path":"", //"Demo",
							"url":"", //"http:\/\/elfinder.org\/files\/demo\/",
							"tmbUrl":"", //"http:\/\/elfinder.org\/files\/demo\/.tmb\/",
							"disabled":["extract"],
							"separator":"\/",
							"copyOverwrite":1,
							"archivers": {
								"create":["application\/x-tar", "application\/x-gzip"],
								"extract":[] }
						},*/

						files: [{ 
							"mime":"directory",
							"ts":1334071677,
							"read":1,
							"write":0,
							"size":0,
							"hash": "/root/",
							"volumeid":"l1_",
							"name":"Demo",
							"locked":1,
							"dirs":1}].concat([
							/*{  // cwd again
								"mime":"directory",
								"ts":1334071677,
								"read":1,
								"write":0,
								"size":0,
								"hash":"root",
								"volumeid":"l1_",
								"name":"Demo",
								"locked":1,
								"dirs":1},*/

							/*{
							"mime":"directory",
							"ts":1334071677,
							"read":1,
							"write":0,
							"size":0,
							"hash":"root",
							"volumeid":"l1_",
							"name":"Demo",
							"locked":1,
							"dirs":1},*/

							{
								"mime":"directory",
								"ts":1340114567,
								"read":0,
								"write":0,
								"size":0,
								"hash":"l1_QmFja3Vw",
								"name":"Backup",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1310252178,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_SW1hZ2Vz",
								"name":"Images",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1310250758,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_TUlNRS10eXBlcw",
								"name":"MIME-types",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1268269762,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_V2VsY29tZQ",
								"name":"Welcome",
								"phash":"/root/",
								"locked":1,
								"dirs":1},

							{
								"mime":"directory",
								"ts":1390785037,
								"read":1,
								"write":1,
								"size":0,
								"hash":"l2_Lwxxyyzz",
								"volumeid":"l2_",
								"name":"Test here",
								"locked":1},

							{
								"mime":"application\/x-genesis-rom",
								"ts":1310347586,"read":1,
								"write":0,
								"size":3683,
								"hash":"l1_UkVBRE1FLm1k",
								"name":"README.md",
								"phash":"/root/",
								"locked":1}
						]),

						api: "2.0","uplMaxSize":"16M","netDrivers":[],

						debug: {
							"connector":"php",
							"phpver":"5.3.26-1~dotdeb.0",
							"time":0.016080856323242,
							"memory":"1307Kb \/ 1173Kb \/ 128M",
							"upload":"",
							"volumes":[
								{	"id":"l1_",
									"name":"localfilesystem",
									"mimeDetect":"internal",
									"imgLib":"imagick"},

								{	"id":"l2_",
									"name":"localfilesystem",
									"mimeDetect":"internal",
									"imgLib":"gd"}],

							"mountErrors":[]}
					});

				else
				if ( false ) // debug
					res({  
						cwd: cwd,

						/*"options":{
							"path":"", //"Demo",
							"url":"", //"http:\/\/elfinder.org\/files\/demo\/",
							"tmbUrl":"", //"http:\/\/elfinder.org\/files\/demo\/.tmb\/",
							"disabled":["extract"],
							"separator":"\/",
							"copyOverwrite":1,
							"archivers": {
								"create":["application\/x-tar", "application\/x-gzip"],
								"extract":[] }
						},*/

						files: [cwd].concat([
							/*{  // cwd again
								"mime":"directory",
								"ts":1334071677,
								"read":1,
								"write":0,
								"size":0,
								"hash":"root",
								"volumeid":"l1_",
								"name":"Demo",
								"locked":1,
								"dirs":1},*/

							/*{
							"mime":"directory",
							"ts":1334071677,
							"read":1,
							"write":0,
							"size":0,
							"hash":"root",
							"volumeid":"l1_",
							"name":"Demo",
							"locked":1,
							"dirs":1},*/

							{
								"mime":"directory",
								"ts":1340114567,
								"read":0,
								"write":0,
								"size":0,
								"hash":"l1_QmFja3Vw",
								"name":"Backup",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1310252178,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_SW1hZ2Vz",
								"name":"Images",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1310250758,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_TUlNRS10eXBlcw",
								"name":"MIME-types",
								"phash":"/root/",
								"locked":1},

							{
								"mime":"directory",
								"ts":1268269762,
								"read":1,
								"write":0,
								"size":0,
								"hash":"l1_V2VsY29tZQ",
								"name":"Welcome",
								"phash":"/root/",
								"locked":1,
								"dirs":1},

							{
								"mime":"directory",
								"ts":1390785037,
								"read":1,
								"write":1,
								"size":0,
								"hash":"l2_Lwxxyyzz",
								"volumeid":"l2_",
								"name":"Test here",
								"locked":1},

							{
								"mime":"application\/x-genesis-rom",
								"ts":1310347586,"read":1,
								"write":0,
								"size":3683,
								"hash":"l1_UkVBRE1FLm1k",
								"name":"README.md",
								"phash":"/root/",
								"locked":1}
						]),

						api: "2.0","uplMaxSize":"16M","netDrivers":[],

						debug: {
							"connector":"php",
							"phpver":"5.3.26-1~dotdeb.0",
							"time":0.016080856323242,
							"memory":"1307Kb \/ 1173Kb \/ 128M",
							"upload":"",
							"volumes":[
								{	"id":"l1_",
									"name":"localfilesystem",
									"mimeDetect":"internal",
									"imgLib":"imagick"},

								{	"id":"l2_",
									"name":"localfilesystem",
									"mimeDetect":"internal",
									"imgLib":"gd"}],

							"mountErrors":[]}
					});

				else
				if ( cmd == "xxtree") {
					Log(">>>send tree");
					res({tree:recs});
				}

				else
					res({
						cwd: cwd, 

						options: {
							separator: "/"
						},
						/*
						options: {
							path:"/", //cwdPath,
							url:"/", //"/root/",
							tmbUrl:"/root/.tmb/",
							disabled:["extract"],
							separator: "/",
							copyOverwrite:1,
							archivers: {
								create:["application/x-tar", "application/x-gzip"],
								extract:[] }
						}, */

						files: recs, //[cwd].concat(recs),

						api: 2.1057,

						uplMaxFile: 20,
						uplMaxSize:"16M",
						netDrivers:[],

						/*
						debug: {
							connector:"php",
							phpver:"5.3.26-1~dotdeb.0",
							time:0.016080856323242,
							memory:"1307Kb \/ 1173Kb \/ 128M",
							upload:"",
							volumes:[
									{	id:"v1",
										name:"localfilesystem",
										mimeDetect:"internal",
										imgLib:"imagick"},
									{	id:"v2",
										name:"localfilesystem",
										mimeDetect:"internal",
										imgLib:"gd"}],
							mountErrors:[]
						} */
					});
			}

			const 
				{sql,query,path,client,body,action,host,area,profile,referer,type} = req;

			if ( type == "help" )
			return res("Navigate folder target=NAME/NAME/... per command cmd=open|tree|file|size|...|null" );

			const
				btoa = b => Buffer.from(b,"utf-8").toString("base64"),
				atob = a => Buffer.from(a,"base64").toString("utf-8"),
				trace = true,
				{parms} = body,
				{target,cmd,init,tree,download,src} = parms || query,
				targets = query["targets[]"],
				parent = atob(target||btoa(path||"/root/")), 
				parentHash = btoa(parent),
				[x,fpath,fname] = parent.match( /(.*)\/(.*)/ ) || ["",parent,""],
				node = fpath.split("/").pop(),
				json = parent.substr(1,parent.length-2).replace(/\/\[/g,"[").replace(/\//g,"."),
				now = new Date().getTime(),
				recs = [],
				cwd = {
					"mime":"directory",
					"ts":1334071677,
					"read":1,
					"write":0,
					"size":0,
					"hash": btoa(parent), // parent,
					"volumeid":"l1_",
					"name": "test", //node, //node,
					"locked":0,
					"dirs":1 
				};
				/*{ 
					"mime":"directory",
					"ts":1334071677,
					"read":1,
					"write":0,
					"size":0,
					"hash": parent,
					"volumeid":"v1_",
					"name": parent,
					"locked":1,
					"dirs":1
				}, */		

			if ( trace )
				Log(">>>nav", {
					cmd: cmd,
					q: query,
					p: path,
					b: body,
					tar: target,
					src: src,
					act: action,
					json: json,
					par: parent
				});

			switch (cmd) {		// look for elFinder commands
				case "tree":
				case "parents":
				case "open":	// expanding folder 
					if ( src )
						if ( src.endsWith("?") )
							if ( parent.endsWith("=/") ) {	// this is still experimental
								const
									name = parent.split("/").pop(),
									get = "http:"+src.tag("&",{name: name.substr(0,name.length-1), "json:":path.substr(1,path.length-2)});
								Log("fetch", get );
								Fetch( get, txt => {

									if ( files = JSON.parse(txt)[0].json ) {
										if ( files.forEach ) 
											sendFolder(res, files.map( (file,idx) => {
												const 
													name = "["+idx+"]/",
													nameHash = btoa(parent+name),
													type = !(isArray(file) || isObject(file)),
													info = {
														ts: now,
														size: file.length,
														hash: nameHash, 				// hash name
														name: name, 					// keys name
														phash: parentHash, 				// parent hash name

														read: 1,						// read state
														write: 1,						// write state
														locked: 0,						// lock state
														//tmb: "",						// thumbnail for images
														//alias: "",					// sumbolic link pack
														//dim: "",						// image dims
														//isowner: true,				//	had ownership
														//volumeid: "l1_", 				// rec.group,										
													};

												/*{
													mime: type,	// mime type
													ts:1310252178,		// time stamp format?
													read: 1,				// read state
													write: 0,			// write state
													size: 666,			// size
													hash: nameHash, // parent+name, 
													name: name, // keys name
													phash: parentHash,	// parent
													locked: 0,		// lock state
													//volumeid: type ? "v2_" : "v1_", // rec.group,
													dirs: 1, 			// place inside tree too
												}*/
												return Copy(info, type
													? {
														mime: "application/txt",	// mime type
														dirs: 0, 			// place inside tree too
													}
													: {
														mime: "directory",	// mime type
														dirs: 1, 			// place inside tree too
													} );	
											}));

										else
										if ( isObject(files) ) {
											/*{
												mime: type,	// mime type
												ts:1310252178,		// time stamp format?
												read: 1,				// read state
												write: 0,			// write state
												size: 666,			// size
												hash: nameHash, //parent+name,
												name: name, // keys name
												phash: parentHash, //parent,
												locked: 0,		// lock state
												//volumeid: type ? "v2_" : "v1_", // rec.group,
												dirs: 1, 			// place inside tree too
											} */
											Each(files, (idx,file) => {
												const 
													name = `"${idx}"/`,
													nameHash = btoa(parent+name),
													type = !(isArray(file) || isObject(file)),
													info = {
														ts: now,
														size: Object.keys(file).length,
														hash: nameHash, 				// hash name
														name: name, 					// keys name
														phash: parentHash, 				// parent hash name

														read: 1,						// read state
														write: 1,						// write state
														locked: 0,						// lock state
														//tmb: "",						// thumbnail for images
														//alias: "",					// sumbolic link pack
														//dim: "",						// image dims
														//isowner: true,				//	had ownership
														//volumeid: "l1_", 				// rec.group,										
													};

												recs.push( Copy(info, type 
													? {
														mime: "application/txt",	// mime type
														dirs: 0, 			// place inside tree too
													}
													: {
														mime: "directory",	// mime type
														dirs: 1, 			// place inside tree too
													} ));
											});
											sendFolder(res,recs);
										}

										else 
											res(files);
									}

									else
										res("bad src provided");

								});	
							}

							else
								Fetch( "http:"+src+"&name", txt => {
									sendFolder(res, JSON.parse(txt).map( file => {
										const
											name = `${file.name}=/`,
											nameHash = btoa(parent+name);

										return {
											mime: "directory",	// mime type
											dirs: 1, 					// place inside tree too
											ts: now,
											size: Object.keys(file).length,
											hash: nameHash, 				// hash name
											name: name, 					// keys name
											phash: parentHash, 				// parent hash name

											read: 1,						// read state
											write: 1,						// write state
											locked: 0,						// lock state
											//tmb: "",						// thumbnail for images
											//alias: "",					// sumbolic link pack
											//dim: "",						// image dims
											//isowner: true,				//	had ownership
											//volumeid: "l1_", 				// rec.group,										
										};
									}) );
								});

						else
							Fetch( "http:"+src.tag("&",{"json:":json}), txt => {

								if ( files = JSON.parse(txt)[0].json ) {
									if ( files.forEach ) 
										sendFolder(res, files.map( (file,idx) => {
											const 
												name = "["+idx+"]/",
												nameHash = btoa(parent+name),
												type = !(isArray(file) || isObject(file)),
												info = {
													ts: now,
													size: file.length,
													hash: nameHash, 				// hash name
													name: name, 					// keys name
													phash: parentHash, 				// parent hash name

													read: 1,						// read state
													write: 1,						// write state
													locked: 0,						// lock state
													//tmb: "",						// thumbnail for images
													//alias: "",					// sumbolic link pack
													//dim: "",						// image dims
													//isowner: true,				//	had ownership
													//volumeid: "l1_", 				// rec.group,										
												};

											/*{
												mime: type,	// mime type
												ts:1310252178,		// time stamp format?
												read: 1,				// read state
												write: 0,			// write state
												size: 666,			// size
												hash: nameHash, // parent+name, 
												name: name, // keys name
												phash: parentHash,	// parent
												locked: 0,		// lock state
												//volumeid: type ? "v2_" : "v1_", // rec.group,
												dirs: 1, 			// place inside tree too
											}*/
											return Copy(info, type
												? {
													mime: "application/txt",	// mime type
													dirs: 0, 			// place inside tree too
												}
												: {
													mime: "directory",	// mime type
													dirs: 1, 			// place inside tree too
												} );	
										}));

									else
									if ( isObject(files) ) {
										/*{
											mime: type,	// mime type
											ts:1310252178,		// time stamp format?
											read: 1,				// read state
											write: 0,			// write state
											size: 666,			// size
											hash: nameHash, //parent+name,
											name: name, // keys name
											phash: parentHash, //parent,
											locked: 0,		// lock state
											//volumeid: type ? "v2_" : "v1_", // rec.group,
											dirs: 1, 			// place inside tree too
										} */
										Each(files, (idx,file) => {
											const 
												name = `"${idx}"/`,
												nameHash = btoa(parent+name),
												type = !(isArray(file) || isObject(file)),
												info = {
													ts: now,
													size: Object.keys(file).length,
													hash: nameHash, 				// hash name
													name: name, 					// keys name
													phash: parentHash, 				// parent hash name

													read: 1,						// read state
													write: 1,						// write state
													locked: 0,						// lock state
													//tmb: "",						// thumbnail for images
													//alias: "",					// sumbolic link pack
													//dim: "",						// image dims
													//isowner: true,				//	had ownership
													//volumeid: "l1_", 				// rec.group,										
												};

											recs.push( Copy(info, type 
												? {
													mime: "application/txt",	// mime type
													dirs: 0, 			// place inside tree too
												}
												: {
													mime: "directory",	// mime type
													dirs: 1, 			// place inside tree too
												} ));
										});
										sendFolder(res,recs);
									}

									else 
										res(files);
								}

								else
									res("bad src provided");

							});

					else 	// browsing file system
						Fetch( "file:"+parent , files => {
							sendFolder(res, files.select( file => {
								const 
									[x,name,type] = file.match(/(.*)\.(.*)/) || ["",file,""],
									nameHash = btoa(parent+file);

								switch (type) {
									case "url":
									case "lnk":
										return null;

									default:
										/*{
											mime: `application/${type}`,	// mime type
											ts:1310252178,		// mod time stamp
											size: 666,			// size
											hash: nameHash, //parent+file,	// hash name
											name: file, // keys name
											phash: parentHash, //parent, 		// parent hash name
											//tmb: "",			// thumbnail for images
											//alias: ""			// sumbolic link pack
											//dim: ""			// image dims
											//isowner: true		//	had ownership
											//volumeid: type ? "v2_" : "v1_", // rec.group,
											dirs: 0 			// place inside tree too
										} */
										const 
											stat = FS.statSync( "."+parent+file ),
											info = {
												ts: new Date(stat.mtime).getTime(),
												size: stat.size,
												hash: nameHash, //parent+file,	// hash name
												name: file, 					// keys name
												phash: parentHash, 				// parent hash name

												read: 1,						// read state
												write: 1,						// write state
												locked: 0,						// lock state
												//tmb: "",						// thumbnail for images
												//alias: "",					// sumbolic link pack
												//dim: "",						// image dims
												//isowner: true,				//	had ownership
												//volumeid: "l1_", 				// rec.group,										
											};

										return Copy(info, type 
												? {
													mime: `application/${type}`,	// mime type
													dirs: 0 			// place inside tree too
												}
												: {
													mime: "directory",	// mime type
													dirs: 1 			// place inside tree too
												} );
								}
							}));
						});

					break;

				case "file":	// requesting a single file

					if ( src ) 
						res( parent );

					else
						Fetch( "file:"+parent, txt => res( txt ) );

					break;

				case "xxtree":	// expanding folder in left paine
					res({
						tree: []
					});
					break;

				case "size":
					res({
						size: 222
					});
					break;

				case "tmb":
				case "upload":
				case "url":
				case "zipdl":
				case "rename":
				case "put":
				case "resize":
				case "ping":
				case "mkdir":
				case "mkfile":
				case "ls":
				case "netmount":
				case "get":
				case "info":
				case "editor":
				case "extract":
				case "chmod":
				case "callback":
				case "archive":
				case "abort":
				case "rm":
				case "copy":
				case "paste":
				case "search":
					res({
						error: "unsupported command"
					});
					break;

				default:	// request made w/o elFinder
					if ( path.endsWith("/") )	// requesting folder
						Fetch( "file:"+path , files => {	
							if ( files ) {
								files.put( file => {
									if ( file.endsWith(".url") ) {	// resolve windows link
										const
											src = "."+path+file;

										if ( html = cache[src] ) 
											return html;

										else 
											try {
												const
													[x, url] = FS.readFileSync( src, "utf8").match( /URL=(.*)/ ) || ["",""],
													{href} = URL(url,referer);

												return cache[src] = url ? file.substr(0,file.indexOf(".url")).tag( href ) : "?"+file;
											}

											catch (err) {
												return "?"+file
											}
									}

									else
										return file.link( file );
								});

								req.type = "html"; // override default json type
								res([[ 
									site.nick.link( "/brief.view?notebook=totem" ),
									client.link( "/login.html" ),
									"API".link( "/api.view" ),
									"Browse".link( "/browse.view" ),
									"Explore".link( "/xfan.view?w=1000&h=600&src=/info" ),
									path
								].join(" || ") , files.join("<br>")].join("<br>") );
							}

							else
								res( "folder not found" );
						});

					else { // requesting file
						Fetch( "file:"+path, res );

						if ( area == "refs" && profile.Track ) {		// track client's download
							//Log(">>>>>track download", profile );
							sql.query(
								"INSERT INTO openv.bricks SET ? ON DUPLICATE KEY UPDATE Samples=Samples+1",
								{
									Name: path,
									Area: area,
									Client: client
								});
						}
					}
			}		

			/*
			areas.forEach( (area,i) => 
				areas[i] = area
					? area.tag( "/"+area+"/" )
					: site.nick.tag( "/xfan.view?src=/info&w=1000&h=600" )
							+ " protecting the warfighter from bad data"
			);

			req.type = "html";
			res( areas.join("<br>") );
			*/
		},

		/**
		Endpoint to retrieve [requested neo4j graph](/api.view#sysGraph).

		@param {Object} req Totem request
		@param {Function} res Totem response
		*/
		graph: function (req,res) {
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

			//Log(">>>get", net);
			neoThread( neo => {			
				if ( net.indexOf("cnet")>=0 )
					neo.cypher( `MATCH (a:${net})-[r]->(b:${net}) RETURN r,a,b ORDER BY r.cutsize`, {}, (err,recs) => {

						const poly = [];

						//Log(">>>err",err);
						//Log(">>>rel", JSON.stringify(recs[0]));
						//Log(recs);

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

							//Log(n, deg, recs.length, rec, cutsize, maxflow);

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

						//Log(">>>>>>>>>>>poly",poly);
						res(poly);
					});

				else
					neo.cypher( `MATCH (n:${net}) RETURN n`, query, (err,recs) => {
						//Log(">act", recs[0]);
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
							//Log(">rel", recs[0]);

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

		notebooks: (req,res) => {
			const
				{sql,query,type} = req,
				plugins = [];

			//Log(query, isEmpty(query) );
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

		@param {Object} req Totem request
		@param {Function} res Totem response
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
					Log("INGEST FAILED",err);
				}
			}		

			const 
				{ sql, query, body, type } = req,
				{ fileID, src } = query,
				{ ingester } = TOTEM;

			if ( type == "help" )
			return res("Run the src = NAME ingestor against the specified fileID = BRICK." );

			Log("INGEST", query, body);
			res("ingesting events");

			if (fileID) {
				//sql.query("DELETE FROM openv.events WHERE ?", {fileID: fileID});

				sql.query("SELECT Class FROM openv.bricks WHERE ?", {ID: fileID})
				.on("result", file => {
					if ( opts = EAT[src] )   // use builtin src ingester (event eater)
						ingest( opts, query, evs => {
							ingestList( sql, evs, fileID, file.Class, aoi => {
								Log("INGESTED", aoi);
							});
						});

					else  // use custom ingester
						sql.query("SELECT _Ingest_Script FROM openv.bricks WHERE ? AND _Ingest_Script", {ID: fileID})
						.on("results", file => {
							if ( opts = JSON.parse(file._Ingest_Script) ) 
								ingest( opts, query, evs => {
									ingestList( sql, evs, fileID, file.Class, aoi => {
										Log("INGESTED", aoi);	
									});
								});
						});
				});
			}
		},

		/**
		Endpoint to return release information about requested license.

		@param {Object} req Totem request
		@param {Function} res Totem response
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

		restart: (req,res) => {
			const
				{sql,query,type} = req,
				{ delay, msg } = query;

			if ( type == "help" )
			return res("Restart system after a delay = SECONDS and notify all clients with the specifed msg = MESSAGE.");

			if ( site.pocs.overlord.indexOf( req.client ) >= 0 ) {
				res( "ok" );

				query.msg = msg || `System restarting in ${delay} seconds`;

				sysAlert(req, msg => Log( msg ) );

				setTimeout( () => {
					Trace( "RESTART", new Date(), req );
					process.exit();
				}, (delay||10)*1e3);
			}

			else
				res( errors.noPermission );
		},

		/**
		Endpoint to send notice to outsource jobs to agents.

		@param {Object} req Totem request
		@param {Function} res Totem response
		*/
		agent: (req,res) => {
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

				Log("SAVE MATLAB",query.save,plugin,id,results);

				FS.readFile(results, "utf8", function (err,json) {

					sql.query("UPDATE ?? SET ? WHERE ?", [plugin, {Save: json}, {ID: id}], err => {
						Log("save",err);
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
							getContext(sql, "app."+host, {ID: usecase}, ctx => {
								ctx.Save = evs;
								res( sql.saveContext( ctx ) );
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

		},

		/**
		Endpoint to send notice to all clients

		@param {Object} req Totem request
		@param {Function} res Totem response
		*/
		alert: (req,res) => {
			const
				{sql,query,type,client} = req,
				{ msg } = query;

			if ( type == "help" )
			return res("Send an alert msg = MESSAGE to all clients." );

			if ( site.pocs.overlord.indexOf( req.client ) >= 0 ) {
				if (IO = TOTEM.IO)
					IO.sockets.emit("alert",{msg: msg || "hello", to: "all", from: client});

				//Trace(msg, req);
				res("ok");
			}

			else 
				res( errors.noPermission );
		},

		/**
		Endpoint to send emergency message to all clients then halt totem

		@param {Object} req Totem request
		@param {Function} res Totem response
		*/
		stop: (req,res) => {

			const
				{type,query} = req;

			if (type == "help")
			return res("Stop the service");

			if (IO = TOTEM.IO)
				IO.sockets.emit("alert",{msg: query.msg || "system halted", to: "all", from: site.nick});

			res("Server stopped");
			process.exit();
		},

		/**
		@param {Object} req Totem request
		@param {Function} res Totem response
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

		/**
		@param {Object} req Totem request
		@param {Function} res Totem response
		*/
		milestones: (req, res) => {
			const 
				{sql,log,query,type} = req,
				map = {SeqNum:1,Num:1,Hours:1,Complete:1,Task:1},
				{xlsx} = readers;

			if (type == "help")
			return res("Provide milestone status information");

			for (var n=0;n<=10;n++) map["W"+n] = 1;

			sql.query("DELETE FROM openv.milestones");
			
			xlsx( sql, "milestones.xlsx","stores", rec => {
				for (var n in map) map[n] = rec[n] || "";

				sql.query("INSERT INTO openv.milestones SET ?",map, err => Log(err) );
			});

			res(SUBMITTED);
		},	

		/**
		@param {Object} req Totem request
		@param {Function} res Totem response
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
				Fetch( "http:/config?mod=enum", en => {
				Fetch( "http:/config?mod=flex", flex => {
				Fetch( "http:/config?mod=totem", totem => {
				Fetch( "http:/config?mod=debe", debe => {
					res({
						man: man,
						enum: en,
						flex: flex,
						totem: totem,
						debe: debe
					});
				}); }); }); }); });
		},

		/**
		@param {Object} req Totem request
		@param {Function} res Totem response
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
				
				Each( byTable, name => {
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
									flex: "/shares/prm/flex/index.html",
									geohack: "/shares/geohack/man/index.html"
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
		@param {Object} req Totem request
		@param {Function} res Totem response
		*/		
		DG: (req, res) => {  
			const 
				{sql,log,query} = req;
			res("tbd");
		},

		/**
		Hydra interface.
		@param {Object} req Totem request
		@param {Function} res Totem response
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
		@param {Object} req Totem request
		@param {Function} res Totem response
		*/		
		NCL: (req, res) => { // Reserved for NCL and ESS service alerts
			const 
				{sql,log,query} = req;
			res("tbd");
		},

		/**
		ESS interface.
		@param {Object} req Totem request
		@param {Function} res Totem response
		*/		
		ESS: (req, res) => { // Reserved for NCL and ESS service alerts
			const 
				{sql,log,query} = req;
			res("tbd");
		},

		/**
		MIDB interface.
		@param {Object} req Totem request
		@param {Function} res Totem response
		*/		
		MIDB: (req, res) => { // Reserved for NCL and ESS service alerts
			const 
				{sql,log,query} = req;
			res("tbd");
		},
		
		/**
		Matlab interface.
		@param {Object} req Totem request
		@param {Function} res Totem response
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
		@param {Object} req Totem request
		@param {Function} res Totem response
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
	Endpoints /TABLE.TYPE routes by table type on specifed req-res thread
	*/			
	"byType.": {
		// doc generators
		xpdf: savePage,
		xjpg: savePage,
		xgif: savePage,
		xrtp: savePage,
		xrun: savePage,
		
		// skins
		proj: renderSkin,
		view: renderSkin,
		calc: renderSkin,
		note: renderSkin,
		run: renderSkin,
		plugin: renderSkin,
		site: renderSkin,
		brief: renderSkin,
		pivot: renderSkin,
		exam: renderSkin,
		help: renderSkin,
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
		
		js: getPlugin,
		py: getPlugin,
		m: getPlugin,
		me: getPlugin,
		jade: getPlugin,
		
		export: exportPlugin,
		import: importPlugin,
		//exp: exportPlugin,
		//imp: importPlugin,
		
		blog: blogPlugin,
		
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

	// private parameters
		
	admitRule: { 	//< admitRule all clients by default 	
	},
		
	/*
		Defines site context keys to load skinning context before a skin is rendered.
		Each skin has its own {key: "SQL DB.TABLE" || "/URL?QUERY", ... } spec.
	*/
	//primeSkin: { //< site context extenders
		/*
		rtp: {  // context keys for swag.view
			projs: "select * from openv.milestones order by SeqNum,Num",
			faqs: "select * from openv.faqs where least(?) order by SeqNum"
		}
		swag: {  // context keys for swag.view
			projs: "select * from openv.milestones"
		},
		airspace: {
			projs: "select * from openv.milestones"
		},
		plugin: {
			projs: "select * from openv.milestones"
		},
		briefs: {
			projs: "select * from openv.milestones"
		},
		rtpsqd: {
			apps:"select * from openv.apps",
			users: "select * from openv.profiles",
			projs: "select * from openv.milestones",
			QAs: "select * from app.QAs"
			//stats:{table:"openv.profiles",group:"client",index:"client,event"}
		} 
		*/
	//},
		
	/**
	Site skinning context
	*/
	"site.": { 		//< initial site context
		by: "NGA/R".link( ENV.BY || "http://BY.undefined" ),
		
		tag: (src,el,tags) => src.tag(el,tags),

		map: [
			{a: "[Terms](http://totem.hopto.org/terms.view)" ,	
			 b: "[Issues](http://totem.hopto.org/issues.view)", 
			 c: "[Employee Portal](http://totem.hopto.org/portal.view)",
			 d: "[Facebook](https://facebook.com/?goto=totem)",
			 e: "[Leaders](http://totem.hopto.org/sponsors?level=leader)",
			 f: "[Federated Repo](http://github.com/totemstan/dockify)"
			},
			{a: "[Privacy](http://totem.hopto.org/terms.new)",	
			 b: "[API](http://totem.hopto.org/api.view)",
			 c: "[Contact Us](http://totem.hopto.org/contact.view)",
			 d: "[Twitter](https://twitter.com/?goto=totem)",
			 e: "[Corporate](http://totem.hopto.org/sponsors?level=corporate)",
			 f: "[DEBE Repo](https://github.com/totemstan/debe)"
			},
			{a: "[News](http://totem.hopto.org/news.view)",
			 b: "[Skinning](http://totem.hopto.org/skinguide.view)",
			 c: "[Career Opportunities](http://totemstan.hopto.org/contact.view)",
			 d: "[Instagram](http://instagram.com?goto=totem)",
			 e: "[Platinum](http://http://totem.hopto.org/sponsors?level=platinum)",
			 f: "[TOTEM Repo](https://github.com/totemstan/totem)"
			},
			{a: "[Community](http://totemstan.github.io)",
			 b: "[Status](/status.view)",
			 c: "[History](http://intellipedia/swag)",
			 d: "[Telegram](https://telegram.com?goto=totem)",
			 e: "[Honorable](http://totem.hopto.org/sponsors?level=member)"
			},
			{b: "[Briefing](/briefs.view?nb=totem)",
			 d: "[SubStack](http://substack.com?goto=totem)"
			},
			{b: "[Restart](/restart) ", 
			 d: "[WeChat](http://wechat.com?goto=totem)"
			},
			{b: "[Notices](/email.view)",
			 d: "[Parler](http://Parler.com?goto=totem)"
			}
		].gridify({
			a:"Site",b:"Usage",c:"Corporate",d:"Follow Us",
			e:"[Sponsorships](http://totem.hopto.org/likeus)".linkify(),
			f:"Fork" }),
						
		/**
		Title ti to fileName fn
		@method hover
		@memberof Skinning
		*/
		hover: (ti,fn) => {
			if ( ! fn.startsWith("/") ) fn = "/config/shares/hover/"+fn;
			return ti.tag("p",{class:"sm"}) 
				+ (
						 "".tag("img",{src:fn+".jpg"})
					+ "".tag("iframe",{src:fn+".html"}).tag("div",{class:"ctr"}).tag("div",{class:"mid"})
				).tag("div",{class:"container"});
		},
		tag: (arg,el,at) => arg.tag(el,at),
		link: (arg,to) => arg.tag("a",{href:to}),
		get: (recs,idx,ctx) => recs.get(idx,ctx),
		gridify: (recs,rehead,style) => recs.gridify(rehead,style),
		invite: d => "Invite".tag("button",{id:"_invite",onclick:"alert(123)"}) + d.users + " AS " + d.roles,
		embed: (url,w,h) => {
			const
				keys = {},
				[urlPath] = url.parsePath(keys,{},{},{}),
				urlName = urlPath,
				W = w||keys.w||400,
				H = h||keys.h||400,
				urlType = "",
				x = urlPath.replace(/(.*)\.(.*)/, (str,L,R) => {
					urlName = L;
					urlType = R;
					return "#";
				});

			//Log("link", url, urlPath, keys);
			switch (urlType) { 
				case "jpg":  
				case "png":
					return "".tag("img", { src:`${url}?killcache=${new Date()}`, width:W, height:H });
					break;

				case "view": 
				default:
					return "".tag("iframe", { src: url, width:W, height:H });
			}
		},
		
		banner: "",	// disabled
		
		/*classif: {
			level: "",
			purpose: "",
			banner: ""
		}, */
		
		info: {
		},
		
		mods: ["totem","enum","jsdb","debe","geohack","atomic","reader","randpr"],
		
		jira: ENV.JIRA || "http://JIRA?",
		ras: ENV.RAS || "http://RAS?",
		repo: ENV.REPO || "http://REPO?",

		reqts: {   // defaults
			js:  ["nodejs-12.14.0", "machine learning library-1.0".tag( "https://sc.appdev.proj.coe.ic.gov://acmesds/man" )].join(", "),
			py: "anconda2-2019.7 (iPython 5.1.0 debugger), numpy 1.11.3, scipy 0.18.1, utm 0.4.2, Python 2.7.13",
			m: "matlab R18, odbc, simulink, stateflow",
			R: "R-3.6.0, MariaDB, MySQL-connector"
		},
		
		/*
		match: function (recs,where,get) {
			return recs.match(where,get);
		},
		
		replace: function (recs,subs) {
			return recs.replace(subs);
		}, */
		
		/**
		Jsonize records.
		@memberof Skinning
		@param {Array} recs Record source
		*/
		json: recs => JSON.stringify(recs)

	},
	
	/**
	*/
	"errors.": {  //< error messages
		ok: "ok",
		noMarkdown: new Error("no markdown"),
		noRecord: new Error("no record"),
		noParameter: new Error("missing required parameter"),
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
		//noWorker: new Error("service busy"),
		noPermission: new Error( "You do not have permission to restart the service" ),
		//badType: new Error("bad type"),
		//lostContext: new Error("pipe lost context"),
		noPartner: new Error( "missing endservice=DOMAIN/ENDPOINT option or ENDPOINT did not confirm partner" ),
		//noAttribute: new Error( "undefined notebook attribute" ),
		noLicense: new Error("unpublished notebook, invalid endservice, unconfirmed endpartner, or no license available"),
		//badEngine: new Error( "notebook improper" ),
		//noGraph: new Error( "graph db unavailable" ),
		badAgent: new Error("bad agent request"),
		noIngest: new Error("invalid/missing ingest dataset"),
		//badDataset: new Error("dataset does not exist"),
		//noCode: new Error("notebook has no code file"),
		//badFeature: new Error("unsupported feature"),
		noOffice: new Error("office docs not enabled"),
		//noExe: new Error("no execute interface"),
		noContext: new Error("no notebook context") ,
		cantRun: new Error("cant run unregulated notebook"),
		noName: new Error("missing notebook Name parameter"), 
		noNotebook: new Error("No such notebook"),
		certFailed: new Error("could not create pki cert"),
		badEntry: new Error("sim engines must be accessed at master url"),
		
		badRequest: new Error("bad/missing request parameter(s)"),
		noBody: new Error("no body keys"),
		badBaseline: new Error("baseline could not reset change journal"),
		disableEngine: new Error("requested engine must be disabled to prime"),
		missingEngine: new Error("missing engine query"),
		protectedQueue: new Error("action not allowed on this job queues"),
		noCase: new Error("plugin case not found"),
		//badDS: new Error("dataset could not be modified"),
		//badLogin: new Error("invalid login name/password"),
		//failedLogin: new Error("login failed - admin notified"),
		//noUploader: new Error("file uplaoder not available")		
	},
	
	/**
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
		
		tou: "/config/jades/tou.txt",
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
	gradeIngest: function (sql, file, cb) {  //< callback cb(stats) or cb(null) if error
		
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
		
		Log("ingest stats ctx", ctx);
		
		if (cints = LAB.plugins.cints) 
			cints( ctx, function (ctx) {  // estimate/learn hidden process parameters
				
				if ( ctx ) {
					var stats = ctx.Save.pop() || {};  // retain last estimate at end
					Log("ingest stats", stats);

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
		
	/**
	Enable for double-blind testing 
	@type {Boolean}
	*/
	blindTesting : false		//< Enable for double-blind testing 
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
				
				Log(action.toUpperCase() + peer + (VTL ? "LOCATED" : "MISSING"));
				
				if (VTL) 
					VTL(req, function (msg) {
						Log("PEER " + peer + ":" + msg);
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
@param {Object} req Totem request
@param {Function} res Totem response
*/
function genDoc(recs,req,res) {
	
	if (!ODOC) 
		return res(DEBE.errors.noOffice);
	
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
			Log("CREATED "+docf);
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

	Log("autorun", path);
	sql.query( "SELECT * FROM openv.bricks WHERE Name=?", path.substr(1) )
	.on("result", file => {

		var 
			now = new Date(),
			startOk = now >= file.PoP_Start || !file.PoP_Start,
			endOk = now <= file.PoP_End || !file.PoP_End,
			fileOk = startOk && endOk;

		// Log("autorun", startOk, endOk);

		if ( fileOk )
			sql.query( "SELECT Run FROM openv.watches WHERE File=?", path.substr(1) )
			.on("result", (link) => {
				var 
					parts = link.Run.split("."),
					pluginName = parts[0],
					caseName = parts[1],
					exePath = `/${pluginName}.exe?Name=${caseName}`;

				//Log("autorun", link,exePath);
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
		{ type,query,table} = req,
		master = "http://localhost:8080", //site.master,	
		Type = type.substr(1),
		name = table,
		xsrc = `${master}/${name}.${Type}`.tag("?", query),
		xtar = `./uploads/${name}.pdf`,
		src = `${master}/${name}.view`.tag("?", query),
		tar = `./uploads/${name}.${Type}`;	

	if (type == "help")
	return res("Save a web page and stage its delivery");

	switch (Type) {
		case "pdf":
		case "jpg":
		case "gif":
			/*
			CP.execFile( "node", ["phantomjs", "rasterize.js", url, docf, res], function (err,stdout) { 
				if (err) Log(err,stdout);
			});  */
			res( "Claim your results "+"here".link(tar) );
			
			CP.exec(`phantomjs rasterize.js ${src} ${tar}`, (err,log) => {
				Log(err || `SAVED ${url}` );
			});
			break;

		case "html":
			res( "Claim your results "+"here".link(tar) );
			Fetch( src, html => {
				FS.writeFile(tar, html, err => {
					Log(err || `SAVED ${url}` );
				});
			});
			break;	
			
		default:
			res( "Claim your results "+"here".link(xtar) );
			CP.exec(`phantomjs rasterize.js ${xsrc} ${xtar}`, (err,log) => {
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
				//Log("status users", info);
				cb( (info.toLowerCase().parseJSON() || [] ).join(";") ) ;
			});
		},
		fetchMods = (rec, cb) => {	// callback with endservice moderators
			sql.query(
				"SELECT group_concat( DISTINCT _Partner SEPARATOR ';' ) AS MODs FROM openv.releases WHERE ? LIMIT 1",
				{ _Product: rec.Name+".html" },
				(err, mods) => { 

					//Log("status mods", err, mods);
					if ( mod = mods[0] || { MODs: "" } )
						cb( mod.MODs || "" );

				});
		};

	if (type == "help")
	return res("Status notebook");

	skinContext( req, ctx => {

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

				//Log("status", err, q.sql);

				if ( !err && recs.length )
					recs.serialize( fetchUsers, (rec,users) => {  // retain user stats
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
							recs.serialize( fetchMods, (rec,mods) => {  // retain moderator stats
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

	skinContext( req, ctx => {

		var
			name = ctx.name,
			type = ctx.type,
			product = name + "." + type,
			suits = [];

		sql.query(
			"SELECT Name,Path FROM openv.lookups WHERE ? OR ?",
			[{Ref: name}, {Ref:"notebooks"}], (err,recs) => {

			recs.forEach( rec => {
				//Log([ctx.transfer, rec.Path, name]);
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

	skinContext( req, ctx => {
		//Log(">>tou ctx",ctx);
		getEngine( sql, name, eng => {
			if ( eng ) {
				//Log(">>>tou", eng.ToU);
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
		Log(">>>release passphrase", secret);
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

		//Log("license code", pub);
		if (pub._EndService)  // an end-service specified so validate it
			Fetch( "http:"+pub._EndService, users => {  // check users provided by end-service
				const 
					partner = pub._Partner.toLowerCase(),
					inLoopback = endservice == "loopback",
					valid = users.parseJSON([]).concat( inLoopback ? partner : [] ).any( partner );

				Log(">>>release fetched users", users, partner, valid);

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

	Log( ">>>release opts", {endPart: endPartner, endSrv: endService}, suitor );

	if ( endservice )
		skinContext( req, ctx => {
			var 
				name = ctx.name,
				type = ctx.type,
				product = name + "." + type;

			Log(">>>release ctx", [name,type,product]);
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

							FS.readFile( "."+paths.tou, "utf8", (err, terms) => {
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

						//Log(">>>>release", name, type, err, pubs );
						// May rework this to use eng.Code by priming the Code in the publish phase
						sql.query( "SELECT Code,Minified FROM openv.engines WHERE ? LIMIT 1", { Name: name }, (err,engs) => {
							//Log(">>eng", engs[0]);
							if ( eng = engs[0] )
								FS.readFile( `./notebooks/${name}.d/source`, "utf8", (err, srcCode) => {
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

												Log(">>>release license", pub);
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
		ATOM[route](req, ctx =>	res( ctx ? "ok" : "failed") );

	else
		res( new Error("bad sim spec") );
}
	
/**
Endpoint to blog a specifiec field from [requested](/api.view#blogPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem response callback
*/
function blogPlugin(req,res) {
	const 
		{ query, sql, table, type, client } = req,
		{ key, name, subs } = query,
		{ master } = site,
		//key = query.key || "Description",
		//name = query.name || "nocase",
		src = table.tag("?", {Name: subs ? name+"-%" : name}),
		head = [
			site.nick.tag( master ),
			"notebook".tag( `/${table}.view?name=${name}` ),
			(new Date().toDateString()) + "",
			( client.match( /(.*)\@(.*)/ ) || ["",client] )[1].tag( "email:" + client )
		].join(" || ")+"<br>";

	if (type == "help")
	return res("Blog notebook");

	//Log(">>>>>>blog", table, key, type, query.subs, src);
	if ( key )
		sql.query(
			"SELECT * FROM app.?? WHERE ? LIMIT 1",
			[table, {Name: name}],
			(err, recs) => {

			if ( rec = err ? null : recs[0] )
				if ( md = rec[key] ) md.blogify(src, {}, rec, html => res(head+html) );

				else
					res( errors.noMarkdown );

			else
				res( errors.noRecord );
		});

	else
		res( errors.noParameter );
}
	
/**
Endpoint to return users of a [requested](/api.view#usersPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem response callback
*/
function usersPlugin(req,res) {
	const 
		{ query, sql, table, type, client } = req,
		debug = true,
		users = (debug ? [client] : []).concat( site.pocs.overlord.split(";") );

	if (type == "help")
	return res("Return list of notebook users");

	Log("users", users);
	res( users );
}
					 
/**
Endpoint to export [requested](/api.view#usersPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem response callback
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
		(err,out) => Trace( `EXPORTED ${name} `, err||"ok" ) );	
}

/**
Endpoint to import [requested](/api.view#usersPlugin) plugin/notebook/table.

@param {Object} req http request
@param {Function} res Totem response callback
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
		(err,out) => Trace( `IMPORTED ${name} `, err||"ok" ) );							
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
	
function publishPlugin(req,res) {

	function publishNotebook(sql, name, cb) {  // publish plugin at path = .../type/name

		function procScript( sql, name, mod ) {
			function minifyCode( code, cb ) {  //< callback cb(minifiedCode)
				//Log(">>>>min", code.length, type, name);

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

						FS.writeFile(e6Tmp, code, "utf8", err => {
							CP.exec( `babel ${e6Tmp} -o ${e5Tmp} --presets /local/nodejs/lib/node_modules/@babel/preset-env`, (err,log) => {
								Trace("PUBLISH BABEL", err?"failed":"ok" );
								try {
									FS.readFile(e5Tmp, "utf8", (err,e5code) => {
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

						FS.writeFile(pyTmp, code.replace(/\t/g,"  ").replace(/^\n/gm,""), "utf8", err => {
							CP.exec(`pyminifier -O ${pyTmp}`, (err,minCode) => {
								//Log("pymin>>>>", err);

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

						FS.writeFile(mTmp, code.replace(/\t/g,"  "), "utf8", err => {
							CP.execFile("python", ["matlabtopython.py", "smop", mTmp, "-o", pyTmp], err => {	
								//Log("matmin>>>>", err);

								if (err)
									cb( err );

								else
									FS.readFile( pyTmp, "utf8", (err,pyCode) => {
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
					return FS.readFileSync( `./notebooks/resource/${file}`, "utf8").replace( /\r\n/g, "\n");
				}
				catch (err) {
					return null;
				}
			}

			function getComment( sql, cb ) {
				var com = sql.replace( /(.*) comment '((.|\n|\t)*)'/, (str,spec,doc) => { 
					//Log(">>>>>>>>>>>>>>spec", spec, doc);
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

			Log(">>>>>>publish", path, name, type);

			skinContext( req, ctx => {	// get a skinning ctx to generate the ToU
				const 
					{ dockeys, speckeys } = Copy({
						speckeys: {},
						dockeys: {},
						defaultDocs: defaultDocs
					}, ctx);

				Stream( prokeys, {}, (def,key,cb) => {	// expand product key comments

					if ( cb )	// still streaming keys
						getComment( def, (spec, doc) => {	// extract key's comment
							var
								comment = (defaultDocs[key] || "") + (doc || "");

							comment.blog( ctx, html => { 	// blogify the comment
								function makeSkinable( com ) {
									return escape(com).replace(/[\.|\*|_|']/g,arg=>"%"+arg.charCodeAt(0).toString(16) );
								}

								//Log("gen", key,spec,html.substr(0,100));
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
										if ( err ) Log("PUBLISH NOMOD:"+key);
									});
								});

							else
							if ( addkeys )
								Each( addkeys, key => {
									var 
										keyId = sql.escapeId(key),
										spec = speckeys[key],
										doc = dockeys[key];

									//Log("add", keyId, spec);
									sql.query( `ALTER TABLE app.${name} ADD ${keyId} ${spec} comment '${doc}'`, [], err => {
										if ( err ) Log("PUBLISH NOADD:"+key);
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
								FS.writeFile( path+".md", readme, "utf8" );
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
									// Log(">>>save ",name, type, code);

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
										FS.writeFile( fromFile, code, "utf8", err => {
											CP.exec( `sh ${from}to${to}.sh ${fromFile} ${toFile}`, (err, out) => {
												if (!err) 
													FS.readFile( toFile, "utf8", (err,code) => {
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
					`curl "localhost:8080/${name}.html?\\$drop:=Save*&_blog=Description" >> README.md`,
					`cd ./artifacts`,
					`git commit -am "update readme"`,
					`git push agent master`
				].join(";");

			CP.exec(sh, (err,log) => {
				Log("gen readme", err,log);					
			});
		}

		function primeArtifacts( name, uid ) {
			const 
				remote = "164.187.33.219",
				gitsite = "git@github.com:totemartifacts",
					//"https://sc.appdev.proj.coe/acmesds",
				short = {
					pub: "publish",
					run: "run",
					view: "view" ,
					brief: "brief"
				};

			FS.mkdir( `./artifacts/${name}`, err => {
				if ( !err ) { // prime the notebook
					const 
						rdp = `screen mode id:i:2
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
						sh = [
								`cp -r ./artifacts/temp/* ./artifacts/${name}`,
								`cd ./artifacts/${name}`,
								"git init",
								`git remote add origin ${gitsite}/${name}`
							].join(";");

					CP.exec( sh, err => {

						["pub","run","exam","brief"].forEach( type => {	// make nb shortcuts
							FS.writeFile( // make the shortcut
								`./artifacts/${name}/${short[type]}.url`, 
`[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
[InternetShortcut]
URL=https://totem.west.ile.nga.ic.gov/${name}.${type}
IDList=
`,
								"utf8",
								err => {} );
						});	

						if (uid)
							FS.writeFile( `./artifacts/${name}/login.rdp`, rdp, "utf8", err => {} );

					});

			}
			});
		}

		try {	// prime and process the plugin's script
			procScript( sql, name, require(`./notebooks/${book}`) );	
			genReadme( name );
			cb(null);
		}

		catch (err) {	// module at path does not yet exists so prime
			Log(">>>>>>>>>>>>>>>>>>>>>>prime !!!", err);
			if ( false )  { // careful!!
				CP.exec( `cp ./notebooks/temp.js ./notebooks/${name}.js --no-clobber`, err => {
					if (err) 
						cb(err);

					else {
						try {	// prime and process the plugin's script
							var mod = require(path);
							procScript( sql, name, path, mod );
							primeArtifacts( name, "mylogin" );
							cb(null);
						}

						catch (err) {
							cb(err);
						}
					}
				});
				primeArtifacts( name, "mylogin" );
			}

			else
				cb( new Error("Notebook does not exist or invalid") );
		}

	}

	const 
		{ query, sql, table, type, host, client } = req,
		book = table;
		/*
		ctx = { 
			name:table, host:host, client:client,query:query,
			speckeys: {},
			dockeys: {},
			defaultDocs: defaultDocs
		}; */

	if (type == "help")
	return res("Publish notebook");

	publishNotebook(sql, book , err => {
		res( err 
				? new Error( `PUBLISH ${book} FAILED `+err) 
				: `PUBLISHING ${book}` );
	});									
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
@param {Function} res Totem response callback
*/	
function exePlugin(req,res) {	//< execute plugin in specified usecase context
	const 
		{ sql, client, profile, table, query, index, type } = req,
		Name = query.name || query.Name,
		now = new Date(),
		host = table;

	//Log("Execute", query);
	
	if (type == "help")
	return res("Execute notebook");

	if ( Name )  // run using named usecase
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
//Log(">>>index", rtnKey, ctxKey, lhs,rhs);

						if ( x ) {
							var 
								store = {$: ctx[lhs] },
								rtn = ctxRtn[rtnKey] = [];

							//Log("arg=", store, "key=", ctxKey);
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
@param {Function} res Totem response callback
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
@param {Function} res Totem response callback
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
@param {Function} res Totem response callback
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

@param {Object} req Totem request
@param {Function} res Totem response
*/
function runPlugin(req, res) {  //< callback res(ctx) with resulting ctx or cb(null) if error

	const 
		{ sql, table, query, type } = req,
		{ random } = Math,
		book = table,
		trace = true,			
		{ agent } = query;

	//Log(">>run", book);

	if (type == "help")
	return res("Run notebook");

	getContext( sql, book, query, ctx => {		// get context for this notebook
		function tracePipe( msg, args ) {
			"pipe".trace( msg, req, msg => console.log( msg, args ) );
		}

		function eventPipe( cb ) {
			const 
				{ Pipe } = ctx;

			cb( Pipe, ctx, save => {
			});
		}

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
			for (var key in runCtx) if ( key.startsWith("Save") ) delete runCtx[key];

			//Log(">>>init run", runCtx);
			//Log(">>>book", TOTEM.$master);

			sql.getSelects( `app.${book}`, {"!Save_*":""}, (keys,types) => {		// generate use cases

				sql.query( `DELETE FROM app.${book} WHERE Name LIKE '${ctx.Name}-%' ` );

				crossParms( 0 , Object.keys(Pipe), Pipe, {}, {}, (setCtx,idxCtx) => {	// enumerate keys to provide a setCtx key-context for each enumeration
					//Log("set", setCtx, idxCtx, Pipe.Name);
					const 
						{json} = types,
						fix = {X: idxCtx, L:jobs.length, N: ctx.Name},
						set = Copy(setCtx, {}, "."),
						job = Copy(setCtx, Copy(runCtx, {}), "." );

					//Log(">>>set", setCtx, set, fix);
					if ( json ) 
						json.forEach( key => job[key] = JSON.stringify( job[key] ) );

					Each( set, (key,val) => set[key] = job[key] );

					//Log(">>set", job, set);

					job.Name = ( Pipe.Name || "${N}-${L}" ).parse$( fix );

					//Log(">>>>debug", job);
					
					Each( job, (key,val) => {	// build sub replaceor
						if ( val )
							if ( !(key in ctx) ) // remove job keys not in the ctx
								delete job[key];
					});

					jobs.push( job );
					sets.push( set );
				});

				tracePipe("enumerate", jobs);

				jobs.forEach( (job,idx) => {
					//Log(idx,job,sets[idx]);

					sql.query( 
						noClobber
							?	`INSERT INTO app.${book} SET ?`
							:	`INSERT INTO app.${book} SET ? ON DUPLICATE KEY UPDATE ?`, 

						[job,sets[idx]], err => {

						//Log(">>>ins", err, [inserts,jobs.length]);
						if ( ++inserts == jobs.length )  // run usecases after they are all created
							if ( !noRun )
								jobs.forEach( job => {
									Fetch( `${run}?name=${job.Name}`, info => {} );
								});
					});
				});
			});
		}

		function bufferPipe( cb ) {
			const
				{ Pipe } = ctx;

			tracePipe("buffered", Pipe);

			Fetch(Pipe, buff => cb(buff) );
		}

		//Log(">>>pipe ctx", ctx);

		if (ctx) {
			res("ok");

			const { Pipe } = ctx;

			if (Pipe)
				switch ( Pipe.constructor ) {
					case String: // source pipe
						
						ATOM.$libs.$trace = tracePipe;
						ATOM.$libs.$pipe = cb => PIPE(Pipe,cb); 

						req.query = ctx;

						ATOM.select(req, ctx => {
							//Log("pipe run ctx", ctx);
							// Log("save ctx?", ctx?ctx._net?"net":ctx:false);
							if ( ctx )
								Trace( sql.saveContext( ctx ) );
						});

						break;

					case Array:  // event pipe
						req.query = ctx;

						ATOM.$libs.$trace = tracePipe;
						ATOM.$libs.$pipe = eventPipe;

						ATOM.select(req, ctx => {
							//Log(">>>engine select", ctx);
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
		}

		else
			res( null );
	});

}

/**
Endpoint to create/return public-private certs of given [url query](/api.view#getCert) 

@param {Object} req Totem request
@param {Function} res Totem response
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

switch ( process.argv[2] ) { // unit tests
	case "?":
		Log("unit test with 'node debe MODE'");
		break;
	
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var D1
	@memberof UnitTest
	*/

	case "debug": 
	case "oper":
	case "prod":
	case "prot":
		const
			{ ingestFile } = require("geohack");
		
		DEBE.config({
			riddles: 10,
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
											//Log( `CREDIT ${client}` );

											sql.query("UPDATE openv.profiles SET Credit=Credit+? WHERE Client=?", [aoi.snr, client]);

											if (false)  // put upload into LTS - move this to file watchDog
												exec(`zip ${path}.zip ${path}; rm ${path}; touch ${path}`, err => {
													Log(`PURGED ${name}`);
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
			Log( 
`Yowzers - this does everything but eat!  An encrypted service, a database, a jade UI for clients,
usecase-engine plugins, file-upload watchers, and watch dogs that monitor system resources (jobs, files, 
clients, users, system health, etc).` 
			);
			
		});
		break;
		
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var D2
	@memberof UnitTest
	*/
	case "D2":
		DEBE.config({
			riddles: 10,
			"byTable.": {
				wfs: function (req,res) {
					res("here i go again");

					Fetch(ENV.WFS_TEST, data => {
						Log(data);
					});
				}
			}
		}, sql => {
			Log( "This bad boy in an encrypted service with a database and has an /wfs endpoint" );
		});
		break;
		
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var D3
	@memberof UnitTest
	*/
		
	case "D3":
		DEBE.config({
		}, sql => {
			Log( "Stateful network flow manger started" );
		});
		break;
		
	/**
	See [Installation and Usage](https://sc.appdev.proj.coe/acmesds/debe)
	@var D4
	@memberof UnitTest
	*/
		
	case "D4":
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
			
		DEBE.config({
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
					}, err => Log("add", err) );
				}
			});
		});
		break;
		
	case "D5":
		const {pdf} = readers;
		pdf( "./config.stores/ocrTest01.pdf", txt => Log(txt) );
		break;
		
	case "raster":
		const 
			[xcmd,xdebe,xblog,src,tar] = process.argv;
		
		DEBE.config({
		}, sql => {
			Trace(`Rasterizing ${src} => ${tar}`);
			
			if ( tar.endsWith(".html") ) 
				Fetch( src, html => {
					FS.writeFile(tar, html, err => {
						Log(err || "rastered");
						DEBE.stop( () => process.exit() );
					});
				});

			else
				CP.exec(`phantomjs rasterize.js ${src} ${tar}`, (err,log) => {
					Log(err || "rastered");
					DEBE.stop( () => process.exit() );
				});
		});
		break;
		
	case "lab":
		DEBE.config({}, sql => {
			Log( "Welcome to TOTEM Lab!" );

			const 
				{$api} = pluginLibs,
				ctx = REPL.start({prompt: "$> ", useGlobal: true}).context;

			Each( pluginLibs, (key,lib) => ctx[key] = lib );
			
			$api();
		});
}

// UNCLASSIFIED
