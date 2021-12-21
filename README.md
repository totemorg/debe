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
	npm run updateio					# Update totemstan.github.io from jades/totemblog
	npm run raster --in=src --out=tar	# Rasterize source url into a target file 
	npm run lab							# Start the matrix workshop

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

**Requires**: <code>module:crypto</code>, <code>module:child\_process</code>, <code>module:fs</code>, <code>module:stream</code>, <code>module:cluster</code>, <code>module:repl</code>, <code>module:i18n-abide</code>, <code>module:optimist</code>, <code>module:tokml</code>, <code>module:mathjax-node</code>, <code>module:totem</code>, <code>module:atomic</code>, <code>module:geohack</code>, <code>module:man</code>, <code>module:randpr</code>, <code>module:enums</code>, <code>module:reader</code>, <code>module:skin</code>, <code>module:blog</code>, <code>module:dogs</code>  
**Author**: [ACMESDS](https://totemstan.github.io)  
**Example**  
```js
// npm test D2
// Start challenge-protected server with additional byTable-routed entpoints.

config({
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

config({
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
			}, err => Log("add", err) );
		}
	});
});
```

* [DEBE](#module_DEBE)
    * [~$libs](#module_DEBE..$libs)
        * [.$](#module_DEBE..$libs.$)
        * [.$log](#module_DEBE..$libs.$log)
        * [.$task](#module_DEBE..$libs.$task)
        * [.$jimp](#module_DEBE..$libs.$jimp)
        * [.$sql](#module_DEBE..$libs.$sql)
        * [.$neo](#module_DEBE..$libs.$neo)
        * [.$copy](#module_DEBE..$libs.$copy)
        * [.$each](#module_DEBE..$libs.$each)
        * [.$get()](#module_DEBE..$libs.$get)
        * [.$ran()](#module_DEBE..$libs.$ran)
        * [.$api()](#module_DEBE..$libs.$api)
    * [~tableRoutes.](#module_DEBE..tableRoutes.)
    * [~defaultDocs](#module_DEBE..defaultDocs)
    * [~licenseOnDownload](#module_DEBE..licenseOnDownload)
    * [~filterFlag.](#module_DEBE..filterFlag.)
        * [.traps.](#module_DEBE..filterFlag..traps.)
            * [.browse()](#module_DEBE..filterFlag..traps..browse)
            * [.view()](#module_DEBE..filterFlag..traps..view)
        * [.select()](#module_DEBE..filterFlag..select)
        * [.blog()](#module_DEBE..filterFlag..blog)
        * [.$()](#module_DEBE..filterFlag..$)
    * [~filterType.](#module_DEBE..filterType.)
        * [.xdoc](#module_DEBE..filterType..xdoc)
        * [.xxls](#module_DEBE..filterType..xxls)
        * [.xpps](#module_DEBE..filterType..xpps)
        * [.xppt](#module_DEBE..filterType..xppt)
        * [.dbx(recs, req, res)](#module_DEBE..filterType..dbx)
        * [.db(recs, req, res)](#module_DEBE..filterType..db)
        * [.kml(recs, req, res)](#module_DEBE..filterType..kml)
        * [.flat(recs, req, res)](#module_DEBE..filterType..flat)
        * [.txt(recs, req, res)](#module_DEBE..filterType..txt)
        * [.html(recs, req, res)](#module_DEBE..filterType..html)
        * [.tree(recs, req, res)](#module_DEBE..filterType..tree)
        * [.schema(recs, req, res)](#module_DEBE..filterType..schema)
    * [~byArea.](#module_DEBE..byArea.)
        * [.default](#module_DEBE..byArea..default)
    * [~byTable.](#module_DEBE..byTable.)
        * [.uploads](#module_DEBE..byTable..uploads)
        * [.stores](#module_DEBE..byTable..stores)
        * [.search(req, res)](#module_DEBE..byTable..search)
        * [.searches(req, res)](#module_DEBE..byTable..searches)
        * [.words(req, res)](#module_DEBE..byTable..words)
        * [.wms(req, res)](#module_DEBE..byTable..wms)
        * [.wfs(req, res)](#module_DEBE..byTable..wfs)
        * [.tips(req, res)](#module_DEBE..byTable..tips)
        * [.follow(req, res)](#module_DEBE..byTable..follow)
        * [.proctor(req, res)](#module_DEBE..byTable..proctor)
        * [.likeus(req, res)](#module_DEBE..byTable..likeus)
        * [.users(req, res)](#module_DEBE..byTable..users)
        * [.navigate(req, res)](#module_DEBE..byTable..navigate)
        * [.graph(req, res)](#module_DEBE..byTable..graph)
        * [.notebooks(req, res)](#module_DEBE..byTable..notebooks)
        * [.ingest(req, res)](#module_DEBE..byTable..ingest)
        * [.decode(req, res)](#module_DEBE..byTable..decode)
        * [.restart(req, res)](#module_DEBE..byTable..restart)
        * [.agent(req, res)](#module_DEBE..byTable..agent)
        * [.alert(req, res)](#module_DEBE..byTable..alert)
        * [.stop(req, res)](#module_DEBE..byTable..stop)
        * [.devstatus(req, res)](#module_DEBE..byTable..devstatus)
        * [.milestones(req, res)](#module_DEBE..byTable..milestones)
        * [.config(req, res)](#module_DEBE..byTable..config)
        * [.info(req, res)](#module_DEBE..byTable..info)
        * [.DG(req, res)](#module_DEBE..byTable..DG)
        * [.HYDRA(req, res)](#module_DEBE..byTable..HYDRA)
        * [.NCL(req, res)](#module_DEBE..byTable..NCL)
        * [.ESS(req, res)](#module_DEBE..byTable..ESS)
        * [.MIDB(req, res)](#module_DEBE..byTable..MIDB)
        * [.matlab(req, res)](#module_DEBE..byTable..matlab)
        * [.ESC(req, res)](#module_DEBE..byTable..ESC)
    * [~byType.](#module_DEBE..byType.)
    * [~site.](#module_DEBE..site.)
    * [~errors.](#module_DEBE..errors.)
    * [~paths.](#module_DEBE..paths.)
    * [~probono](#module_DEBE..probono) : <code>boolean</code>
    * [~isSpawned](#module_DEBE..isSpawned) : <code>Boolean</code>
    * [~bySOAP](#module_DEBE..bySOAP) : <code>Object</code>
    * [~blindTesting](#module_DEBE..blindTesting) : <code>Boolean</code>
    * [~inspector()](#module_DEBE..inspector)
    * [~licenseCode()](#module_DEBE..licenseCode)
    * [~sendMail()](#module_DEBE..sendMail)
    * [~onUpdate()](#module_DEBE..onUpdate)
    * [~initialize(sql, init)](#module_DEBE..initialize)
    * [~SOAPsession(req, res, proxy)](#module_DEBE..SOAPsession)
    * [~genDoc(recs, req, res)](#module_DEBE..genDoc)
    * [~setAutorun()](#module_DEBE..setAutorun)
    * [~exeAutorun()](#module_DEBE..exeAutorun)
    * [~getEngine()](#module_DEBE..getEngine)
    * [~fileUpload()](#module_DEBE..fileUpload)
    * [~savePage()](#module_DEBE..savePage)
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

<a name="module_DEBE..$libs"></a>

### DEBE~$libs
**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  

* [~$libs](#module_DEBE..$libs)
    * [.$](#module_DEBE..$libs.$)
    * [.$log](#module_DEBE..$libs.$log)
    * [.$task](#module_DEBE..$libs.$task)
    * [.$jimp](#module_DEBE..$libs.$jimp)
    * [.$sql](#module_DEBE..$libs.$sql)
    * [.$neo](#module_DEBE..$libs.$neo)
    * [.$copy](#module_DEBE..$libs.$copy)
    * [.$each](#module_DEBE..$libs.$each)
    * [.$get()](#module_DEBE..$libs.$get)
    * [.$ran()](#module_DEBE..$libs.$ran)
    * [.$api()](#module_DEBE..$libs.$api)

<a name="module_DEBE..$libs.$"></a>

#### $libs.$
See [man](https://github.com/totemstan/man/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$log"></a>

#### $libs.$log
See [debe](https://github.com/totemstan/debe/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$task"></a>

#### $libs.$task
See [debe](https://github.com/totemstan/debe/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$jimp"></a>

#### $libs.$jimp
See [man](https://github.com/totemstan/man/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$sql"></a>

#### $libs.$sql
See [jsdb](https://github.com/totemstan/jsdb/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$neo"></a>

#### $libs.$neo
See [jsdb](https://github.com/totemstan/jsdb/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$copy"></a>

#### $libs.$copy
See [enums](https://github.com/totemstan/enums/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$each"></a>

#### $libs.$each
See [enums](https://github.com/totemstan/enums/)

**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$get"></a>

#### $libs.$get()
**Kind**: static method of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$ran"></a>

#### $libs.$ran()
See [man](https://github.com/totemstan/man/)

**Kind**: static method of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$api"></a>

#### $libs.$api()
**Kind**: static method of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..tableRoutes."></a>

### DEBE~tableRoutes.
Route table to a database according to security requirements.

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..defaultDocs"></a>

### DEBE~defaultDocs
**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..licenseOnDownload"></a>

### DEBE~licenseOnDownload
**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..filterFlag."></a>

### DEBE~filterFlag.
Filters via request flags

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  

* [~filterFlag.](#module_DEBE..filterFlag.)
    * [.traps.](#module_DEBE..filterFlag..traps.)
        * [.browse()](#module_DEBE..filterFlag..traps..browse)
        * [.view()](#module_DEBE..filterFlag..traps..view)
    * [.select()](#module_DEBE..filterFlag..select)
    * [.blog()](#module_DEBE..filterFlag..blog)
    * [.$()](#module_DEBE..filterFlag..$)

<a name="module_DEBE..filterFlag..traps."></a>

#### filterFlag..traps.
**Kind**: static property of [<code>filterFlag.</code>](#module_DEBE..filterFlag.)  

* [.traps.](#module_DEBE..filterFlag..traps.)
    * [.browse()](#module_DEBE..filterFlag..traps..browse)
    * [.view()](#module_DEBE..filterFlag..traps..view)

<a name="module_DEBE..filterFlag..traps..browse"></a>

##### traps..browse()
**Kind**: static method of [<code>traps.</code>](#module_DEBE..filterFlag..traps.)  
<a name="module_DEBE..filterFlag..traps..view"></a>

##### traps..view()
**Kind**: static method of [<code>traps.</code>](#module_DEBE..filterFlag..traps.)  
<a name="module_DEBE..filterFlag..select"></a>

#### filterFlag..select()
**Kind**: static method of [<code>filterFlag.</code>](#module_DEBE..filterFlag.)  
<a name="module_DEBE..filterFlag..blog"></a>

#### filterFlag..blog()
**Kind**: static method of [<code>filterFlag.</code>](#module_DEBE..filterFlag.)  
<a name="module_DEBE..filterFlag..$"></a>

#### filterFlag..$()
**Kind**: static method of [<code>filterFlag.</code>](#module_DEBE..filterFlag.)  
<a name="module_DEBE..filterType."></a>

### DEBE~filterType.
Filter dataset recs on specifed req-res thread

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  

* [~filterType.](#module_DEBE..filterType.)
    * [.xdoc](#module_DEBE..filterType..xdoc)
    * [.xxls](#module_DEBE..filterType..xxls)
    * [.xpps](#module_DEBE..filterType..xpps)
    * [.xppt](#module_DEBE..filterType..xppt)
    * [.dbx(recs, req, res)](#module_DEBE..filterType..dbx)
    * [.db(recs, req, res)](#module_DEBE..filterType..db)
    * [.kml(recs, req, res)](#module_DEBE..filterType..kml)
    * [.flat(recs, req, res)](#module_DEBE..filterType..flat)
    * [.txt(recs, req, res)](#module_DEBE..filterType..txt)
    * [.html(recs, req, res)](#module_DEBE..filterType..html)
    * [.tree(recs, req, res)](#module_DEBE..filterType..tree)
    * [.schema(recs, req, res)](#module_DEBE..filterType..schema)

<a name="module_DEBE..filterType..xdoc"></a>

#### filterType..xdoc
**Kind**: static property of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..xxls"></a>

#### filterType..xxls
**Kind**: static property of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..xpps"></a>

#### filterType..xpps
**Kind**: static property of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..xppt"></a>

#### filterType..xppt
**Kind**: static property of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..dbx"></a>

#### filterType..dbx(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..db"></a>

#### filterType..db(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..kml"></a>

#### filterType..kml(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..flat"></a>

#### filterType..flat(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..txt"></a>

#### filterType..txt(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..html"></a>

#### filterType..html(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..tree"></a>

#### filterType..tree(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..filterType..schema"></a>

#### filterType..schema(recs, req, res)
**Kind**: static method of [<code>filterType.</code>](#module_DEBE..filterType.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byArea."></a>

### DEBE~byArea.
Endpoints /AREA/FILE routes by file area on specifed req-res thread

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..byArea..default"></a>

#### byArea..default
**Kind**: static property of [<code>byArea.</code>](#module_DEBE..byArea.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable."></a>

### DEBE~byTable.
Endpoints /TABLE routes by table name on specifed req-res thread

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  

* [~byTable.](#module_DEBE..byTable.)
    * [.uploads](#module_DEBE..byTable..uploads)
    * [.stores](#module_DEBE..byTable..stores)
    * [.search(req, res)](#module_DEBE..byTable..search)
    * [.searches(req, res)](#module_DEBE..byTable..searches)
    * [.words(req, res)](#module_DEBE..byTable..words)
    * [.wms(req, res)](#module_DEBE..byTable..wms)
    * [.wfs(req, res)](#module_DEBE..byTable..wfs)
    * [.tips(req, res)](#module_DEBE..byTable..tips)
    * [.follow(req, res)](#module_DEBE..byTable..follow)
    * [.proctor(req, res)](#module_DEBE..byTable..proctor)
    * [.likeus(req, res)](#module_DEBE..byTable..likeus)
    * [.users(req, res)](#module_DEBE..byTable..users)
    * [.navigate(req, res)](#module_DEBE..byTable..navigate)
    * [.graph(req, res)](#module_DEBE..byTable..graph)
    * [.notebooks(req, res)](#module_DEBE..byTable..notebooks)
    * [.ingest(req, res)](#module_DEBE..byTable..ingest)
    * [.decode(req, res)](#module_DEBE..byTable..decode)
    * [.restart(req, res)](#module_DEBE..byTable..restart)
    * [.agent(req, res)](#module_DEBE..byTable..agent)
    * [.alert(req, res)](#module_DEBE..byTable..alert)
    * [.stop(req, res)](#module_DEBE..byTable..stop)
    * [.devstatus(req, res)](#module_DEBE..byTable..devstatus)
    * [.milestones(req, res)](#module_DEBE..byTable..milestones)
    * [.config(req, res)](#module_DEBE..byTable..config)
    * [.info(req, res)](#module_DEBE..byTable..info)
    * [.DG(req, res)](#module_DEBE..byTable..DG)
    * [.HYDRA(req, res)](#module_DEBE..byTable..HYDRA)
    * [.NCL(req, res)](#module_DEBE..byTable..NCL)
    * [.ESS(req, res)](#module_DEBE..byTable..ESS)
    * [.MIDB(req, res)](#module_DEBE..byTable..MIDB)
    * [.matlab(req, res)](#module_DEBE..byTable..matlab)
    * [.ESC(req, res)](#module_DEBE..byTable..ESC)

<a name="module_DEBE..byTable..uploads"></a>

#### byTable..uploads
**Kind**: static property of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..stores"></a>

#### byTable..stores
**Kind**: static property of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..search"></a>

#### byTable..search(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..searches"></a>

#### byTable..searches(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..words"></a>

#### byTable..words(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..wms"></a>

#### byTable..wms(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..wfs"></a>

#### byTable..wfs(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..tips"></a>

#### byTable..tips(req, res)
Provide image tips.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..follow"></a>

#### byTable..follow(req, res)
Track web links.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..proctor"></a>

#### byTable..proctor(req, res)
Proctor quizes.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..likeus"></a>

#### byTable..likeus(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..users"></a>

#### byTable..users(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..navigate"></a>

#### byTable..navigate(req, res)
Folder navigator.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..graph"></a>

#### byTable..graph(req, res)
Endpoint to retrieve [requested neo4j graph](/api.view#sysGraph).

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..notebooks"></a>

#### byTable..notebooks(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..ingest"></a>

#### byTable..ingest(req, res)
Endpoint to ingest a source into the sql database

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..decode"></a>

#### byTable..decode(req, res)
Endpoint to return release information about requested license.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..restart"></a>

#### byTable..restart(req, res)
Endpoint to restart totem if authorized.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..agent"></a>

#### byTable..agent(req, res)
Endpoint to send notice to outsource jobs to agents.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..alert"></a>

#### byTable..alert(req, res)
Endpoint to send notice to all clients

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..stop"></a>

#### byTable..stop(req, res)
Endpoint to send emergency message to all clients then halt totem

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..devstatus"></a>

#### byTable..devstatus(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..milestones"></a>

#### byTable..milestones(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..config"></a>

#### byTable..config(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..info"></a>

#### byTable..info(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..DG"></a>

#### byTable..DG(req, res)
Digital globe interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..HYDRA"></a>

#### byTable..HYDRA(req, res)
Hydra interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..NCL"></a>

#### byTable..NCL(req, res)
NCL interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..ESS"></a>

#### byTable..ESS(req, res)
ESS interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..MIDB"></a>

#### byTable..MIDB(req, res)
MIDB interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..matlab"></a>

#### byTable..matlab(req, res)
Matlab interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byTable..ESC"></a>

#### byTable..ESC(req, res)
ESC remedy interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem request |
| res | <code>function</code> | Totem response |

<a name="module_DEBE..byType."></a>

### DEBE~byType.
Endpoints /TABLE.TYPE routes by table type on specifed req-res thread

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..site."></a>

### DEBE~site.
Site skinning context

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..errors."></a>

### DEBE~errors.
**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..paths."></a>

### DEBE~paths.
**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
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
Inspect doc - kludge i/f to support nlp project

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..licenseCode"></a>

### DEBE~licenseCode()
License notebook engine code.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..sendMail"></a>

### DEBE~sendMail()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..onUpdate"></a>

### DEBE~onUpdate()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..initialize"></a>

### DEBE~initialize(sql, init)
Initialize DEBE on startup.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>Object</code> | MySQL connector |
| init | <code>function</code> | callback(sql) when service init completed |

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
<a name="module_DEBE..fileUpload"></a>

### DEBE~fileUpload()
**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..savePage"></a>

### DEBE~savePage()
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