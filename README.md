# DEBE

Extends the **TOTEM** web service to provide the following endpoints:

	DATASET.TYPE ? QUERY
	NOTEBOOK.TYPE ? QUERY
	AREA/PATH/FILE.TYPE ? QUERY
	COMMAND.TYPE ? QUERY

to access *DATASET*s, *NOTEBOOK*s, *FILE*s and *COMMAND*s per 
[Totem's API](http://totem.hopto.org/api.view) and 
[TOTEM's skinning guide](https://totem.hopto.org/skinguide.view).

Use *TYPE* to convert a *DATASET*:

	db | xml | csv | txt | flat | kml | html | json

inspect a *DATASET*:

	tree | schema | nav | delta | view | blog

render a *NOTEBOOK*:
 
	view | run | plugin | pivot | site | spivot | brief | gridbrief | pivbrief | runbrief

probe a *NOTEBOOK*:

	exe | tou | md | status | suitors | usage | reset | EVENTS

manage a *NOTEBOOK*:

	import | export | publish | addkey | subkey

license a *NOTEBOOK*:

	js | py | m | me | jade | ...

**DEBE** also provides the following service *COMMAND*s:

	agent | alert | ingest | riddle | task | ping
	
to distribute jobs, alert clients, ingest data, validate sessions, spread tasks, and 
test connections, and provides several *FILE* areas: 

	stores | uploads | shares | west | east | jades

for supervised/unsupervised file sharing.

## Local Installation

Clone **TOTEM** from one of its repos:

	git clone https://github.com/totemstan/totem
	git clone https://sc.appdev.proj.coe/acmesds/totem
	git clone https://gitlab.west.nga.ic.gov/acmesds/totem

and define its env vars:

	MYSQL_HOST = domain name
	MYSQL_USER = user name
	MYSQL_PASS = user password
	TXMAIL_HOST = DOMAIN:PORT
	TXMAIL_USER = ACCOUNT:PASSWORD
	RXMAIL_HOST = DOMAIN:PORT
	RXMAIL_USER = ACCOUNT:PASSWORD
	SERVICE_PASS = passphrase to server pki cert
	SERVICE_WORKER_URL = http(s)://DOMAIN:PORT
	SERVICE_MASTER_URL = http(s)://DOMAIN:PORT
	HOSTNAME = name of host machine
	REPO = http(s)://DOMAIN:ACCOUNT
	JIRA = http://DOMAIN
	RAS = http://DOMAIN
	BY = https://DOMAIN

Passwords are defined in **TOTEM**'s `_pass.sh` script.

Dependent modules:

+ **ENUMS** [WWW](https://github.com/totemstan/enums)  [COE](https://sc.appdev.proj.coe/acmesds/enums)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/enums)  
+ **SECLINK** [WWW](https://github.com/totemstan/securelink)  [COE](https://sc.appdev.proj.coe/acmesds/securelink)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/securelink)  
+ **SOCKETIO** [WWW](https://github.com/totemstan/socketio)  [COE](https://sc.appdev.proj.coe/acmesds/socketio)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/socketio)  
+ **JSDB** [WWW](https://github.com/totemstan/jsdb)  [COE](https://sc.appdev.proj.coe/acmesds/jsdb)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/jsdb)  
+ **GEOHACK** [WWW](https://github.com/totemstan/geohack)  [COE](https://sc.appdev.proj.coe/acmesds/geohack)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/geohack)  
+ **ATOMIC** [WWW](https://github.com/totemstan/atomic)  [COE](https://sc.appdev.proj.coe/acmesds/atomic)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/atomic)  
+ **TOTEM** [WWW](https://github.com/totemstan/totem)  [COE](https://sc.appdev.proj.coe/acmesds/totem)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/totem)  
+ **RANDPR** [WWW](https://github.com/totemstan/randpr)  [COE](https://sc.appdev.proj.coe/acmesds/randpr)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/randpr)  
+ **MAN** [WWW](https://github.com/totemstan/man)  [COE](https://sc.appdev.proj.coe/acmesds/man)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/man)  
+ **READER** [WWW](https://github.com/totemstan/reader)  [COE](https://sc.appdev.proj.coe/acmesds/reader)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/reader)  
+ **PIPE** [WWW](https://github.com/totemstan/pipe)  [COE](https://sc.appdev.proj.coe/acmesds/pipe)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/pipe)  
+ **BLOG** [WWW](https://github.com/totemstan/blog)  [COE](https://sc.appdev.proj.coe/acmesds/blog)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/blog)  
+ **SKIN** [WWW](https://github.com/totemstan/skin)  [COE](https://sc.appdev.proj.coe/acmesds/skin)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/skin)  
+ **DOGS** [WWW](https://github.com/totemstan/dogs)  [COE](https://sc.appdev.proj.coe/acmesds/dogs)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/dogs)  

## Federated Installation

Simply install and start its federated docker image (
[WWW](https://github.com/totemstan/dockify) 
[COE](https://sc.appdev.proj.coe/acmesds/dockify)
[SBU](https://gitlab.west.nga.ic.gov/acmesds/dockify)
).

## Manage 

	npm test [ ? || D1 || D2 || ... ]	# Unit test
	npm run redoc						# Update repo
	npm run config						# Configure passwords
	npm run startdb						# Start the database servers
	npm run debug						# Start debe in debug mode
	npm run oper						# Start debe in operational mode
	npm run reblog						# Generate totemstan splash pages

## Usage

Require, configure and start a DEBE server:

	const DEBE = require("debe");
	
	DEBE.config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, err =>  {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where its configuration keys (
[WWW](http://totem.hopto.org/shares/prm/totem/index.html) 
[COE](https://totem.west.ile.nga.ic.gov/shares/prm/totem/index.html) 
[SBU](https://totem.nga.mil/shares/prm/totem/index.html)
)
follow the **ENUMS** deep copy conventions (
[WWW](https://github.com/totemstan/enum) 
[COE](https://sc.appdev.proj.coe/acmesds/enum) 
[SBU](https://gitlab.west.nga.ic.gov/acmesds/enum)
).

## Program Reference
<details>
<summary>
<i>Open/Close</i>
</summary>
## Modules

<dl>
<dt><a href="#DEBE.module_String">String</a></dt>
<dd></dd>
<dt><a href="#DEBE.module_Array">Array</a></dt>
<dd></dd>
<dt><a href="#DEBE.module_Data">Data</a></dt>
<dd></dd>
<dt><a href="#module_DEBE">DEBE</a></dt>
<dd><p>Provides UI interfaces to the <a href="https://github.com/totemstan/totem">barebone TOTEM web service</a> 
to support notebooks and other entities.  This module documented 
in accordance with <a href="https://jsdoc.app/">jsdoc</a>.</p>
</dd>
</dl>

<a name="DEBE.module_String"></a>

## String
<a name="DEBE.module_String..linkify"></a>

### String~linkify(ref) ⇐ <code>Array</code>
Returns a ref-joined list of links

**Kind**: inner method of [<code>String</code>](#DEBE.module_String)  
**Extends**: <code>Array</code>  

| Param | Type |
| --- | --- |
| ref | <code>String</code> | 

<a name="DEBE.module_Array"></a>

## Array

* [Array](#DEBE.module_Array)
    * [~gridify(noheader)](#DEBE.module_Array..gridify)
    * [~groupify(dot)](#DEBE.module_Array..groupify)
    * [~blogify(keys, ds, cb)](#DEBE.module_Array..blogify)
    * [~merge(Recs, idx)](#DEBE.module_Array..merge)
    * [~schemaify(src)](#DEBE.module_Array..schemaify)
    * [~treeify(idx, kids, level, keys, wt)](#DEBE.module_Array..treeify)
    * [~joinify(cb)](#DEBE.module_Array..joinify)

<a name="DEBE.module_Array..gridify"></a>

### Array~gridify(noheader)
Creates an html table from an array.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type | Description |
| --- | --- | --- |
| noheader | <code>Boolean</code> | switch to enable header processing |

<a name="DEBE.module_Array..groupify"></a>

### Array~groupify(dot)
Groups each "x.y.z. ...." spec in the list.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type | Description |
| --- | --- | --- |
| dot | <code>string</code> | item seperator |

<a name="DEBE.module_Array..blogify"></a>

### Array~blogify(keys, ds, cb)
Blogs each string in the list.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  
**See**: totem:blogify  

| Param | Type | Description |
| --- | --- | --- |
| keys | <code>List</code> | list of keys to blog |
| ds | <code>String</code> | Name of dataset being blogged |
| cb | <code>function</code> | callback(recs) blogified version of records |

<a name="DEBE.module_Array..merge"></a>

### Array~merge(Recs, idx)
Merge changes when doing table deltas from their baseline versions.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type | Description |
| --- | --- | --- |
| Recs | <code>Array</code> | Source records to merge into this records |
| idx | <code>String</code> | Key name to use for detecting record changes |

<a name="DEBE.module_Array..schemaify"></a>

### Array~schemaify(src)
Returns a schema of the array using the specified src path.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type | Description |
| --- | --- | --- |
| src | <code>String</code> | path to source |

<a name="DEBE.module_Array..treeify"></a>

### Array~treeify(idx, kids, level, keys, wt)
Returns a tree = {name,weight,nodes} from records having been sorted on keys=[key,...]

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type | Description |
| --- | --- | --- |
| idx | <code>Number</code> | starting index (0 on first call) |
| kids | <code>Number</code> | number of leafs following starting index (this.length on first call) |
| level | <code>Number</code> | current depth (0 on first call) |
| keys | <code>Array</code> | pivot keys |
| wt | <code>String</code> | key name that contains leaf weight (defaults to "size") |

<a name="DEBE.module_Array..joinify"></a>

### Array~joinify(cb)
Joins a list with an optional callback cb(head,list) to join the current list 
	with the current head.

**Kind**: inner method of [<code>Array</code>](#DEBE.module_Array)  

| Param | Type |
| --- | --- |
| cb | <code>function</code> | 

**Example**  
```js
[	a: null,
			g1: [ b: null, c: null, g2: [ x: null ] ],
			g3: [ y: null ] ].joinify()

	returning a string
		"a,g1(b,c,g2(x)),g3(y)"
```
<a name="DEBE.module_Data"></a>

## Data
<a name="module_DEBE"></a>

## DEBE
Provides UI interfaces to the [barebone TOTEM web service](https://github.com/totemstan/totem) 
to support notebooks and other entities.  This module documented 
in accordance with [jsdoc](https://jsdoc.app/).

**Requires**: <code>module:crypto</code>, <code>module:child\_process</code>, <code>module:fs</code>, <code>module:stream</code>, <code>module:cluster</code>, <code>module:i18n-abide</code>, <code>module:optimist</code>, <code>module:tokml</code>, <code>module:mathjax-node</code>, <code>module:totem</code>, <code>module:atomic</code>, <code>module:geohack</code>, <code>module:man</code>, <code>module:randpr</code>, <code>module:enums</code>, <code>module:reader</code>, <code>module:skin</code>, <code>module:blog</code>, <code>module:dogs</code>  
**Author**: [ACMESDS](https://totemstan.github.io)  
**Example**  
```js
// npm test D1
// Start challenge-protected service with onFile handlers

DEBE.config({
	riddles: 10,
	onFile: {
		"./uploads/": function (sql, name, path) {  // watch changes to a file				

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
						site = DEBE.site,
						port = name.link( "/files.view" ),
						url = site.worker,
						metrics = "metrics".link( url+"/airspace.view" ),
						poc = site.distro.d;

					sql.forFirst(  // credit client for upload
						"UPLOAD",
						"SELECT `Group` FROM openv.profiles WHERE ? LIMIT 1", 
						{Client:client}, 
						function (prof) {

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
								DEBE.ingestFile(sql, path, name, file.ID, aoi => {
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
```
**Example**  
```js
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
```
**Example**  
```js
// npm test D3
// Start server using default config

DEBE.config({
}, sql => {
	Log( "Stateful network flow manger started" );
});
```
**Example**  
```js
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
```

* [DEBE](#module_DEBE)
    * [~probono](#module_DEBE..probono) : <code>boolean</code>
    * [~isSpawned](#module_DEBE..isSpawned) : <code>Boolean</code>
    * [~bySOAP](#module_DEBE..bySOAP) : <code>Object</code>
    * [~blindTesting](#module_DEBE..blindTesting) : <code>Boolean</code>
    * [~inspector()](#module_DEBE..inspector)
    * [~licenseCode()](#module_DEBE..licenseCode)
    * [~initialize(err)](#module_DEBE..initialize)
    * [~SOAPsession(req, res, proxy)](#module_DEBE..SOAPsession)
    * [~genDoc(recs, req, res)](#module_DEBE..genDoc)
    * [~setAutorun()](#module_DEBE..setAutorun)
    * [~exeAutorun()](#module_DEBE..exeAutorun)
    * [~getEngine()](#module_DEBE..getEngine)
    * [~getContext()](#module_DEBE..getContext)
    * [~fileUpload()](#module_DEBE..fileUpload)
    * [~getDoc()](#module_DEBE..getDoc)
    * [~statusPlugin()](#module_DEBE..statusPlugin)
    * [~matchPlugin()](#module_DEBE..matchPlugin)
    * [~docPlugin()](#module_DEBE..docPlugin)
    * [~trackPlugin()](#module_DEBE..trackPlugin)
    * [~getPlugin()](#module_DEBE..getPlugin)
    * [~simPlugin()](#module_DEBE..simPlugin)
    * [~blogPlugin(req, res)](#module_DEBE..blogPlugin)
    * [~usersPlugin(req, res)](#module_DEBE..usersPlugin)
    * [~exportPlugin(req, res)](#module_DEBE..exportPlugin)
    * [~importPlugin(req, res)](#module_DEBE..importPlugin)
    * [~exePlugin(req, res)](#module_DEBE..exePlugin)
    * [~modifyPlugin(req, res)](#module_DEBE..modifyPlugin)
    * [~retractPlugin(req, res)](#module_DEBE..retractPlugin)
    * [~helpPlugin(req, res)](#module_DEBE..helpPlugin)
    * [~runPlugin(req, res)](#module_DEBE..runPlugin)
    * [~getCert(req, res)](#module_DEBE..getCert)

<a name="module_DEBE..probono"></a>

### DEBE~probono : <code>boolean</code>
Enable to give-away plugin services

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..isSpawned"></a>

### DEBE~isSpawned : <code>Boolean</code>
Enabled when this is child server spawned by a master server

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..bySOAP"></a>

### DEBE~bySOAP : <code>Object</code>
Reserved for soap interfaces

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..blindTesting"></a>

### DEBE~blindTesting : <code>Boolean</code>
Enable for double-blind testing

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..inspector"></a>

### DEBE~inspector()
Inspect doc

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..licenseCode"></a>

### DEBE~licenseCode()
License code

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..initialize"></a>

### DEBE~initialize(err)
Initialize DEBE on startup.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Object</code> | error |

<a name="module_DEBE..SOAPsession"></a>

### DEBE~SOAPsession(req, res, proxy)
Process an bySOAP session peer-to-peer request.  Currently customized for Hydra-peer and 
	could/should be revised to support more generic peer-to-peer bySOAP interfaces.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | HTTP request |
| res | <code>Object</code> | HTTP response |
| proxy | <code>function</code> | Name of APP proxy function to handle this session. |

<a name="module_DEBE..genDoc"></a>

### DEBE~genDoc(recs, req, res)
Convert records to requested req.type office file.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | list of records to be converted |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..setAutorun"></a>

### DEBE~setAutorun()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..exeAutorun"></a>

### DEBE~exeAutorun()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..getEngine"></a>

### DEBE~getEngine()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..getContext"></a>

### DEBE~getContext()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..fileUpload"></a>

### DEBE~fileUpload()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..getDoc"></a>

### DEBE~getDoc()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..statusPlugin"></a>

### DEBE~statusPlugin()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..matchPlugin"></a>

### DEBE~matchPlugin()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..docPlugin"></a>

### DEBE~docPlugin()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..trackPlugin"></a>

### DEBE~trackPlugin()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..getPlugin"></a>

### DEBE~getPlugin()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..simPlugin"></a>

### DEBE~simPlugin()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..blogPlugin"></a>

### DEBE~blogPlugin(req, res)
Endpoint to blog a specifiec field from [requested](/api.view#blogPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..usersPlugin"></a>

### DEBE~usersPlugin(req, res)
Endpoint to return users of a [requested](/api.view#usersPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..exportPlugin"></a>

### DEBE~exportPlugin(req, res)
Endpoint to export [requested](/api.view#usersPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..importPlugin"></a>

### DEBE~importPlugin(req, res)
Endpoint to import [requested](/api.view#usersPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..exePlugin"></a>

### DEBE~exePlugin(req, res)
Endpoint to execute plugin req.table using usecase req.query.ID || req.query.Name.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..modifyPlugin"></a>

### DEBE~modifyPlugin(req, res)
Endpoint to add keys to [requested](/api.view#modifyPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..retractPlugin"></a>

### DEBE~retractPlugin(req, res)
Endpoint to remove keys from [requested](/api.view#retractPlugin) plugin/notebook/table given.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..helpPlugin"></a>

### DEBE~helpPlugin(req, res)
Endpoint to return plugin/notebook/table usage info.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem response callback |

<a name="module_DEBE..runPlugin"></a>

### DEBE~runPlugin(req, res)
Endpoint to run a dataset-engine plugin named X = req.table using parameters Q = req.query
or (if Q.id or Q.name specified) dataset X parameters derived from the matched  
dataset (with json fields automatically parsed). On running the plugin's engine X, this 
method then responds on res(results).   If Q.Save is present, the engine's results are
also saved to the plugins dataset.  If Q.Pipe is present, then responds with res(Q.Pipe), 
thus allowing the caller to place the request in its job queues.  Otherwise, if Q.Pipe 
vacant, then responds with res(results).  If a Q.agent is present, then the plugin is 
out-sourced to the requested agent, which is periodically polled for its results, then
responds with res(results).

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..getCert"></a>

### DEBE~getCert(req, res)
Endpoint to create/return public-private certs of given [url query](/api.view#getCert)

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

</details>

## Contacting, Contributing, Following

Feel free to 
* submit and status **TOTEM** issues (
[WWW](http://totem.hopto.org/issues.view) 
[COE](https://totem.west.ile.nga.ic.gov/issues.view) 
[SBU](https://totem.nga.mil/issues.view)
)  
* contribute to **TOTEM** notebooks (
[WWW](http://totem.hopto.org/shares/notebooks/) 
[COE](https://totem.west.ile.nga.ic.gov/shares/notebooks/) 
[SBU](https://totem.nga.mil/shares/notebooks/)
)  
* revise **TOTEM** requirements (
[WWW](http://totem.hopto.org/reqts.view) 
[COE](https://totem.west.ile.nga.ic.gov/reqts.view) 
[SBU](https://totem.nga.mil/reqts.view), 
)  
* browse **TOTEM** holdings (
[WWW](http://totem.hopto.org/) 
[COE](https://totem.west.ile.nga.ic.gov/) 
[SBU](https://totem.nga.mil/)
)  
* or follow **TOTEM** milestones (
[WWW](http://totem.hopto.org/milestones.view) 
[COE](https://totem.west.ile.nga.ic.gov/milestones.view) 
[SBU](https://totem.nga.mil/milestones.view)
).

## License

[MIT](LICENSE)

* * *

&copy; 2012 ACMESDS