const REPL = require("repl"); REPL.start({prompt:'$>'}); 
const {$} = DEBE.pluginLibs; 
DEBE.config({}, sql=> console.log('LAB is up')); 