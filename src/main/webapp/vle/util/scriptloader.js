/*****														******
 * 			Helper functions for the scriptloader				 *
 *****														*****/
function createAttribute(doc, node, type, val){
	var attribute = doc.createAttribute(type);
	attribute.nodeValue = val;
	node.setAttributeNode(attribute);
};

function createElement(doc, type, attrArgs){
	var newElement = doc.createElement(type);
	if(attrArgs!=null){
		for(var option in attrArgs){
			createAttribute(doc, newElement, option, attrArgs[option]);
		}
	}
	return newElement;
};

if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    };
};

/**
 * Scriptloader is an object that dynamically loads scripts and
 * css into the given document. All scripts loaded through the
 * scriptloader need to fire a 'scriptLoaded' event in the
 * eventManager, so that scriptLoader knows they are completely
 * loaded.
 */
var scriptloader = function(){
	var eventManager;
	var queue = [];
	var waitingOnDependencyQueue = [];
	var baseUrl;
	var timer;
	var location;
	var currentDoc;
	var currentName;
	var baseUrl;
	var scriptLoaderWait = 30000;
	var callerId;
	var loaded = [];
	
	/**
	 * scriptLoader listener listens for all scriptLoaded events and
	 * fires scriptsLoaded when all scripts for a given load request
	 * has completed.
	 */
	var listener = function(type, args, obj){
		if(type=='scriptLoaded'){
			var name = args[0];
			var ndx = queue.indexOf(name);
			if(ndx!=-1){
				//add to loaded
				loaded.push(name);
				
				//remove from queue
				queue.splice(ndx, 1);

				//check for any waiting dependencies that have been fulfilled and load them
				//if they have since been loaded
				for(var e=0;e<waitingOnDependencyQueue.length;e++){
					if(dependenciesLoaded(waitingOnDependencyQueue[e]) && queue.indexOf(waitingOnDependencyQueue[e])!=-1){
						var url = waitingOnDependencyQueue[e];
						waitingOnDependencyQueue.splice(e,1);
						loadScript(url);
					}
				}
				
				//check to see if this batch of scripts is done, do
				//cleanup and fire scriptsLoaded event if it is
				if(queue.length<1){
					resetTimer();
					eventManager.fire('scriptsLoaded', [callerId, currentName]);
				}
			}
		}
	};
	
	/**
	 * resets the timer
	 */
	var resetTimer = function(){		
		clearTimeout(timer);
		timer = null;
	};
	
	/**
	 * Verifies and loads the css and javascripts into the
	 * currentDoc.
	 */
	var loadScripts = function(){
		var s = scripts[currentName];
		var c = css[currentName];
		
		//load each css specified
		if(c){
			for(var d=0;d<c.length;d++){
				loadCss(c[d]);
			}
		}
		
		//load each script specified, if none specified fire scriptsLoaded event
		if(s && s.length>0){
			/* because of ie, we need to stick all of the scripts into the queue before
			 * attempting to launch any of them (otherwise it may empty the queue for each
			 * script and continue to fire the scriptsLoaded event) */
			for(var a=0;a<s.length;a++){
				queue.push(s[a]);
			}
			
			/* now load any scripts without dependencies or those whose dependencies
			 * have already been loaded or stick them in the waiting queue */
			for(var a=0;a<s.length;a++){
				if(hasDependency(s[a]) && !dependenciesLoaded(s[a])){
					waitingOnDependencyQueue.push(s[a]);
				} else {
					loadScript(s[a]);
				}
			}
		} else {
			resetTimer();
			eventManager.fire('scriptsLoaded', [callerId, currentName]);
		}
	};
	
	/**
	 * Only loads the css of the currentName into the current document. Used
	 * when using compressed scripts.
	 */
	var loadCssOnly = function(){
		var c = css[currentName];
		
		//load each css specified
		if(c){
			for(var d=0;d<c.length;d++){
				loadCss(c[d]);
			}
		}
	};
	
	/**
	 * Returns true if the given url has been loaded into
	 * the currentDoc, false otherwise.
	 */
	var isLoaded = function(url){
		return loaded.indexOf(url) != -1;
	};
	
	/**
	 * Loads the script at the given url into the doc
	 */
	var loadScript = function(url){
		currentDoc.getElementsByTagName('head')[0].appendChild(createElement(currentDoc, 'script', {type: 'text/javascript', src: baseUrl + url}));
	};
	
	/**
	 * Loads the css at the given url into the doc
	 */
	var loadCss = function(url){
		currentDoc.getElementsByTagName('head')[0].appendChild(createElement(currentDoc, 'link', {rel: 'stylesheet', type: 'text/css', href: baseUrl + url}));
	};
	
	/**
	 * Returns true if the given script url has any dependencies,
	 * false otherwise.
	 */
	var hasDependency = function(url){
		return dependencies[url];
	};
	
	/**
	 * Returns true if the given script url has no dependencies or
	 * if all listed dependencies have been loaded, false otherwise.
	 */
	var dependenciesLoaded = function(url){
		var deps = dependencies[url];
		if(deps){
			for(var f=0;f<deps.length;f++){
				if(!isLoaded(deps[f]) && scripts[currentName].indexOf(deps[f])!=-1){
					return false;
				}
			}
			return true;
		} else {
			return true;
		}
	};
	
	/**
	 * Script urls specified for all components and javascripts
	 */
	var scripts = {
        bootstrap: ['vle/util/componentloader.js',
                  'vle/view/view.js',
                  'vle/node/nodefactory.js',
                  'vle/environment/environment.js',
                  'vle/jquery/js/jquery-1.6.1.min.js',
  		          'vle/jquery/js/jquery-ui-1.8.7.custom.min.js',
  		          'vle/jquery/js/jsonplugin.js',
  		          'vle/jquery/js/jqueryhelper.js',
 			      'vle/node/Node.js',
 			      'vle/node/DuplicateNode.js', 
  		          'vle/node/setupNodes.js'
  		          ],
  		bootstrap_min: ['vle/minified/bootstrap_min.js'],
  		setup: [],
        core: ['vle/view/i18n/view_i18n.js',
               'vle/common/helperfunctions.js',
               'vle/view/coreview.js',
               'vle/view/view_utils.js',               
               "vle/io/ConnectionManager.js",
               "vle/session/SessionManager.js",
               "vle/util/NotificationManager.js",
               'vle/content/content.js',
               'vle/node/common/nodehelpers.js',
               'vle/project/Project.js',
		       'vle/node/NodeUtils.js',
               'vle/grading/Annotation.js',
	           'vle/grading/Annotations.js',
               'vle/data/nodevisit.js',
               'vle/hint/hintstate.js',
               'vle/data/StudentStatus.js'],
        core_min: ['vle/minified/core_min.js'],
        studentXMPP: [
       	                  'vle/xmpp/js/sail.js/deps/base64.js',
                          'vle/xmpp/js/sail.js/deps/jquery.cookie.js',
                          'vle/xmpp/js/sail.js/deps/jquery.url.js',
                          'vle/xmpp/js/sail.js/deps/load.js',
                          'vle/xmpp/js/sail.js/deps/md5.js',
                          'vle/xmpp/js/sail.js/deps/strophe.js',                  
                      'vle/xmpp/js/sail.js/sail.js',
	                  'vle/xmpp/js/sail.js/sail.rollcall.js',
	                  'vle/xmpp/js/sail.js/sail.wiseauthenticate.js',
	                  'vle/xmpp/js/sail.js/sail.strophe.js',
                      'vle/xmpp/js/student.js',
	                  'vle/xmpp/js/sail.js/sail.ui.js'
                  ],
        teacherXMPP: ['vle/xmpp/js/sail.js/deps/base64.js',
                      'vle/xmpp/js/sail.js/deps/jquery.cookie.js',
                      'vle/xmpp/js/sail.js/deps/jquery.url.js',
                      'vle/xmpp/js/sail.js/deps/load.js',
                      'vle/xmpp/js/sail.js/deps/md5.js',
                      'vle/xmpp/js/sail.js/deps/strophe.js',                  
                  'vle/xmpp/js/sail.js/sail.js',
                  'vle/xmpp/js/sail.js/sail.rollcall.js',
                  'vle/xmpp/js/sail.js/sail.wiseauthenticate.js',
                  'vle/xmpp/js/sail.js/sail.strophe.js',
                  'vle/xmpp/js/teacher.js',
                  'vle/xmpp/js/sail.js/sail.ui.js'],
        teacherXMPP_min:['vle/minified/teacherXMPP_min.js'],
        author: ['vle/util/icon.js',
                 'vle/jquery/tinymce/jscripts/tiny_mce/jquery.tinymce.js',
                 'vle/view/authoring/authorview_dispatchers.js',
                 'vle/view/authoring/authorview_startup.js',
                 'vle/view/authoring/authorview_main.js',
                 'vle/view/authoring/authorview_dialog.js',
                 'vle/view/authoring/authorview_audio.js',
                 'vle/view/authoring/authorview_meta.js',
                 'vle/view/authoring/authorview_selection.js',
                 'vle/view/authoring/authorview_utils.js',
                 'vle/view/authoring/authorview_previouswork.js',
                 'vle/view/authoring/authorview_projecttags.js',
                 'vle/view/authoring/authorview_authorstep.js',
                 'vle/view/authoring/authorview_tags.js',
                 'vle/view/authoring/cleaning/authorview_clean_main.js',
                 'vle/view/authoring/cleaning/authorview_clean_parts.js',
                 'vle/view/authoring/cleaning/authorview_clean_problem.js',
                 'vle/view/authoring/cleaning/authorview_clean_solution.js',
                 'vle/view/authoring/cleaning/authorview_clean_analyzer.js',
                 'vle/view/authoring/constraints/authorview_constraint.js',
		         'vle/navigation/constraints/constraint.js',
		         'vle/navigation/constraints/constraintfactory.js',
		         'vle/navigation/constraints/nonvisitablexconstraint.js',
		         'vle/navigation/constraints/visitxafteryconstraint.js',
		         'vle/navigation/constraints/visitxbeforeyconstraint.js',
		         'vle/navigation/constraints/visitxoryconstraint.js',
		         'vle/navigation/constraints/workonxbeforeyconstraint.js',
		         'vle/navigation/constraints/workonxconstraint.js',
		         'vle/navigation/constraints/workonxbeforeadvancingconstraint.js',
	             'vle/grading/MaxScores.js',
		         'vle/grading/MaxScore.js'],
		grading: ['vle/view/grading/gradingview_annotations.js',
		          'vle/view/grading/gradingview_dispatcher.js',
		          'vle/view/grading/gradingview_display.js',
	              'vle/view/grading/gradingview_export.js',
	              'vle/view/grading/gradingview_startup.js',
	              'vle/view/grading/gradingview_studentwork.js',
	              'vle/jquery/js/jquery.tablesorter.min.js', // TODO: remove when all references are removed
	              'vle/jquery/jquery-dataTables/js/jquery.dataTables.min.js',
	              'vle/jquery/jquery-dataTables/extras/FixedHeader/js/FixedHeader.min.js',
	              'vle/view/grading/gradingview_premadecomments.js',
	              'vle/jquery/js/jquery.editinplace.js',
	              'vle/swfobject/swfobject.js'],
	    grading_min: ['vle/minified/grading_min.js'],
	    user: ['vle/user/userandclassinfo.js'],	    
	    config: ['vle/config/config.js'],
		keystroke: ['vle/util/keystrokemanager.js'],
		customcontextmenu: ['vle/util/customcontextmenu.js'],
        outsideurl: [],
		shortcuts: ['vle/util/shortcutmanager.js'],
		ddMenu: ['vle/common/dropdown.js'],
		topMenu: ['vle/view/vle/vleview_topmenu.js'],
		vle: ['vle/util/icon.js',
		      'vle/view/vle/vleview_core.js',
		      'vle/view/vle/vleview_utils.js',
		      'vle/view/vle/vleview_studentwork.js'],
		studentwork: ['vle/data/vlestate.js',
		              'vle/data/nodevisit.js'
		              ],
		studentwork_min: ['vle/minified/studentwork_min.js'
		    		              ],		   
		annotations: ['vle/grading/Annotations.js',
		              'vle/grading/Annotation.js'],
		annotations_min: ['vle/minified/annotations_min.js'],
		maxscores: ['vle/grading/MaxScores.js',
		            'vle/grading/MaxScore.js'],
		maxscores_min:['vle/minified/maxscores_min.js'],
		hint: ['vle/view/vle/vleview_hint.js'],
		navigation: ['vle/navigation/NavigationLogic.js',
		            'vle/navigation/DFS.js',
		            'vle/view/vle/vleview_navigation.js',
		            'vle/navigation/constraints/constraint.js',
		            'vle/navigation/constraints/constraintfactory.js',
		            'vle/navigation/constraints/nonvisitablexconstraint.js',
		            'vle/navigation/constraints/visitxafteryconstraint.js',
		            'vle/navigation/constraints/visitxbeforeyconstraint.js',
		            'vle/navigation/constraints/visitxoryconstraint.js',
		            'vle/navigation/constraints/workonxbeforeyconstraint.js',
		            'vle/navigation/constraints/workonxconstraint.js',
		            'vle/navigation/constraints/workonxbeforeadvancingconstraint.js',
		            'vle/navigation/constraints/constraintmanager.js'],
		menu:['vle/ui/menu/sdmenu.js',
		      'vle/ui/menu/NavigationPanel.js',
		      'vle/view/vle/vleview_menu.js'],
		uicontrol:['vle/ui/control/RunManager.js',
		           'vle/view/vle/vleview_uicontrol.js'],
		audio:['vle/sound/AudioManager.js',
		       'vle/sound/md5.js',
		       'vle/sound/nodeaudio.js',
		       'vle/view/vle/vleview_audio.js'],
		vle_all:['vle/all/vle_all-min.js'],
		grading_all:['vle/all/grading_all-min.js'],
		authoring_all:['vle/all/authoring_all-min.js'],
		summary_all:['vle/all/summary_all-min.js'],         
		journal:['vle/view/vle/vleview_journal.js',
		         'vle/journal/Journal.js',
		         'vle/journal/JournalPage.js',
		         'vle/journal/JournalPageRevision.js'],
		peerreviewhelper: [],
		authoringcomponents:['vle/view/authoring/components/authorview_prompt.js',
                'vle/view/authoring/components/authorview_linkto.js',
                'vle/view/authoring/components/authorview_studentresponseboxsize.js',
                'vle/view/authoring/components/authorview_richtexteditortoggle.js',
                'vle/view/authoring/components/authorview_startersentenceauthoring.js'],
        premadecomments:['vle/jquery/js/jquery-1.6.1.min.js',
                         'vle/jquery/js/jquery.editinplace.js',
                         'vle/jquery/js/jquery-ui-1.8.7.custom.min.js'],
        ideabasket:['vle/ideaBasket/basket.js']
	};
	
	/**
	 * Css urls specified for all component css
	 */
	var css = {
		bootstrap:['vle/jquery/css/custom-theme/jquery-ui-1.8.7.custom.css'],
		bootstrap_min:['vle/jquery/css/custom-theme/jquery-ui-1.8.7.custom.css'],
		core: ['vle/css/message.css'],
		core_min: ['vle/css/message.css'],
		author: ['vle/css/authoring/authoring.css',
		         'vle/css/ui-tools.css'
		         ],
		wise: ["vle/css/wise/WISE_styles.css"],
		uccp: ["vle/css/uccp/UCCP_styles.css"],
		vle: ["vle/css/niftycube.css"],
    	navigation:["vle/css/navigation.css"],
    	menu:["vle/css/sdmenu.css"],
 		grading: ['vle/css/portal/teachergrading.css',
 		         //'vle/jquery/css/blue/style.css',
 		         'vle/jquery/jquery-dataTables/css/datatable.css',
 		         'vle/jquery/css/tels-theme/jquery-ui-1.8.14.custom.css'],
 		grading_min: ['vle/css/portal/teachergrading.css',
 		 		         'vle/jquery/css/blue/style.css'],
 		ideabasket: ['vle/css/ideaManager/jquery-validate/cmxformTemplate.css']
    	         
	};
	
	/**
	 * Known dependencies for a script
	 */
	var dependencies = {	
		"vle/node/setupNodes.js": ["vle/node/nodefactory.js"],
    	"vle/project/Project.js": ["vle/node/Node.js"],
    	'vle/node/NodeUtils.js': ['vle/node/Node.js'],
    	"vle/node/DrawNode.js": ["vle/node/HtmlNode.js"],
        "vle/node/CustomNode.js": ["vle/node/Node.js"],
        "vle/node/JournalNode.js": ["vle/node/Node.js"],
        "vle/node/JournalEntryNode.js": ["vle/node/Node.js", "vle/node/OpenResponseNode.js"],
        "vle/node/BlueJNode.js": ["vle/node/Node.js"],
        'vle/node/DuplicateNode.js': ['vle/node/Node.js', 'vle/node/nodefactory.js'],
        'vle/node/BranchNode.js':['vle/node/Node.js','vle/node/MultipleChoiceNode.js'],
        "vle/ui/vleui.js": ["vle/VLE.js"],
        "vle/util/projectutils.js": ["vle/project/Project.js"],
        'vle/jquery/js/jquery-ui-1.8.7.custom.min.js':['vle/jquery/js/jquery-1.6.1.min.js'],
        'vle/jquery/js/jsonplugin.js':['vle/jquery/js/jquery-1.6.1.min.js'],
        'vle/jquery/js/jqueryhelper.js':['vle/jquery/js/jquery-1.6.1.min.js'],
        'vle/navigation/constraints/nonvisitablexconstraint.js':['vle/navigation/constraints/constraint.js'],
        'vle/navigation/constraints/visitxafteryconstraint.js':['vle/navigation/constraints/constraint.js'],
        'vle/navigation/constraints/visitxbeforeyconstraint.js':['vle/navigation/constraints/constraint.js'],
        'vle/navigation/constraints/visitxoryconstraint.js':['vle/navigation/constraints/constraint.js'],
        'vle/navigation/constraints/workonxbeforeyconstraint.js':['vle/navigation/constraints/constraint.js'],
        'vle/navigation/constraints/workonxconstraint.js':['vle/navigation/constraints/constraint.js'],
        'vle/navigation/constraints/workonxbeforeadvancingconstraint.js':['vle/navigation/constraints/constraint.js'],
        'vle/xmpp/js/sail.js/sail.strophe.js':['vle/xmpp/js/sail.js/deps/strophe.js'],
        'vle/xmpp/js/student.js':['vle/xmpp/js/sail.js/sail.js','vle/xmpp/js/sail.js/sail.strophe.js'],
        'vle/xmpp/js/teacher.js':['vle/xmpp/js/sail.js/sail.js','vle/xmpp/js/sail.js/sail.strophe.js']
    };
	
	return {
		loadScripts:function(name, doc, cid, em){
			loaded = [];
			currentDoc = doc;
			currentName = name;
			callerId = cid;
			eventManager = em;
			baseUrl = currentDoc.location.toString().substring(0, currentDoc.location.toString().lastIndexOf('/vle/') + 1);
			timer = setTimeout(function(){alert(scriptloader.getTimeoutMessage());}, scriptLoaderWait);
			loadScripts();
		},
		bootstrap:function(win, fun, isMinifiedEnabled){
			win.eventManager = new EventManager(false);
			win.eventManager.addEvent('scriptLoaded');
			win.eventManager.addEvent('scriptsLoaded');
			win.eventManager.subscribe('scriptLoaded', listener);
			win.eventManager.subscribe('scriptsLoaded', fun);
			
			if (isMinifiedEnabled) {
				scriptloader.loadScripts('bootstrap_min', win.document, 'bootstrap_min', win.eventManager);
			} else {
				scriptloader.loadScripts('bootstrap', win.document, 'bootstrap', win.eventManager);
			}
		},
		loadCssOnly:function(name, doc){
			currentName = name;
			currentDoc = doc;
			baseUrl = currentDoc.location.toString().substring(0, currentDoc.location.toString().lastIndexOf('/vle/') + 1);
			loadCssOnly();
		},
		getScriptsArray:function(name){
			if(scripts[name]){
				return scripts[name];
			} else {
				return [];
			}
		},
		getTimeoutMessage:function(){
			return 'It has been too long and the following scripts have not called in to the listener: ' + queue;
		},
		resetTimer:function() {
			resetTimer();
		},
		/*
		 * Adds a script to a given component
		 * @param componentName a string specifying the component the script is for
		 * @param scriptPath a string containing the path or an array
		 * that contains one or more string paths
		 */
		addScriptToComponent:function(componentName, scriptPath) {
			if(scriptPath != null) {
				//check if that component already exists
				if(scripts[componentName] == null) {
					//it does not exist so we will create an array for it
					scripts[componentName] = [];
				}
				
				//check if the scriptPath is an array or a string
				if(scriptPath.constructor.toString().indexOf("Array") != -1) {
					//scriptPath is an Array
					
					//loop through all the elements in the array
					for(var x=0; x<scriptPath.length; x++) {
						//check if the script path is already in the component array
						if(scripts[componentName].indexOf(scriptPath[x]) == -1) {
							//add an element to the component array
							scripts[componentName].push(scriptPath[x]);
						}
					}
				} else if(scriptPath.constructor.toString().indexOf("String") != -1) {
					//check if the script path is already in the component array
					if(scripts[componentName].indexOf(scriptPath) == -1) {
						//scriptPath is a String, add it to the component array
						scripts[componentName].push(scriptPath);
					}
				}
			}
		},
		/*
		 * Adds a css path to a given component
		 * @param componentName a string specifying the component the css is for
		 * @param scriptPath a string containing the css path or an array
		 * that contains one or more string css paths
		 */
		addCssToComponent:function(componentName, cssPath) {
			if(cssPath != null) {
				//check if that component already exists
				if(css[componentName] == null) {
					//it does not exist so we will create an array for it
					css[componentName] = [];
				}
				
				//check if the cssPath is an array or a string
				if(cssPath.constructor.toString().indexOf("Array") != -1) {
					//cssPath is an Array
					
					//loop through all the elements in the array
					for(var x=0; x<cssPath.length; x++) {
						//add an element to the component array
						css[componentName].push(cssPath[x]);
					}
				} else if(cssPath.constructor.toString().indexOf("String") != -1) {
					//cssPath is a String, add it to the component array
					css[componentName].push(cssPath);
				}
			}
		},
		/**
		 * Adds a dependency
		 * @param an array containing JSONObjects. each JSONObject specifies
		 * a dependency. a JSONObject contains a child attribute and a parent
		 * attribute. the child attribute is a string specifying a script
		 * path that depends on other scripts. the parent attribute is an
		 * array that contains one or more script paths that needed to
		 * be loaded before the child script path can be loaded.
		 */
		addDependencies:function(dependenciesToAdd) {
			
			//loop through all the dependency objects
			for(var x=0; x<dependenciesToAdd.length; x++) {
				//get a dependency object
				var dependency = dependenciesToAdd[x];
				
				//the path of the script that depends on other scripts
				var child = dependency.child;
				
				//an array of scripts that the child depends on
				var parent = dependency.parent;
				
				//add the dependency to our dependencies object
				dependencies[child] = parent;
			}
		},
		/**
		 * Determines which step types are used in the project and
		 * tells the scriptloader to only retrieve the files for those
		 * step types
		 * 
		 * @param setupFiles an array of objects, each object contains
		 * two fields, nodeName and nodeSetupPath. the array that is
		 * passed into this function can be found in setupNodes.js
		 */
		insertSetupPaths:function(setupFiles) {
			if(document.location.pathname.indexOf('vle.html') != -1 || document.location.pathname.indexOf('gradework.html') != -1) {
				/*
				 * we are loading the vle or grading tool so we only need to
				 * load certain step types. we will try to obtain the project.json
				 * file and only load the step types that are in that file.
				 */
				try {
					var xmlhttp;
					if (window.XMLHttpRequest) {
						// code for IE7+, Firefox, Chrome, Opera, Safari
						xmlhttp=new XMLHttpRequest();
					} else {
						// code for IE6, IE5
						xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
					}

					/*
					 * open the path to the project json file, the path to the
					 * project json file will be placed in the contentUrl variable
					 * by the .jsp file
					 */
					xmlhttp.open("GET", parent.window.contentUrl, false);
					
					//perform the request
					xmlhttp.send(null);

					if(xmlhttp.responseText != null) {
						var projectJSONObj = null;
						var nodeTypes = [];
						
						//parse the project json string into a json object						
						if(typeof JSON != 'undefined') {
							projectJSONObj = JSON.parse(xmlhttp.responseText);
						} else if(typeof $.parseJSON != 'undefined') {
							projectJSONObj = $.parseJSON(xmlhttp.responseText);
						}
						

						//loop through the sequences in the project and get all node ids that are used
						var allRefs = [];
						for (var j=0; j < projectJSONObj.sequences.length; j++) {
							// get refs and add to refs array
							allRefs = allRefs.concat(projectJSONObj.sequences[j].refs);
						}

						//get all the nodes in the project
						var jsonNodes = projectJSONObj.nodes;
						if(!jsonNodes){
							jsonNodes = [];
						}

						//loop through all the nodes in the project
						for (var i=0; i < jsonNodes.length; i++) {
							//get a node
							var currNode = jsonNodes[i];
							
							//get node id
							var nodeId = currNode.identifier;
							
							// check to see if node is referenced in the sequence
							if (allRefs.indexOf(nodeId) != -1) {
								//get the node type
								var nodeType = currNode.type;
							
								if(nodeTypes.indexOf(nodeType) == -1) {
									//add it to our array of node types if it is not already in the array
									nodeTypes.push(nodeType);
								}
							}
						}
						
						//loop through all the setup files
						for(var x=0; x<setupFiles.length; x++) {
							var setupFile = setupFiles[x];
							
							//get the name of the node type
							var nodeName = setupFile.nodeName;
							
							//check if the node type is in the array of node types we want
							if(nodeTypes.indexOf(nodeName) != -1) {
								//this node is in the array of node types we want
								
								//get the path to the setup file for this node type
								var nodeSetupPath = setupFile.nodeSetupPath;

								//add the path into the setup component
								scriptloader.addScriptToComponent('setup', nodeSetupPath);
							}
						}
					} else {
						//there was no responseText so we will just insert all the step types
						this.insertAllSetupPaths(setupFiles);
					}
				} catch(e) {
					/*
					 * there was an exception while trying to retrieve the project.json
					 * file so we will just insert all the step types
					 */
					this.insertAllSetupPaths(setupFiles);
				}
			} else {
				//insert all the step types since we are loading the authoring tool
				this.insertAllSetupPaths(setupFiles);
			}
		},
		/**
		 * Tells the scriptloader to retrieve the files for all the step types
		 * 
		 * @param setupFiles an array of objects, each object contains
		 * two fields, nodeName and nodeSetupPath. the array that is
		 * passed into this function can be found in setupNodes.js
		 */
		insertAllSetupPaths:function(setupFiles) {
			/*
			 * we are loading the authoring tool or anything else not specified
			 * so we will load all step types
			 */
			
			//loop through all the setup objects
			for(var x=0; x<setupFiles.length; x++) {
				//get a setup object
				var setupFile = setupFiles[x];
				
				//get the path
				var nodeSetupPath = setupFile.nodeSetupPath;
				
				//add the path into the setup component
				scriptloader.addScriptToComponent('setup', nodeSetupPath);
			}
		}
	};
}();