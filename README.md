# DEBE [WWW](https://github.com/totemstan/debe)  [COE](https://sc.appdev.proj.coe/acmesds/debe)  [SBU](https://gitlab.west.nga.ic.gov/acmesds/deb)

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

## Installation

Clone **DEBE** from one of its REPOs:

	cd MYPROJECT
	git clone REPO/totemstan/debe
	git clone REPO/totemstan/totem
	git clone REPO/totemstan/atomic
	git clone REPO/totemstan/enums
	git clone REPO/totemstan/jsdb
	git clone REPO/totemstan/atomic
	git clone REPO/totemstan/geohack
	git clone REPO/totemstan/man
	git clone REPO/totemstan/randpr
	git clone REPO/totemstan/reader
	git clone REPO/totemstan/skin
	git clone REPO/totemstan/blog
	git clone REPO/totemstan/dogs
	git clone REPO/totemstan/pipe

To start and manage **DEBE**: 

	npm run start [ ? | $ | ...]	# Unit test
	npm run verminor				# Roll minor version
	npm run vermajor				# Roll major version
	npm run redoc					# Regen documentation

	npm run	startdbs				# Start required database servers
	npm run setprot					# Configure for protected mode
	npm run setdebug				# Configure for debugging mode
	npm run setoper					# Configure for operational mode
	npm run setprod					# Configure for production mode

	npm run genio						# Generate totemstan.github.io from jades/totemblog
	npm run raster --in=src --out=tar	# Rasterize source url into a target file 
	
## Usage

Acquire, optionally configure and start a **DEBE** server:

	const DEBE = require("debe").config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, sql => {
		console.log( sql ? "look mom - Im running!" : "something evil is lurking" );
	});

where its configuration keys (
[WWW](http://totem.zapto.org/shares/prm/totem/index.html) 
[COE](https://totem.west.ile.nga.ic.gov/shares/prm/totem/index.html) 
[SBU](https://totem.nga.mil/shares/prm/totem/index.html)
)
follow the ENUM deep copy conventions (
[WWW](https://github.com/totemstan/enum) 
[COE](https://sc.appdev.proj.coe/acmesds/enum) 
[SBU](https://gitlab.west.nga.ic.gov/acmesds/enum)
).
See the Program Reference for examples.

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
<h3 id="env-dependencies">Env Dependencies</h3>
<pre><code>HOSTNAME = name of host machine
REPO = http://DOMAIN:ACCOUNT
JIRA = http://DOMAIN
RAS = http://DOMAIN
BY = https://DOMAIN
</code></pre>
</dd>
</dl>

<a name="DEBE.module_String"></a>

## String

* [String](#DEBE.module_String)
    * [~linkify(ref)](#DEBE.module_String..linkify) ⇐ <code>Array</code>
    * [~mailify()](#DEBE.module_String..mailify)
    * [~align()](#DEBE.module_String..align)
    * [~trimGoogle()](#DEBE.module_String..trimGoogle)

<a name="DEBE.module_String..linkify"></a>

### String~linkify(ref) ⇐ <code>Array</code>
Returns a ref-joined list of links

**Kind**: inner method of [<code>String</code>](#DEBE.module_String)  
**Extends**: <code>Array</code>  

| Param | Type |
| --- | --- |
| ref | <code>String</code> | 

<a name="DEBE.module_String..mailify"></a>

### String~mailify()
**Kind**: inner method of [<code>String</code>](#DEBE.module_String)  
<a name="DEBE.module_String..align"></a>

### String~align()
**Kind**: inner method of [<code>String</code>](#DEBE.module_String)  
<a name="DEBE.module_String..trimGoogle"></a>

### String~trimGoogle()
**Kind**: inner method of [<code>String</code>](#DEBE.module_String)  
<a name="DEBE.module_Array"></a>

## Array

* [Array](#DEBE.module_Array)
    * [~gridify(noheader)](#DEBE.module_Array..gridify)
    * [~groupify(dot)](#DEBE.module_Array..groupify)
    * [~blog(keys, ds, cb)](#DEBE.module_Array..blog)
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

<a name="DEBE.module_Array..blog"></a>

### Array~blog(keys, ds, cb)
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

### Env Dependencies

	HOSTNAME = name of host machine
	REPO = http://DOMAIN:ACCOUNT
	JIRA = http://DOMAIN
	RAS = http://DOMAIN
	BY = https://DOMAIN

**Requires**: <code>module:[totem](https://github.com/totemstan/totem)</code>, <code>module:[atomic](https://github.com/totemstan/atomic)</code>, <code>module:[geohack](https://github.com/totemstan/geohack)</code>, <code>module:[man](https://github.com/totemstan/man)</code>, <code>module:[randpr](https://github.com/totemstan/randpr)</code>, <code>module:[enums](https://github.com/totemstan/enums)</code>, <code>module:[reader](https://github.com/totemstan/reader)</code>, <code>module:[skin](https://github.com/totemstan/skin)</code>, <code>module:[blog](https://github.com/totemstan/blog)</code>, <code>module:[dogs](https://github.com/totemstan/dogs)</code>, <code>module:[pipe](https://github.com/totemstan/pipe)</code>, <code>module:[crypto](https://nodejs.org/docs/latest/api/)</code>, <code>module:[child\_process](https://nodejs.org/docs/latest/api/)</code>, <code>module:[fs](https://nodejs.org/docs/latest/api/)</code>, <code>module:[stream](https://nodejs.org/docs/latest/api/)</code>, <code>module:[cluster](https://nodejs.org/docs/latest/api/)</code>, <code>module:[repl](https://nodejs.org/docs/latest/api/)</code>, <code>module:[i18n-abide](https://www.npmjs.com/package/i18n-abide)</code>, <code>module:[optimist](https://www.npmjs.com/package/optimist)</code>, <code>module:[tokml](https://www.npmjs.com/package/tokml)</code>, <code>module:[officegen](https://www.npmjs.com/package/officegen)</code>  
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
				Trace(data);
			});
		}
	}
}, sql => {
	Trace( "This bad boy in an encrypted service with a database and has an /wfs endpoint" );
});	
```
**Example**  
```js
// npm test D3
// Start server using default config

config({
}, sql => {
	Trace( "Stateful network flow manger started" );
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
			}, err => Trace("add", err) );
		}
	});
});
```

* [DEBE](#module_DEBE)
    * [~$libs](#module_DEBE..$libs)
        * [.$site](#module_DEBE..$libs.$site)
        * [.$notebooks](#module_DEBE..$libs.$notebooks)
        * [.$](#module_DEBE..$libs.$)
        * [.$log](#module_DEBE..$libs.$log)
        * [.$task](#module_DEBE..$libs.$task)
        * [.$jimp](#module_DEBE..$libs.$jimp)
        * [.$sql](#module_DEBE..$libs.$sql)
        * [.$neo](#module_DEBE..$libs.$neo)
        * [.$copy](#module_DEBE..$libs.$copy)
        * [.$each](#module_DEBE..$libs.$each)
        * [.$fetch()](#module_DEBE..$libs.$fetch)
        * [.$get()](#module_DEBE..$libs.$get)
        * [.$ran()](#module_DEBE..$libs.$ran)
        * [.$api()](#module_DEBE..$libs.$api)
    * [~tableRoutes.](#module_DEBE..tableRoutes.)
    * [~defaultDocs](#module_DEBE..defaultDocs)
    * [~licenseOnDownload](#module_DEBE..licenseOnDownload)
    * [~filters.](#module_DEBE..filters.)
        * [.xdoc](#module_DEBE..filters..xdoc)
        * [.xxls](#module_DEBE..filters..xxls)
        * [.xpps](#module_DEBE..filters..xpps)
        * [.xppt](#module_DEBE..filters..xppt)
        * [.dbx(recs, req, res)](#module_DEBE..filters..dbx)
        * [.db(recs, req, res)](#module_DEBE..filters..db)
        * [.kml(recs, req, res)](#module_DEBE..filters..kml)
        * [.flat(recs, req, res)](#module_DEBE..filters..flat)
        * [.txt(recs, req, res)](#module_DEBE..filters..txt)
        * [.html(recs, req, res)](#module_DEBE..filters..html)
        * [.tree(recs, req, res)](#module_DEBE..filters..tree)
        * [.schema(recs, req, res)](#module_DEBE..filters..schema)
    * [~byArea.](#module_DEBE..byArea.)
        * [.root(req, res)](#module_DEBE..byArea..root)
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
        * [.graphs(req, res)](#module_DEBE..byTable..graphs)
        * [.notebooks(req, res)](#module_DEBE..byTable..notebooks)
        * [.ingest(req, res)](#module_DEBE..byTable..ingest)
        * [.decode(req, res)](#module_DEBE..byTable..decode)
        * [.restart(req, res)](#module_DEBE..byTable..restart)
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
    * [~linkInspect()](#module_DEBE..linkInspect)
    * [~licenseCode()](#module_DEBE..licenseCode)
    * [~sendMail()](#module_DEBE..sendMail)
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
    * [.$site](#module_DEBE..$libs.$site)
    * [.$notebooks](#module_DEBE..$libs.$notebooks)
    * [.$](#module_DEBE..$libs.$)
    * [.$log](#module_DEBE..$libs.$log)
    * [.$task](#module_DEBE..$libs.$task)
    * [.$jimp](#module_DEBE..$libs.$jimp)
    * [.$sql](#module_DEBE..$libs.$sql)
    * [.$neo](#module_DEBE..$libs.$neo)
    * [.$copy](#module_DEBE..$libs.$copy)
    * [.$each](#module_DEBE..$libs.$each)
    * [.$fetch()](#module_DEBE..$libs.$fetch)
    * [.$get()](#module_DEBE..$libs.$get)
    * [.$ran()](#module_DEBE..$libs.$ran)
    * [.$api()](#module_DEBE..$libs.$api)

<a name="module_DEBE..$libs.$site"></a>

#### $libs.$site
**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
<a name="module_DEBE..$libs.$notebooks"></a>

#### $libs.$notebooks
**Kind**: static property of [<code>$libs</code>](#module_DEBE..$libs)  
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
<a name="module_DEBE..$libs.$fetch"></a>

#### $libs.$fetch()
**Kind**: static method of [<code>$libs</code>](#module_DEBE..$libs)  
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
Default doc for reserved notebook keys

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..licenseOnDownload"></a>

### DEBE~licenseOnDownload
**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..filters."></a>

### DEBE~filters.
Filter dataset recs on specifed req-res thread

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  

* [~filters.](#module_DEBE..filters.)
    * [.xdoc](#module_DEBE..filters..xdoc)
    * [.xxls](#module_DEBE..filters..xxls)
    * [.xpps](#module_DEBE..filters..xpps)
    * [.xppt](#module_DEBE..filters..xppt)
    * [.dbx(recs, req, res)](#module_DEBE..filters..dbx)
    * [.db(recs, req, res)](#module_DEBE..filters..db)
    * [.kml(recs, req, res)](#module_DEBE..filters..kml)
    * [.flat(recs, req, res)](#module_DEBE..filters..flat)
    * [.txt(recs, req, res)](#module_DEBE..filters..txt)
    * [.html(recs, req, res)](#module_DEBE..filters..html)
    * [.tree(recs, req, res)](#module_DEBE..filters..tree)
    * [.schema(recs, req, res)](#module_DEBE..filters..schema)

<a name="module_DEBE..filters..xdoc"></a>

#### filters..xdoc
**Kind**: static property of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..xxls"></a>

#### filters..xxls
**Kind**: static property of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..xpps"></a>

#### filters..xpps
**Kind**: static property of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..xppt"></a>

#### filters..xppt
**Kind**: static property of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..dbx"></a>

#### filters..dbx(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..db"></a>

#### filters..db(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..kml"></a>

#### filters..kml(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..flat"></a>

#### filters..flat(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..txt"></a>

#### filters..txt(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..html"></a>

#### filters..html(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..tree"></a>

#### filters..tree(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..filters..schema"></a>

#### filters..schema(recs, req, res)
**Kind**: static method of [<code>filters.</code>](#module_DEBE..filters.)  

| Param | Type | Description |
| --- | --- | --- |
| recs | <code>Array</code> | Records to filter |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byArea."></a>

### DEBE~byArea.
/AREA/FILE-endpoint routers

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..byArea..root"></a>

#### byArea..root(req, res)
Default area navigator.

**Kind**: static method of [<code>byArea.</code>](#module_DEBE..byArea.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable."></a>

### DEBE~byTable.
/TABLE-endpoint routers

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
    * [.graphs(req, res)](#module_DEBE..byTable..graphs)
    * [.notebooks(req, res)](#module_DEBE..byTable..notebooks)
    * [.ingest(req, res)](#module_DEBE..byTable..ingest)
    * [.decode(req, res)](#module_DEBE..byTable..decode)
    * [.restart(req, res)](#module_DEBE..byTable..restart)
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
Upload files to upload area

**Kind**: static property of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..stores"></a>

#### byTable..stores
Upload files to stores area

**Kind**: static property of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..search"></a>

#### byTable..search(req, res)
Search for a file

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..searches"></a>

#### byTable..searches(req, res)
Search of multiple files

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..words"></a>

#### byTable..words(req, res)
Word statistics

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..wms"></a>

#### byTable..wms(req, res)
WMS

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..wfs"></a>

#### byTable..wfs(req, res)
WFS

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..tips"></a>

#### byTable..tips(req, res)
Provide image tips.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..follow"></a>

#### byTable..follow(req, res)
Track web links.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..proctor"></a>

#### byTable..proctor(req, res)
Proctor quizes.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..likeus"></a>

#### byTable..likeus(req, res)
Update like-us stats

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..users"></a>

#### byTable..users(req, res)
Return list of clients that have used this service

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..graphs"></a>

#### byTable..graphs(req, res)
Retrieve [requested neo4j graph](/api.view#sysGraph).

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..notebooks"></a>

#### byTable..notebooks(req, res)
Return published notebooks

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..ingest"></a>

#### byTable..ingest(req, res)
Endpoint to ingest a source into the sql database

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..decode"></a>

#### byTable..decode(req, res)
Endpoint to return release information about requested license.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..restart"></a>

#### byTable..restart(req, res)
Endpoint to restart totem if authorized.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..alert"></a>

#### byTable..alert(req, res)
Endpoint to send notice to all clients

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..stop"></a>

#### byTable..stop(req, res)
Endpoint to send emergency message to all clients then halt totem

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..devstatus"></a>

#### byTable..devstatus(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..milestones"></a>

#### byTable..milestones(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..config"></a>

#### byTable..config(req, res)
Configure DEBE/TOTEM.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..info"></a>

#### byTable..info(req, res)
**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..DG"></a>

#### byTable..DG(req, res)
Digital globe interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..HYDRA"></a>

#### byTable..HYDRA(req, res)
Hydra interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..NCL"></a>

#### byTable..NCL(req, res)
NCL interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..ESS"></a>

#### byTable..ESS(req, res)
ESS interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..MIDB"></a>

#### byTable..MIDB(req, res)
MIDB interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..matlab"></a>

#### byTable..matlab(req, res)
Matlab interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byTable..ESC"></a>

#### byTable..ESC(req, res)
ESC remedy interface.

**Kind**: static method of [<code>byTable.</code>](#module_DEBE..byTable.)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..byType."></a>

### DEBE~byType.
/TABLE.TYPE-endpoint routers

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..site."></a>

### DEBE~site.
Site skinning context

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..errors."></a>

### DEBE~errors.
Error messages

**Kind**: inner property of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..paths."></a>

### DEBE~paths.
Paths to things

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
<a name="module_DEBE..linkInspect"></a>

### DEBE~linkInspect()
Inspect doc - kludge i/f to support nlp project

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..licenseCode"></a>

### DEBE~licenseCode()
License notebook engine code.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  
<a name="module_DEBE..sendMail"></a>

### DEBE~sendMail()
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
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

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
<a name="module_DEBE..usersPlugin"></a>

### DEBE~usersPlugin(req, res)
Endpoint to return users of a [requested](/api.view#usersPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem session response callback |

<a name="module_DEBE..exportPlugin"></a>

### DEBE~exportPlugin(req, res)
Endpoint to export [requested](/api.view#usersPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem session response callback |

<a name="module_DEBE..importPlugin"></a>

### DEBE~importPlugin(req, res)
Endpoint to import [requested](/api.view#usersPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem session response callback |

<a name="module_DEBE..exePlugin"></a>

### DEBE~exePlugin(req, res)
Endpoint to execute plugin req.table using usecase req.query.ID || req.query.Name.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem session response callback |

<a name="module_DEBE..modifyPlugin"></a>

### DEBE~modifyPlugin(req, res)
Endpoint to add keys to [requested](/api.view#modifyPlugin) plugin/notebook/table.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem session response callback |

<a name="module_DEBE..retractPlugin"></a>

### DEBE~retractPlugin(req, res)
Endpoint to remove keys from [requested](/api.view#retractPlugin) plugin/notebook/table given.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem session response callback |

<a name="module_DEBE..helpPlugin"></a>

### DEBE~helpPlugin(req, res)
Endpoint to return plugin/notebook/table usage info.

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | http request |
| res | <code>function</code> | Totem session response callback |

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
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

<a name="module_DEBE..getCert"></a>

### DEBE~getCert(req, res)
Endpoint to create/return public-private certs of given [url query](/api.view#getCert)

**Kind**: inner method of [<code>DEBE</code>](#module_DEBE)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Totem session request |
| res | <code>function</code> | Totem session response |

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