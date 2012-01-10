﻿/* Modular Project Object */
function createProject(content, contentBaseUrl, lazyLoading, view, totalProjectContent){
	return function(content, cbu, ll, view, totalProjectContent){
		var content = content;
		var contentBaseUrl = cbu;
		var lazyLoading = ll;
		var allLeafNodes = [];
		var allSequenceNodes = [];
		var autoStep;
		var stepLevelNumbering;
		var title;
		var stepTerm;
		var rootNode;
		var view = view;
		var copyIds = [];
		var loggingLevel = 5; //default to log everything
		var postLevel = 5; //default to post all steps
		var totalProjectContent = totalProjectContent;
		var constraints = [];
		
		/* When parsing a minified project, looks up and returns each node's content
		 * based on the given id.*/
		var getMinifiedNodeContent = function(id){
			var nodes = totalProjectContent.getContentJSON().nodes;
			for(var i=0;i<nodes.length;i++){
				if(nodes[i].identifier==id){
					return nodes[i].content;
				};
			};
		};
		
		/* returns an array of all the duplicate nodes in this project */
		var getDuplicateNodes = function(){
			var duplicates = [];
			for(var a=0;a<allLeafNodes.length;a++){
				if(allLeafNodes[a].type=='DuplicateNode'){
					duplicates.push(allLeafNodes[a]);
				}
			}
			
			return duplicates;
		};
		
		/* after the leaf nodes have been generated, retrieves the real nodes
		 * and sets them in the duplicate nodes in this project */
		var setRealNodesInDuplicates = function(){
			var duplicates = getDuplicateNodes();
			for(var b=0;b<duplicates.length;b++){
				duplicates[b].realNode = getNodeById(duplicates[b].realNodeId);
			}
		};
		
		/* Creates the nodes defined in this project's content */
		var generateProjectNodes = function(){
			var jsonNodes = content.getContentJSON().nodes;
			if(!jsonNodes){
				jsonNodes = [];
			}
			
			for (var i=0; i < jsonNodes.length; i++) {
				var currNode = jsonNodes[i];
				var thisNode = NodeFactory.createNode(currNode, view);
				if(thisNode == null) {
					/* unable to create the specified node type probably because it does not exist in wise4 */
					view.notificationManager.notify('null was returned from project factory for node: ' + currNode.identifier + ' \nSkipping node.', 2);
				} else {
					/* validate and set identifier attribute */
					if(!currNode.identifier || currNode.identifier ==''){
						view.notificationManager.notify('No identifier for node in project file.', 3);
					} else {
						thisNode.id = currNode.identifier;
						if(idExists(thisNode.id)){
							view.notificationManager.notify('Duplicate node id: ' + thisNode.id + ' found in project', 3);
						}
					}

					if(currNode.type != 'DuplicateNode'){
						/* validate and set title attribute */
						if(!currNode.title || currNode.title==''){
							view.notificationManager.notify('No title attribute for node with id: ' + thisNode.id, 2);
						} else {
							thisNode.title = currNode.title;
						}

						/* validate and set class attribute */
						if(!currNode['class'] || currNode['class']==''){
							view.notificationManager.notify('No class attribute for node with id: ' + thisNode.id, 2);
						} else {
							thisNode.className = currNode['class'];
						}
						
						// NATE!
						if(currNode['ContentBaseUrl']) {
						    thisNode.ContentBaseUrl = currNode['ContentBaseUrl'];
						}

						/* validate filename reference attribute */
						if(!currNode.ref || currNode.ref==''){
							view.notificationManager.notify('No filename specified for node with id: ' + thisNode.id + ' in the project file', 2);
						} else {
							thisNode.content = createContent(makeUrl(currNode.ref, thisNode), contentBaseUrl);
						}
						
						//set the peerReview attribute if available
						if(!currNode.peerReview || currNode.peerReview=='') {

						} else {
							thisNode.peerReview = currNode.peerReview;
						}

						//set the teacherReview attribute if available
						if(!currNode.teacherReview || currNode.teacherReview=='') {

						} else {
							thisNode.teacherReview = currNode.teacherReview;
						}
												

						//set the reviewGroup attribute if available
						if(!currNode.reviewGroup || currNode.reviewGroup=='') {

						} else {
							thisNode.reviewGroup = currNode.reviewGroup;
						}

						//set the associatedStartNode attribute if available
						if(!currNode.associatedStartNode || currNode.associatedStartNode=='') {

						} else {
							thisNode.associatedStartNode = currNode.associatedStartNode;
						}

						//set the associatedAnnotateNode attribute if available
						if(!currNode.associatedAnnotateNode || currNode.associatedAnnotateNode=='') {

						} else {
							thisNode.associatedAnnotateNode = currNode.associatedAnnotateNode;
						}

						/* if project is loading minified, create each node's content from the parsed totalProjectContent */
						if(totalProjectContent){
							thisNode.content.setContent(getMinifiedNodeContent(thisNode.id));
						}

						/* load content now if not lazy loading */
						if(!lazyLoading){
							thisNode.content.retrieveContent();
						}
					} else {
						//node is a duplicate node
						thisNode.realNodeId = currNode.realNodeId;
					}

					/* add to leaf nodes */
					allLeafNodes.push(thisNode);
					
					/* get any previous work reference node ids and add it to node */
					thisNode.prevWorkNodeIds = currNode.previousWorkNodeIds;
					
					//get the previous node id to populate work from
					thisNode.populatePreviousWorkNodeId = currNode.populatePreviousWorkNodeId;
					
					//get the tags
					thisNode.tags = currNode.tags;
					
					//get the tagMaps
					thisNode.tagMaps = currNode.tagMaps;

					/* get links to other nodes and add it to node */
					if(currNode.links){
						thisNode.links = currNode.links;
					}

					/* add events for node rendering */
					eventManager.subscribe('pageRenderComplete', thisNode.pageRenderComplete, thisNode);
					eventManager.subscribe('contentRenderComplete', thisNode.contentRenderComplete, thisNode);
					eventManager.subscribe('scriptsLoaded', thisNode.loadContentAfterScriptsLoad, thisNode);
				}
			}
		};

		/* Creates and validates the sequences defined in this project's content */
		var generateSequences = function(){
			var project = content.getContentJSON();
			
			/* create the sequence nodes */
			var sequences = project.sequences;
			if(!sequences){
				sequences = [];
			};
			
			for(var e=0;e<sequences.length;e++){
				var sequenceNode = NodeFactory.createNode(sequences[e], view);
				
				if(sequenceNode){
					sequenceNode.json = sequences[e];
					/* validate id */
					if(idExists(sequenceNode.id)){
						view.notificationManager.notify('Duplicate sequence id: ' + sequenceNode.id + ' found in project.', 3);
					};
				};
				
				allSequenceNodes.push(sequenceNode);
			};
			
			/* get starting sequence */
			if(project.startPoint){
				var startingSequence = getNodeById(project.startPoint);
			} else {
				view.notificationManager.notify('No starting sequence specified for this project', 3);
			};
			
			/* validate that there are no loops before setting root node */
			if(startingSequence){
				for(var s=0;s<allSequenceNodes.length;s++){
					var stack = [];
					if(validateNoLoops(allSequenceNodes[s].id, stack, 'file')){
						//All OK, add children to sequence
						populateSequences(allSequenceNodes[s].id);
					} else {
						view.notificationManager.notify('Infinite loop discovered in sequences, check sequence references', 3);
						return null;
					};
				};
				rootNode = startingSequence;
			};
		};
		
		/* Returns true if a node of the given id already exists in this project, false otherwise */
		var idExists = function(id){
			return getNodeById(id);
		};
		
		/* Returns the node with the given id if the node exists, returns null otherwise. */
		var getNodeById = function(nodeId){
			for(var t=0;t<allLeafNodes.length;t++){
				if(allLeafNodes[t].id==nodeId){
					return allLeafNodes[t];
				};
			};
			for(var p=0;p<allSequenceNodes.length;p++){
				if(allSequenceNodes[p] && allSequenceNodes[p].id==nodeId){
					return allSequenceNodes[p];
				};
			};
			return null;
		};
		
		/* Returns the node at the given position in the project if it exists, returns null otherwise */
		var getNodeByPosition = function(position){
			if(position){
				var locs = position.split('.');
				var parent = rootNode;
				var current;
	
				/* cycle through locs, getting the children each cycle */
				for(var u=0;u<locs.length;u++){
					current = parent.children[locs[u]];
					
					/* if not current, then the position is off, return null */
					if(!current){
						return null;
					} else if(u==locs.length-1){
						/* if this is last location return current*/
						return current;
					} else {
						/* otherwise set parent = current for next cycle */
						parent = current;
					}
				}
			} else {
				return null;
			}
		};
		
		/* Given the filename, returns the url to retrieve the file */
		// NATE! added node optional parameter, to override global content base url
		var makeUrl = function(filename, nodeOrString){
		    var cbu = contentBaseUrl;
		    if (nodeOrString !== undefined) {
		        if (typeof(nodeOrString) == "string") {
		            cbu = nodeOrString;
		        } else if (nodeOrString.ContentBaseUrl) {
		            cbu = nodeOrString.ContentBaseUrl;
		        }
		    }
            if (cbu.lastIndexOf('\\') != -1) {
                return cbu + '\\' + filename;
            } else if (cbu) {
                return cbu + '/' + filename;
            } else {
                return filename;
            }
		};
		
		/*
		 * Given the sequence id, a stack and where search is run from, returns true if
		 * there are no infinite loops starting from given id, otherwise returns false.
		 */
		var validateNoLoops = function(id, stack, from){
			if(stack.indexOf(id)==-1){ //id not found in stack - continue checking
				var childrenIds = getChildrenSequenceIds(id, from);
				if(childrenIds.length>0){ //sequence has 1 or more sequences as children - continue checking
					stack.push(id);
					for(var b=0;b<childrenIds.length;b++){ // check children
						if(!validateNoLoops(childrenIds[b], stack)){
							return false; //found loop or duplicate id
						};
					};
					stack.pop(id); //children OK
					return true;
				} else { // no children ids to check - this is last sequence node so no loops or duplicates
					return true;
				};
			} else { //id found in stack, infinite loop or duplicate id
				return false;
			};
		};
		
		/* Given the a sequence Id, populates all of it's children nodes */
		var populateSequences = function(id){
			var sequence = getNodeById(id);
			var children = sequence.json.refs;
			for(var j=0;j<children.length;j++){
				/* validate node was defined and add it to sequence if it is */
				var childNode = getNodeById(children[j]);
				if(!childNode){
					view.notificationManager.notify('Node reference ' + children[j] + ' exists in sequence node ' + id + ' but the node has not been defined and does not exist.', 2);
				} else {
					sequence.addChildNode(childNode);
				};
			};
		};
		
		/* Given a sequence ID and location from (file or project), returns an array of ids for any children sequences */
		var getChildrenSequenceIds = function(id, from){
			var sequence = getNodeById(id);
			/* validate sequence reference */
			if(!sequence){
				view.notificationManager.notify('Sequence with id: ' + id + ' is referenced but this sequence does not exist.', 2);
				return [];
			};
			
			/* populate childrenIds */
			var childrenIds = [];
			if(from=='file'){
				/* get child references from content */
				var refs = sequence.json.refs;
				for(var e=0;e<refs.length;e++){
					childrenIds.push(refs[e]);
				};
			} else {
				/* get child references from sequence */
				var children = sequence.children;
				for(var e=0;e<children.length;e++){
					if(children[e].type=='sequence'){
						childrenIds.push(children[e].id);
					};
				};
			};
			
			return childrenIds;
		};
		
		/* Returns the node with the given title if the node exists, returns null otherwise. */
		var getNodeByTitle = function(title){
			for(var y=0;y<allLeafNodes.length;y++){
				if(allLeafNodes[y].title==title){
						return allLeafNodes[y];
				};
			};
			for(var u=0;u<allSequenceNodes.length;u++){
				if(allSequenceNodes[u].title==title){
					return allSequenceNodes[u];
				};
			};
			return null;
		};
		

		/* Helper function for getStartNodeId() */
		var getFirstNonSequenceNodeId = function(node){
			if(node){
				if(node.type=='sequence'){
					for(var y=0;y<node.children.length;y++){
						var id = getFirstNonSequenceNodeId(node.children[y]);
						if(id!=null){
							return id;
						};
					};
				} else {
					return node.id;
				};
			} else {
				view.notificationManager.notify('Cannot get start node! Possibly no start sequence is specified or invalid node exists in project.', 2);
			};
		};
		
		/* Removes all references of the node with the given id from sequences in this project */
		var removeAllNodeReferences = function(id){
			for(var w=0;w<allSequenceNodes.length;w++){
				for(var e=0;e<allSequenceNodes[w].children.length;e++){
					if(allSequenceNodes[w].children[e].id==id){
						allSequenceNodes[w].children.splice(e, 1);
					};
				};
			};
		};
		
		/* Recursively searches for first non sequence node and returns that path */
		var getPathToFirstNonSequenceNode = function(node, path){
			if(node.type=='sequence'){
				for(var y=0;y<node.children.length;y++){
					var pos = getPathToFirstNonSequenceNode(node.children[y], path + '.'  + y);
					if(pos!=undefined && pos!=null){
						return pos;
					};
				};
			} else {
				return path;
			};
		};
		
		/* Recursively searches for the given id from the point of the node down and returns the path. */
		var getPathToNode = function(node, path, id){
			if(node.id==id){
				return path;
			} else if(node.type=='sequence'){
				for(var e=0;e<node.children.length;e++){
					var pos = getPathToNode(node.children[e], path + '.' + e, id);
					if(pos){
						return pos;
					};
				};
			};
		};

		/**
		 * Prints summary report to firebug console of: All Sequences and
		 * Nodes defined for this project, Sequences defined but not used,
		 * Nodes defined but not used, Sequences used twice and Nodes used
		 * twice in this project.
		 */
		var printSummaryReportsToConsole = function(){
			printSequencesDefinedReport();
			printNodesDefinedReport();
			printUnusedSequencesReport();
			printUnusedNodesReport();
			printDuplicateSequencesReport();
			printDuplicateNodesReport();
		};
		
		/**
		 * Prints a report of all sequences defined for this project
		 * to the firebug console
		 */
		var printSequencesDefinedReport = function(){
			var outStr = 'Sequences defined by Id: ';
			for(var z=0;z<allSequenceNodes.length;z++){
				if(allSequenceNodes[z]){
					if(z==allSequenceNodes.length - 1){
						outStr += ' ' + allSequenceNodes[z].id;
					} else {
						outStr += ' ' + allSequenceNodes[z].id + ',';
					};
				};
			};
			view.notificationManager.notify(outStr, 1);
		};

		/**
		 * Prints a report of all nodes defined for this project
		 * to the firebug console
		 */
		var printNodesDefinedReport = function(){
			var outStr = 'Nodes defined by Id: ';
			for(var x=0;x<allLeafNodes.length;x++){
				if(x==allLeafNodes.length -1){
					outStr += ' ' + allLeafNodes[x].id;
				} else {
					outStr += ' ' + allLeafNodes[x].id + ',';
				};
			};
			
			view.notificationManager.notify(outStr, 1);
		};

		/**
		 * Prints a report of all unused sequences for this project
		 * to the firebug console
		 */
		var printUnusedSequencesReport = function(){
			var outStr = 'Sequence(s) with id(s): ';
			var found = false;
			
			for(var v=0;v<allSequenceNodes.length;v++){
				var rootNodeId;
				if(rootNode){
					rootNodeId = rootNode.id;
				} else {
					rootNodeId = 'rootNode';
				};
				
				if(allSequenceNodes[v] && !referenced(allSequenceNodes[v].id) && allSequenceNodes[v].id!=rootNodeId){
					found = true;
					outStr += ' ' + allSequenceNodes[v].id;
				};
			};
			
			if(found){
				view.notificationManager.notify(outStr + " is/are never used in this project", 1);
			};
		};

		/**
		 * Prints a report of all unused nodes for this project
		 * to the firebug console
		 */
		var printUnusedNodesReport = function(){
			var outStr = 'Node(s) with id(s): ';
			var found = false;
			
			for(var b=0;b<allLeafNodes.length;b++){
				if(!referenced(allLeafNodes[b].id)){
					found = true;
					outStr += ' ' + allLeafNodes[b].id;
				};
			};

			if(found){
				view.notificationManager.notify(outStr + " is/are never used in this project", 1);
			};
		};

		/**
		 * Prints a report of all duplicate sequence ids to the
		 * firebug console
		 */
		var printDuplicateSequencesReport = function(){
			var outStr = 'Duplicate sequence Id(s) are: ';
			var found = false;
			
			for(var n=0;n<allSequenceNodes.length;n++){
				if(allSequenceNodes[n]){
					var count = 0;
					for(var m=0;m<allSequenceNodes.length;m++){
						if(allSequenceNodes[m] && allSequenceNodes[n].id==allSequenceNodes[m].id){
							count ++;
						};
					};
					
					if(count>1){
						found = true;
						outStr += allSequenceNodes[n].id + ' ';
					};
				};
			};
			
			if(found){
				view.notificationManager.notify(outStr, 1);
			};
		};

		/**
		 * Prints a report of all duplicate node ids to the
		 * firebug console
		 */
		var printDuplicateNodesReport = function(){
			var outStr =  'Duplicate node Id(s) are: ';
			var found = false;
			
			for(var n=0;n<allLeafNodes.length;n++){
				var count = 0;
				for(var m=0;m<allLeafNodes.length;m++){
					if(allLeafNodes[n].id==allLeafNodes[m].id){
						count ++;
					};
				};
				
				if(count>1){
					found = true;
					outStr += allLeafNodes[n].id + ' ';
				};
			};
			
			if(found){
				view.notificationManager.notify(outStr, 1);
			};
		};

		/**
		 * Returns true if the given id is referenced by any
		 * sequence in the project, otherwise, returns false
		 */
		var referenced = function(id){
			for(var c=0;c<allSequenceNodes.length;c++){
				if(allSequenceNodes[c]){
					for(var v=0;v<allSequenceNodes[c].children.length;v++){
						if(allSequenceNodes[c].children[v].id==id){
							return true;
						};
					};
				};
			};
			return false;
		};

		/**
		 * Returns a list of the given type (node or seq) that are not a child of any
		 * sequence (defined but not attached in the project).
		 */
		var getUnattached = function(type){
			var list = [];
			
			if(type=='node'){//find unattached nodes
				var children = allLeafNodes;
			} else {//find unattached sequences
				var children = allSequenceNodes;
			};
			
			//if not referenced, add to list
			for(var x=0;x<children.length;x++){
				if(children[x] && !referenced(children[x].id) && !(rootNode==children[x])){
					list.push(children[x]);
				};
			};
			
			//return list
			return list;
		};
		
		/**
		 * Get all the nodeIds that are actually used in the project in the
		 * order that they appear in the project
		 * @param nodeTypesToExclude a : delimited string of node types to exclude
		 * in the resulting array
		 * @return an array containing all the leaf nodeIds that are used
		 * in the project, in the order that they appear in the project
		 * (this does not include the unused nodes that are in the 
		 * project.json nodes array)
		 */
		var getNodeIds = function(nodeTypesToExclude) {
			//get the project content
			var project = content.getContentJSON();
			
			//get the starting point of the project
			var startPoint = project.startPoint;
			
			//create the array that we will store the nodeIds in
			var nodeIds = [];
			
			//get the start node
			var startNode = getNodeById(startPoint);
			
			//get the leaf nodeIds
			nodeIds = getNodeIdsHelper(nodeIds, startNode, nodeTypesToExclude);
			
			//return the populated array containing nodeIds
			return nodeIds;
		};
		
		/**
		 * Recursively obtain all the leaf nodeIds.
		 * @param nodeIds an array containing all the nodeIds we have found so far
		 * @param currentNode the current node
		 * @param nodeTypesToExclude a : delimited string of node types to exclude
		 * @return an array containing all the leaf nodes 
		 */
		var getNodeIdsHelper = function(nodeIds, currentNode, nodeTypesToExclude) {
			
			if(currentNode.type == 'sequence') {
				//current node is a sequence
				
				//get the child nodes
				var childNodes = currentNode.children;
				
				//loop through all the child nodes
				for(var x=0; x<childNodes.length; x++) {
					//get a child node
					var childNode = childNodes[x];
					
					//recursively call this function with the child node
					nodeIds = getNodeIdsHelper(nodeIds, childNode, nodeTypesToExclude);
				}
			} else {
				//current node is a leaf node
				
				//get the node type
				var nodeType = currentNode.type;
				
				/*
				 * if there are no node types to exclude or if the current node type
				 * is not in the : delimited string of node types to exclude, we will
				 * add the node id to the array
				 */
				if(!nodeTypesToExclude || nodeTypesToExclude.indexOf(nodeType) == -1) {
					nodeIds.push(currentNode.id);					
				}
			}
			
			//return the updated array of nodeIds
			return nodeIds;
		};
		
		/**
		 * Get the show all work html by looping through all the nodes
		 * @param node the root project node
		 * @param showGrades whether to show grades
		 */
		var getShowAllWorkHtml = function(node, showGrades) {
			var lastTimeVisited = view.state.getLastTimeVisited();
			
			//initialize the counters for activities and steps
			this.showAllWorkStepCounter = 1;
			this.showAllWorkActivityCounter = 0;
			
			/*
			 * initialize this to false each time we generate show all work.
			 * as we generate the show all work we will check if we have
			 * found any new feedback
			 */
			this.foundNewFeedback = false;
			
			//get the show all work html
			var showAllWorkHtml =  getShowAllWorkHtmlHelper(node, showGrades, lastTimeVisited);
			
			var newFeedback = "";
			
			if(showAllWorkHtml.newFeedback != "") {
				newFeedback = "<h2 class='showAllWorkH2'>New Feedback</h2><br><hr class='showAllWorkHR'><br>" + showAllWorkHtml.newFeedback;
			}
			
			var allFeedback = "<h2 class='showAllWorkH2'>All Work</h2><br><hr class='showAllWorkHR'><br>" + showAllWorkHtml.allFeedback;
			
			return newFeedback + allFeedback;
		};
		
		/**
		 * Returns html showing all students work so far. This function recursively calls
		 * itself.
		 * @param node this can be a project node, activity node, or step node
		 * @param showGrades whether to show grades
		 * @param lastTimeVisited the time in milliseconds when the student last visited
		 */
		var getShowAllWorkHtmlHelper = function(node,showGrades, lastTimeVisited){
			var htmlSoFar = {
				newFeedback:"",
				allFeedback:""
			};
			
			if (node.children.length > 0) {
				// this is a sequence node
				
				/*
				 * check if we are on the root node which will be counter value 0.
				 * if we are on the root node we do not want to display anything.
				 */
				if(this.showAllWorkActivityCounter != 0) {
					//we are not on the root node, we are on a sequence/activity
					htmlSoFar.allFeedback += "<div class='showAllWorkActivity'><h3>" + this.showAllWorkActivityCounter + ". " + node.title + "</h3></div><br><hr class='showAllWorkHR'><br>";
				}
				
				this.showAllWorkActivityCounter++;
				
				for (var i = 0; i < node.children.length; i++) {
					var childHtmlSoFar = getShowAllWorkHtmlHelper(node.children[i], showGrades, lastTimeVisited);
					htmlSoFar.newFeedback += childHtmlSoFar.newFeedback;
					htmlSoFar.allFeedback += childHtmlSoFar.allFeedback;
				}
			} else {
				// this is a leaf node
				if(node.type != "HtmlNode" && node.type != "OutsideUrlNode") {
					//only display non-HtmlNode steps
					
					var nodeId = node.id;
					
					var vlePosition = getVLEPositionById(nodeId);
					
					//feedback html that is common to the allFeedback and newFeedback
					var commonFeedback = "";
					
					/*
					 * used to hold the beginning of the allFeedback html, the rest
					 * of the html is set to the commonFeedback because it is the
					 * same for allFeedback and newFeedback
					 */
					var tempAllFeedback = "";
					
					/*
					 * used to hold the beginning of the newFeedback html, the rest
					 * of the html is set to the commonFeedback because it is the
					 * same for allFeedback and newFeedback
					 */
					var tempNewFeedback = "";
					
					var stepHasNewFeedback = false;
					
					tempAllFeedback += "<div id=\"showallStep\"><a href=\"#\" onclick=\"eventManager.fire('renderNode', ['" + getPositionById(node.id) + "']); $('#showallwork').dialog('close');\">" + vlePosition + " " + node.title + "</a><div class=\"type\">"+node.getType(true)+"</div></div>";
					tempNewFeedback += "<div id=\"showallStep\"><a href=\"#\" onclick=\"eventManager.fire('renderNode', ['" + getPositionById(node.id) + "']); $('#showallwork').dialog('close');\">" + vlePosition + " " + node.title + "</a><div class=\"type\">"+node.getType(true)+"</div></div>";
				    if (showGrades) {
				    	
				    	tempAllFeedback += "<div class=\"showallStatus\">狀態： " + node.getShowAllWorkHtml(view) + "</div>";
				    	
				    	/*
				    	 * we need to pass in a prefix to be prepended to the div that is made
				    	 * otherwise there will be two divs with the same id and when we
				    	 * render the work, it will only show up in one of the divs
				    	 */
				    	tempNewFeedback += "<div class=\"showallStatus\">狀態： " + node.getShowAllWorkHtml(view, "new_") + "</div>";
						
						commonFeedback += "<div><table id='teacherTable'>";
						
						var runId = view.getConfig().getConfigParam('runId');
						
						//get this student's workgroup id
						var toWorkgroup = view.getUserAndClassInfo().getWorkgroupId();
						
						//get the teachers and shared teachers
						var fromWorkgroups = view.getUserAndClassInfo().getAllTeacherWorkgroupIds();

						var annotationHtml = "";
						
						var maxScoreForStep = "";
						
						//check if there are max scores
						if(node.view.maxScores) {
							//get the max score for the current step
							maxScoreForStep = node.view.maxScores.getMaxScoreValueByNodeId(nodeId);
						}
						
						//check if there was a max score for the current step
						if(maxScoreForStep !== "") {
							//add a '/' before the max score
							maxScoreForStep = " / " + maxScoreForStep;
						}
						
						//get the latest score annotation
						var annotationScore = view.annotations.getLatestAnnotation(runId, nodeId, toWorkgroup, fromWorkgroups, 'score');
						
						if(annotationScore && annotationScore.value != '') {
							//the p that displays the score
							var scoreP = "<p style='display: inline'>Teacher Score: " + annotationScore.value + maxScoreForStep + "</p>";
							var newP = "";

							//get the post time of the annotation
							var annotationScorePostTime = annotationScore.postTime;
							
							//check if the annotation is new for the student
							if(annotationScorePostTime > lastTimeVisited) {
								//the annotation is new so we will add a [New] label to it that is red
								newP = "<p style='display: inline; color: red;'> [New]</p>";
								
								stepHasNewFeedback = true;
								
								//we have found a new feedback so we will set this to true
								this.foundNewFeedback = true;
							}
							
							//create the row that contains the teacher score
							var annotationScoreHtml = "<tr><td class='teachermsg2'>" + scoreP + newP + "</td></tr>";
							
							//add the score annotation text
							annotationHtml += annotationScoreHtml; 	
						}
						
						//get the latest comment annotation
						var annotationComment = view.annotations.getLatestAnnotation(runId, nodeId, toWorkgroup, fromWorkgroups, 'comment');
						
						if(annotationComment && annotationComment.value != '') {
							//create the p that displays the comment
							var commentP = "<p style='display: inline'>Teacher Feedback: " + annotationComment.value + "</p>";
							var newP = "";
							
							//get the post time of the annotation
							var annotationCommentPostTime = annotationComment.postTime;
							
							//check if the annotation is new for the student
							if(annotationCommentPostTime > lastTimeVisited) {
								//the annotation is new so we will add a [New] label to it that is red
								newP = "<p style='display: inline; color: red;'> [New]</p>";
								
								stepHasNewFeedback = true;
								
								//we have found a new feedback so we will set this to true
								this.foundNewFeedback = true;
							}
							
							//create the row that contains the teacher comment
							var annotationCommentHtml = "<tr><td class='teachermsg1'>" + commentP + newP + "</td></tr>";
							
							//add the comment annotation text
							annotationHtml += annotationCommentHtml;							
						}
						
						if(annotationHtml == "") {
							//there were no annotations
							annotationHtml += "<tr><td class='teachermsg3'>" + "評分：您的教師尚未對這個步驟評分" + "<td></tr>";
						}
						
						commonFeedback += annotationHtml;
						
						commonFeedback += "</table></div><br><hr class='showAllWorkHR'><br>";
				    } else {
				    	//note: I don't think this else branch is used anymore
						var childHtmlSoFar = node.getShowAllWorkHtmlHelper(view);
						htmlSoFar.newFeedback += childHtmlSoFar.newFeedback;
						htmlSoFar.allFeedback += childHtmlSoFar.allFeedback;
				    }
				    
				    htmlSoFar.allFeedback += tempAllFeedback + commonFeedback;
				    
				    if(stepHasNewFeedback) {
				    	//set the new feedback if the teacher created new feedback for this work
				    	htmlSoFar.newFeedback += tempNewFeedback + commonFeedback;
				    }
				}
				this.showAllWorkStepCounter++;
			}
			return htmlSoFar;
		};
		
		/* Removes the node of the given id from the project */
		var removeNodeById = function(id){
			for(var o=0;o<allSequenceNodes.length;o++){
				if(allSequenceNodes[o].id==id){
					allSequenceNodes.splice(o,1);
					removeAllNodeReferences(id);
					return;
				};
			};
			for(var q=0;q<allLeafNodes.length;q++){
				if(allLeafNodes[q].id==id){
					allLeafNodes.splice(q,1);
					removeAllNodeReferences(id);
					return;
				};
			};
		};
		
		/* Removes the node at the given location from the sequence with the given id */
		var removeReferenceFromSequence = function(seqId, location){
			var seq = getNodeById(seqId);
			seq.children.splice(location,1);
		};
		
		/* Adds the node with the given id to the sequence with the given id at the given location */
		var addNodeToSequence = function(nodeId,seqId,location){
			var addNode = getNodeById(nodeId);
			var sequence = getNodeById(seqId);
			
			sequence.children.splice(location, 0, addNode); //inserts
			
			/* check to see if this changes causes infinite loop, if it does, take it out and notify user */
			var stack = [];
			if(!validateNoLoops(seqId, stack)){
				view.notificationManager.notify('This would cause an infinite loop! Undoing changes...', 3);
				sequence.children.splice(location, 1);
			};
		};
		
		/* Returns an object representation of this project */
		var projectJSON = function(){
			/* create project object with variables from this project */
			var project = {
					autoStep: autoStep,
					stepLevelNum: stepLevelNumbering,
					stepTerm: stepTerm,
					title: title,
					constraints: constraints,
					nodes: [],
					sequences: [],
					startPoint: ""
			};
			
			/* set start point */
			if(rootNode){
				project.startPoint = rootNode.id;
			};
			
			/* set node objects for each node in this project */
			for(var k=0;k<allLeafNodes.length;k++){
				project.nodes.push(allLeafNodes[k].nodeJSON(contentBaseUrl));
			};
			
			/* set sequence objects for each sequence in this project */
			for(var j=0;j<allSequenceNodes.length;j++){
				if(allSequenceNodes[j]){
					project.sequences.push(allSequenceNodes[j].nodeJSON());
				};
			};
			
			/* return the project object */
			return project;
		};
		
		/* Returns the absolute position to the first renderable node in the project if one exists, returns undefined otherwise. */
		var getStartNodePosition = function(){
			for(var d=0;d<rootNode.children.length;d++){
				var path = getPathToFirstNonSequenceNode(rootNode.children[d], d);
				if(path!=undefined && path!=null){
					return path;
				};
			};
		};
		
		/* Returns the first position that the node with the given id exists in. Returns null if no node with id exists. */
		var getPositionById = function(id){
			for(var d=0;d<rootNode.children.length;d++){
				var path = getPathToNode(rootNode.children[d], d, id);
				if(path!=undefined && path!=null){
					return path;
				};
			};
			
			return null;
		};
		
		/* Returns the filename for this project */
		var getProjectFilename = function(){
			var url = content.getContentUrl();
			return url.substring(url.indexOf(contentBaseUrl) + contentBaseUrl.length, url.length);
		};
		
		/* Returns the filename for the content of the node with the given id */
		var getNodeFilename = function(nodeId){
			var node = getNodeById(nodeId);
			if(node){
				return node.content.getFilename(contentBaseUrl);
			} else {
				return null;
			};
		};
		
		/* Given a base title, returns a unique title in this project*/
		var generateUniqueTitle = function(base){
			var count = 1;
			while(true){
				var newTitle = base + ' ' + count;
				if(!getNodeByTitle(newTitle)){
					return newTitle;
				};
				count ++;
			};
		};
		
		/* Given a base title, returns a unique id in this project*/
		var generateUniqueId = function(base){
			var count = 1;
			while(true){
				var newId = base + '_' + count;
				if((!getNodeById(newId)) && (copyIds.indexOf(newId)==-1)){
					return newId;
				};
				count ++;
			};
		};

		/* Copies the nodes of the given array of node ids and fires the event of the given eventName when complete.
		 * Replaces any DuplicateNode ids with the original node ids */
		var copyNodes = function(nodeIds, eventName){
			/* Replace any DuplicateNode ids with the original node id */
			for(var s=0;s<nodeIds.length;s++){
				nodeIds[s] = getNodeById(nodeIds[s]).getNode().id;
			}
			
			/* listener that listens for the copying of all the nodes and launches the next copy when previous is completed. 
			 * When all have completed fires the event of the given eventName */
			var listener = function(type,args,obj){
				var nodeCopiedId = args[0];
				var copiedToId = args[1];
				var copyInfo = obj;
				
				/* remove first nodeInfo in queue */
				var currentInfo = copyInfo.queue.shift();
				
				/* ensure that nodeId from queue matches nodeCopiedId */
				if(currentInfo.id!=nodeCopiedId){
					copyInfo.view.notificationManager('Copied node id and node id from queue do match, error when copying.', 3);
				};
				
				/* add to msg and add copied node id to copyIds and add to list of copied ids*/
				if(!copiedToId){
					copyInfo.msg += ' Failed copy of ' + nodeCopiedId;
				} else {
					copyInfo.msg += ' Copied ' + nodeCopiedId + ' to ' + copiedToId;
					copyInfo.view.getProject().addCopyId(copiedToId);
					copyInfo.copiedIds.push(copiedToId);
				};
				
				/* check queue, if more nodes, launch next, if not fire event with message and copiedIds as arguments */
				if(copyInfo.queue.length>0){
					/* launch next from queue */
					var nextInfo = copyInfo.queue[0];
					nextInfo.node.copy(nextInfo.eventName);
				} else {
					/* fire completed event */
					copyInfo.view.eventManager.fire(copyInfo.eventName, [copyInfo.copiedIds, copyInfo.msg]);
				};
			};
			
			/* custom object that holds information for the listener when individual copy events complete */
			var copyInfo = {
				view:view,
				queue:[],
				eventName:eventName,
				msg:'',
				copiedIds:[]
			};
			
			/* setup events for all of the node ids */
			for(var q=0;q<nodeIds.length;q++){
				var name = generateUniqueCopyEventName();
				copyInfo.queue.push({id:nodeIds[q],node:getNodeById(nodeIds[q]),eventName:name});
				view.eventManager.addEvent(name);
				view.eventManager.subscribe(name, listener, copyInfo);
			};
			
			/* launch the first node to copy if any exist in queue, otherwise, fire the event immediately */
			if(copyInfo.queue.length>0){
				var firstInfo = copyInfo.queue[0];
				firstInfo.node.copy(firstInfo.eventName);
			} else {
				view.eventManager.fire(eventName, [null, null]);
			};
		};
		
		/* Generates and returns a unique event for copying nodes and sequences */
		var generateUniqueCopyEventName = function(){
			return view.eventManager.generateUniqueEventName('copy_');
		};
		
		/* Adds the given id to the array of ids for nodes that are copied */
		var addCopyId = function(id){
			copyIds.push(id);
		};
		
		/*
		 * Retrieves the question/prompt the student reads for the step
		 * 
		 * @param nodeId the id of the node
		 * @return a string containing the prompt (the string may be an
		 * html string)
		 */
		var getNodePromptByNodeId = function(nodeId) {
			//get the node
			var node = getNodeById(nodeId);
			
			// delegate prompt lookup to the node.
			return node.getPrompt();			
		};
		
		/*
		 * Get the position of the node in the project as seen in the
		 * vle by the student.
		 * e.g. if a node is the first node in the first activity
		 * the position is 0.0 but to the student they see 1.1
		 * @param the node id we want the vle position for
		 * @return the position of the node as seen by the student in the vle
		 */
		var getVLEPositionById = function(id) {
			var vlePosition = "";
			
			//get the position
			var position = getPositionById(id) + "";
			
			if(position != null) {
				//split the position at the periods
				var positionValues = position.split(".");
				
				//loop through each value
				for(var x=0; x<positionValues.length; x++) {
					//get a value
					var value = positionValues[x];
					
					if(vlePosition != "") {
						//separate the values by a period
						vlePosition += ".";
					}
					
					//increment the value by 1
					vlePosition += (parseInt(value) + 1);
				}				
			}
			
			return vlePosition;
		};
		
		/* Returns an array of any duplicate nodes of the node with the given id. If the node with
		 * the given id is a duplicate itself, returns an array of all duplicates of the node it 
		 * represents. If the optional includeOriginal parameter evaluates to true, includes the 
		 * orignial node in the array. */
		var getDuplicatesOf = function(id, includeOriginal){
			var dups = [];
			var node = getNodeById(id);
			
			if(node != null){
				/* if this is a duplicate node, get the node that this node represents */
				if(node.type=='DuplicateNode'){
					node = node.getNode();
				}
				
				/* include the original node if parameter provided and evaluates to true */
				if(includeOriginal){
					dups.push(node);
				}
				
				/* iterate through the leaf nodes in the project and add any duplicates
				 * of the node to the duplicate array */
				for(var t=0;t<allLeafNodes.length;t++){
					if(allLeafNodes[t].type=='DuplicateNode' && allLeafNodes[t].getNode().id==node.id){
						dups.push(allLeafNodes[t]);
					}
				}
			}
			
			/* return the array */
			return dups;
		};
		
		/*
		 * Get the next available review group number
		 */
		var getNextReviewGroupNumber = function() {
			var nextReviewGroupNumber = null;
			
			//get the nodes from the project
			var nodes = content.getContentJSON().nodes;
			
			//the array to store the review group numbers we already use
			var currentReviewGroupNumbers = [];
			
			//loop through the nodes
			for(var x=0; x<nodes.length; x++) {
				//get a node
				var node = nodes[x];
				
				//get the nodeId
				var nodeId = node.identifier;
				
				//get the actual node object
				var nodeObject = getNodeById(nodeId);
				
				//get the reviewGroup attribute
				var reviewGroup = nodeObject.reviewGroup;
				
				//see if the reviewGroup attribute was set
				if(reviewGroup) {
					//check if we have already seen this number
					if(currentReviewGroupNumbers.indexOf(reviewGroup) == -1) {
						//we have not seen this number so we will add it
						currentReviewGroupNumbers.push(reviewGroup);
					}
				}
			}
			
			/*
			 * loop from 1 to 1000 in search of an available review group number.
			 * this is assuming there won't be more than 1000 review sequences
			 * in a project.
			 */
			for(var y=1; y<1000; y++) {
				//check if the current number is in our array of numbers we already use
				if(currentReviewGroupNumbers.indexOf(y) == -1) {
					/*
					 * it is not in the array so we don't use it right now and we
					 * can use it for the next review group number
					 */
					nextReviewGroupNumber = y;
					
					//exit the loop since we have found an available group number
					break;
				}
			}
			
			//return the next review group number
			return nextReviewGroupNumber;
		};
		
		/*
		 * Remove the review sequence attributes from all the nodes that are
		 * associated with the given review group number
		 */
		var cancelReviewSequenceGroup = function(reviewGroupNumber) {
			//get all the nodes
			var nodes = content.getContentJSON().nodes;
			
			//loop through all the nodes
			for(var x=0; x<nodes.length; x++) {
				//get a node
				var node = nodes[x];
				
				//get the nodeId
				var nodeId = node.identifier;
				
				//get the actual node object
				var nodeObject = getNodeById(nodeId);
				//get the review group of the node
				if(nodeObject){
					var tempReviewGroupNumber = nodeObject.reviewGroup;
				
					//check if the node has a review group
					if(tempReviewGroupNumber) {
						//check if the review group matches
						if(tempReviewGroupNumber == reviewGroupNumber) {
							//set the review sequence attributes to null
							nodeObject.peerReview = null;
							nodeObject.teacherReview = null;
							nodeObject.reviewGroup = null;
							nodeObject.associatedStartNode = null;
							nodeObject.associatedAnnotateNode = null;
						}
					}
				}
			}
			eventManager.fire('saveProject');
		};
		
		/**
		 * Get the other nodes that are in the specified review group
		 * @param reviewGroupNumber the number of the review group we want
		 * @return an array containing the nodeIds of the nodes in the
		 * review group
		 */
		var getNodesInReviewSequenceGroup = function(reviewGroupNumber) {
			//the array of nodeIds that are in the review group
			var nodesInReviewSequenceGroup = [];
			
			if(reviewGroupNumber) {
				//get all the nodes
				var nodes = content.getContentJSON().nodes;
				
				//loop through all the nodes
				for(var x=0; x<nodes.length; x++) {
					//get a node
					var node = nodes[x];
					
					//get the nodeId
					var nodeId = node.identifier;
					
					//get the actual node object
					var nodeObject = getNodeById(nodeId);
					
					if(nodeObject) {
						//get the review group of the node
						var tempReviewGroupNumber = nodeObject.reviewGroup;
						
						//the review group number matches
						if(tempReviewGroupNumber == reviewGroupNumber) {
							//add the node object to the array
							nodesInReviewSequenceGroup.push(node);
						}						
					}
				}				
			}
			
			//return the array containing the nodes in the review group
			return nodesInReviewSequenceGroup;
		};
		
		/**
		 * Get the review sequence phase of a node given
		 * the nodeId
		 * @param nodeId the id of the node we want the review
		 * phase for
		 */
		var getReviewSequencePhaseByNodeId = function(nodeId) {
			var reviewSequencePhase = "";
			
			//get the node
			var node = getNodeById(nodeId);
			
			if(node) {
				//get the review phase
				if(node.peerReview) {
					reviewSequencePhase = node.peerReview;
				} else if(node.teacherReview) {
					reviewSequencePhase = node.teacherReview;
				}				
			}
			
			//return the phase
			return reviewSequencePhase;
		};
		
		/**
		 * Determine if a position comes before or is the same position as another position
		 * @param nodePosition1 a project position (e.g. '0.1.4')
		 * @param nodePosition2 a project position (e.g. '0.1.4')
		 * @return true if nodePosition1 comes before or is the same as nodePosition2,
		 * false if nodePosition1 comes after nodePosition2
		 */
		var positionBeforeOrEqual = function(nodePosition1, nodePosition2) {
			//split nodePosition1 by the '.'
			var nodePosition1Array = nodePosition1.split(".");
			
			//split nodePosition2 by the '.'
			var nodePosition2Array = nodePosition2.split(".");
			
			//loop through all of the sub positions of nodePosition2
			for(var x=0; x<nodePosition2Array.length; x++) {
				if(x > nodePosition1Array.length - 1) {
					/*
					 * np2 has more sub positions than np1 and
					 * all the sub positions so far have been
					 * equivalent
					 * e.g.
					 * np1 = 1.1.1
					 * np2 = 1.1.1.1
					 * in this example np2 has 4 sub positions
					 * and np1 only has 3 which means np1 does
					 * come before np2
					 */
					return true;
				} else {
					//get the current sub position for both positions
					var subNodePosition1 = parseInt(nodePosition1Array[x]);
					var subNodePosition2 = parseInt(nodePosition2Array[x]);
					
					if(subNodePosition1 > subNodePosition2) {
						/*
						 * the sub position for 1 comes after the sub position for 2
						 * so nodePosition1 comes after nodePosition2
						 */
						return false;
					} else if(subNodePosition1 < subNodePosition2) {
						/*
						 * the sub position for 1 comes before the sub position for 2
						 * so nodePosition1 comes before nodePosition2
						 */
						return true;
					}
				}
			}
			
			//the positions were equal
			return true;
		};
		
		/**
		 * Determine if a position comes after another position
		 * @param nodePosition1 a project position (e.g. '0.1.9')
		 * @param nodePosition2 a project position (e.g. '0.1.10')
		 * 
		 * @return whether nodePosition1 comes after nodePosition2
		 */
		var positionAfter = function(nodePosition1, nodePosition2) {
			//split nodePosition1 by the '.'
			var nodePosition1Array = nodePosition1.split(".");
			
			//split nodePosition2 by the '.'
			var nodePosition2Array = nodePosition2.split(".");
			
			for(var x=0; x<nodePosition1Array.length; x++) {
				if(x > nodePosition2Array.length - 1) {
					/*
					 * np1 has more sub positions than np2 and
					 * all the sub positions so far have been
					 * equivalent
					 * e.g.
					 * np1 = 1.1.1.1
					 * np2 = 1.1.1
					 * in this example np1 has 4 sub positions
					 * and np2 only has 3 which means np1 does
					 * come after np2
					 */
				} else {
					//get the current sub position for both positions
					var subNodePosition1 = parseInt(nodePosition1Array[x]);
					var subNodePosition2 = parseInt(nodePosition2Array[x]);
					
					if(subNodePosition1 > subNodePosition2) {
						/*
						 * the sub position for 1 comes after the sub position for 2
						 * so nodePosition1 comes after nodePosition2
						 */
						return true;
					} else if(subNodePosition1 < subNodePosition2) {
						/*
						 * the sub position for 1 comes before the sub position for 2
						 * so nodePosition1 comes before nodePosition2
						 */
						return false;
					}
				}
			}
			
			//the positions were equal
			return false;
		};
		
		/*
		 * Get the previous and next nodeIds of the given nodeId
		 * @param nodeId the nodeId we want the previous and next of
		 */
		var getPreviousAndNextNodeIds = function(nodeId) {
			//get all the nodeIds in the project ordered
			var nodeIdsArray = getNodeIds("HtmlNode:OutsideUrlNode");
			
			//create the object that we will store the previous and next into
			var previousAndNextNodeIds = new Object();
			
			//loop through all the nodeIds in the project
			for(var x=0; x<nodeIdsArray.length; x++) {
				//get a nodeId
				var currentNodeId = nodeIdsArray[x];
				
				//compare the current nodeId with the one we want
				if(currentNodeId == nodeId) {
					//we have found the nodeId we want
					
					//get the previous nodeId
					previousAndNextNodeIds.previousNodeId = nodeIdsArray[x - 1];
					
					if(previousAndNextNodeIds.previousNodeId) {
						previousAndNextNodeIds.previousNodePosition = getVLEPositionById(previousAndNextNodeIds.previousNodeId);
					}
					
					//get the next nodeId
					previousAndNextNodeIds.nextNodeId = nodeIdsArray[x + 1];
					
					if(previousAndNextNodeIds.nextNodeId) {
						previousAndNextNodeIds.nextNodePosition = getVLEPositionById(previousAndNextNodeIds.nextNodeId);
					}
					
					break;
				}
			}
			
			return previousAndNextNodeIds;
		};
		
		/* Returns an array of nodeIds for nodes that are descendents of the given nodeId, if all is
		 * provided, also includes sequence ids that are descendents of the given nodeId */
		var getDescendentNodeIds = function(nodeId, all){
			var ids = [];
			
			/* get the node of the given id */
			var node = getNodeById(nodeId);
			
			/* if the node is a sequence, then we want to add all of its children to
			 * the ids array */
			if(node.isSequence()){
				for(var n=0;n<node.children.length;n++){
					/* if the child is a sequence, we want to splice in all of its descendent ids */
					if(node.children[n].isSequence()){
						/* if all is provided, add this sequence id to the ids array */
						if(all){
							ids.push(node.children[n].id);
						}
						
						/* add the descendents of this sequence */
						ids = ids.concat(getDescendentNodeIds(node.children[n].id, all));
					} else {
						ids.push(node.children[n].id);
					}
				}
			}
			
			return ids;
		};
		
		/* returns true if the project has any nodes that can dynamically create constraints, returns false otherwise */
		var containsConstraintNodes = function(){
			/* iterate through the leaf nodes and return true if an AssessmentListNode
			 * or a ChallengeNode is found */
			for(var y=0;y<allLeafNodes.length;y++){
				if(allLeafNodes[y].getType()=='AssessmentListNode' || allLeafNodes[y].getType()=='ChallengeNode' ||
						allLeafNodes[y].getType=='BranchNode'){
					return true;
				}
			}
			
			/* none found, return false */
			return false;
		};
		
		/* remove the constraint with the given id */
		var removeConstraint = function(id){
			for(var l=0;l<constraints.length;l++){
				if(constraints[l].id==id){
					constraints.splice(l,1);
					break;
				}
			}
		};
		
		/**
		 * Returns whether we found new feedback after generating the show all work
		 */
		var hasNewFeedback = function() {
			return this.foundNewFeedback;
		};
		
		/**
		 * Get the step number and title for a given node id
		 * @return the step number and title as a recognized by the student in the vle
		 * e.g. 1.2: Analyze the molecules
		 */
		var getStepNumberAndTitle = function(id) {
			var stepNumberAndTitle = "";
			
			//get the vle position of the step as recognized by the student in the vle
			var stepNumber = getVLEPositionById(id);
			stepNumberAndTitle += stepNumber + ": ";
			
			
			var node = getNodeById(id);
			if(node != null) {
				//get the title of the step
				stepNumberAndTitle += node.title;
			}
			
			return stepNumberAndTitle;
		};
		
		/**
		 * Recursively obtain all the leaf nodeIds that have the given tag
		 * @param tagName the tag we are looking for
		 * @return an array containing all the leaf nodes that contain the given tag
		 */
		var getNodeIdsByTag = function(tagName) {
			//get the project content
			var project = content.getContentJSON();
			
			//get the starting point of the project
			var startPoint = project.startPoint;
			
			//create the array that we will store the nodeIds in
			var nodeIds = [];
			
			//get the start node
			var startNode = getNodeById(startPoint);
			
			//get the leaf nodeIds
			nodeIds = getNodeIdsByTagHelper(nodeIds, startNode, tagName);
			
			//return the populated array containing nodeIds
			return nodeIds;
		};
		
		/**
		 * Recursively obtain all the leaf nodeIds that have the given tag
		 * @param nodeIds an array containing all the nodeIds we have found so far
		 * @param currentNode the current node
		 * @param tagName the tag we are looking for
		 * @return an array containing all the leaf nodes that contain the given tag 
		 */
		var getNodeIdsByTagHelper = function(nodeIds, currentNode, tagName) {
			
			if(currentNode.type == 'sequence') {
				//current node is a sequence
				
				//get the child nodes
				var childNodes = currentNode.children;
				
				//loop through all the child nodes
				for(var x=0; x<childNodes.length; x++) {
					//get a child node
					var childNode = childNodes[x];
					
					//recursively call this function with the child node
					nodeIds = getNodeIdsByTagHelper(nodeIds, childNode, tagName);
				}
			} else {
				//current node is a leaf node
				
				//get the tags for this node
				var tagsForNode = currentNode.tags;
				
				//check if the node has the tag we are looking for
				if(tagsForNode != null && tagsForNode.indexOf(tagName) != -1) {
					nodeIds.push(currentNode.id);					
				}
			}
			
			//return the updated array of nodeIds
			return nodeIds;
		};
		
		/**
		 * Get all the node ids by tag that occur before the current node id
		 * in the project
		 * @param tagName the tag
		 * @param nodeId the node id we want to stop at
		 */
		var getPreviousNodeIdsByTag = function(tagName, nodeId) {
			//get the project content
			var project = content.getContentJSON();
			
			//get the starting point of the project
			var startPoint = project.startPoint;
			
			//create the array that we will store the nodeIds in
			var nodeIds = [];
			
			//get the start node
			var startNode = getNodeById(startPoint);
			
			//whether we have found our node id yet
			var foundNodeId = false;
			
			//get the leaf nodeIds
			var nodeIdsAndFoundNodeId = getPreviousNodeIdsByTagHelper(nodeIds, startNode, tagName, nodeId, foundNodeId);
			
			//return the populated array containing nodeIds
			return nodeIds;
		};
		
		/**
		 * Recursively obtain all the leaf nodeIds that occur before the given
		 * nodeId in the project and also have the given tag
		 * @param nodeIds an array containing all the nodeIds we have found so far
		 * @param currentNode the current node
		 * @param tagName 
		 * @param nodeId 
		 * @param foundNodeId 
		 * @return an array containing all the leaf nodes that contain the given
		 * tag and occur before the given nodeId in the project
		 */
		var getPreviousNodeIdsByTagHelper = function(nodeIds, currentNode, tagName, nodeId, foundNodeId) {
			
			if(currentNode.type == 'sequence') {
				//current node is a sequence
				
				//get the child nodes
				var childNodes = currentNode.children;
				
				//loop through all the child nodes
				for(var x=0; x<childNodes.length; x++) {
					//get a child node
					var childNode = childNodes[x];
					
					//recursively call this function with the child node
					var nodeIdsAndFoundNodeId = getPreviousNodeIdsByTagHelper(nodeIds, childNode, tagName, nodeId, foundNodeId);
					
					//update these values
					nodeIds = nodeIdsAndFoundNodeId.nodeIds;
					foundNodeId = nodeIdsAndFoundNodeId.foundNodeId;
					
					if(foundNodeId) {
						break;
					}
				}
			} else {
				//current node is a leaf node

				if(currentNode.id == nodeId) {
					//we have found the node id that we need to stop at
					foundNodeId = true;
				} else {
					//get the tags for this node
					var tagsForNode = currentNode.tags;
					
					//check if this node has the tag we are looking for
					if(tagsForNode != null && tagsForNode.indexOf(tagName) != -1) {
						nodeIds.push(currentNode.id);					
					}					
				}
			}
			
			/*
			 * create an object so we can return the nodeIds and also whether
			 * we have found our nodeId yet
			 */
			var nodeIdsAndFoundNodeId = {
				nodeIds:nodeIds,
				foundNodeId:foundNodeId
			};
			
			//return the object with nodeIds array and foundNodeId boolean
			return nodeIdsAndFoundNodeId;
		};
		
		/**
		 * Get all the unique tags in the project.
		 */
		var getAllUniqueTagsInProject = function() {
			var uniqueTags = [];
			
			//get all the step nodes
			var nodes = allLeafNodes;
			
			//loop through all the step nodes
			for(var x=0; x<nodes.length; x++) {
				//get a node
				var node = nodes[x];
				
				if(node != null) {
					//get the tags for the node
					var tags = node.tags;
					
					if(tags != null) {
						
						//loop through all the tags for this node
						for(var t=0; t<tags.length; t++) {
							//get a tag
							var tag = tags[t];
							
							if(uniqueTags.indexOf(tag) == -1) {
								//tag is not in our array so we will add it
								uniqueTags.push(tag);
							}
						}
					}
				}
			}
			
			return uniqueTags;
		};
		
		/**
		 * Get all the unique tag maps in the project.
		 */
		var getAllUniqueTagMapsInProject = function() {
			var uniqueTagMaps = [];
			
			//get all the step nodes
			var nodes = allLeafNodes;
			
			//loop through all the step nodes
			for(var x=0; x<nodes.length; x++) {
				//get a node
				var node = nodes[x];
				
				if(node != null) {
					//get all the tag maps for this node
					var tagMaps = node.tagMaps;
					
					if(tagMaps != null) {
						
						//loop through all the tag maps for this node
						for(var t=0; t<tagMaps.length; t++) {
							//get the current tag map
							var tagMap = tagMaps[t];
							
							var tagMapAlreadyExists = false;
							
							/*
							 * loop through all the unique tag maps we have already found
							 * to see if the current tag map should be added or not
							 */
							for(var y=0; y<uniqueTagMaps.length; y++) {
								//get a tag map that we have already found
								var uniqueTagMap = uniqueTagMaps[y];
								
								/*
								 * check if we already have this current tag map by comparing
								 * all the fields with the tag map we have already found
								 */
								if(uniqueTagMap.tagName == tagMap.tagName &&
										uniqueTagMap.functionName == tagMap.functionName &&
										arraysEqual(uniqueTagMap.functionArgs, tagMap.functionArgs)) {
									//tag is not in our array so we will mark it to be added
									tagMapAlreadyExists = true;
									break;
								}
							}
							
							if(!tagMapAlreadyExists) {
								//we do not have this tag map yet so we will add it
								uniqueTagMaps.push(tagMap);
							}
						}
					}
				}
			}
			
			return uniqueTagMaps;
		};
		
		/**
		 * Shallow compare the two arrays to see if all the elements
		 * are the same
		 * @param array1 an array that we will compare
		 * @param array2 an array that we will compare
		 */
		var arraysEqual = function(array1, array2) {
			var result = true;
			
			if(array1.length != array2.length) {
				//arrays are not the same length
				result = false;
			} else {
				//arrays are the same length
				
				//loop through the elements in both arrays
				for(var x=0; x<array1.length; x++) {
					var array1Element = array1[x];
					var array2Element = array2[x];
					
					//compare the elements
					if(array1Element != array2Element) {
						/*
						 * the elements are not the same which means the
						 * arrays are not equal
						 */
						result = false;
						break;
					}
				}
			}
			
			return result;
		};
		
		/* check to see if this project was passed a minifiedStr, in which we will
		 * set the totalProjectContent and this project's content */
		 if(totalProjectContent){
			 content.setContent(totalProjectContent.getContentJSON().project);
		 };
		 
		/* parse the project content and set available attributes to variables */
		var project = content.getContentJSON();
		if(project){
			/* set auto step */
			autoStep = project.autoStep;
			
			/* set step level numbering */
			stepLevelNumbering = project.stepLevelNum;
			
			/* set step term */
			stepTerm = project.stepTerm;
			
			/* set title */
			title = project.title;
			
			/* set constraints */
			constraints = (project.constraints) ? project.constraints : [];
			
			/* create nodes for project and set rootNode*/
			generateProjectNodes();
			generateSequences();
			
			/* set up duplicate nodes */
			setRealNodesInDuplicates();
			
			/* generate reports for console */
			printSummaryReportsToConsole();
		} else {
			view.notificationManager.notify('Unable to parse project content, check project.json file. Unable to continue.', 5);
		};
		
		
		return {
			/* returns true when autoStep should be used, false otherwise */
			useAutoStep:function(){return autoStep;},
			/* sets autoStep to the given boolean value */
			setAutoStep:function(bool){autoStep = bool;},
			/* returns true when stepLevelNumbering should be used, false otherwise */
			useStepLevelNumbering:function(){return stepLevelNumbering;},
			/* sets stepLevelNumbering to the given boolean value */
			setStepLevelNumbering:function(bool){stepLevelNumbering = bool;},
			/* returns the step term to be used when displaying nodes in the navigation for this project */
			getStepTerm:function(){return stepTerm;},
			/* sets the step term to be used when displaying nodes in this project */
			setStepTerm:function(term){stepTerm = term;},
			/* returns the title of this project */
			getTitle:function(){return title;},
			/* sets the title of this project */
			setTitle:function(t){title = t;},
			/* returns the node with the given id if it exists, null otherwise */
			getNodeById:function(nodeId){return getNodeById(nodeId);},
			/* given a sequence id, empty stack, and location, returns true if any infinite loops
			 * are discovered, returns false otherwise */
			validateNoLoops:function(id, stack, from){return validateNoLoops(id,stack,from);},
			/* Returns the node with the given title if the node exists, returns null otherwise. */
			getNodeByTitle:function(title){return getNodeByTitle(title);},
			/* Returns the node at the given position in the project if it exists, returns null otherwise */
			getNodeByPosition:function(pos){return getNodeByPosition(pos);},
			/* Returns an array containing all node ids of types that are not included in the provided nodeTypesToExclude */
			getNodeIds:function(nodeTypesToExclude){return getNodeIds(nodeTypesToExclude);},
			/* Returns html showing all students work so far */
			getShowAllWorkHtml:function(node,showGrades){return getShowAllWorkHtml(node,showGrades);},
			/* Returns the first renderable node Id for this project */
			getStartNodeId:function(){return getFirstNonSequenceNodeId(rootNode);},
			/* Removes the node of the given id from the project */
			removeNodeById:function(id){removeNodeById(id);},
			/* Removes the node at the given location from the sequence with the given id */
			removeReferenceFromSequence:function(seqId, location){removeReferenceFromSequence(seqId, location);},
			/* Adds the node with the given id to the sequence with the given id at the given location */
			addNodeToSequence:function(nodeId, seqId, location){addNodeToSequence(nodeId,seqId,location);},
			/* Copies the nodes of the given array of node ids and fires the event of the given eventName when complete */
			copyNodes:function(nodeIds, eventName){copyNodes(nodeIds, eventName);},
			/* Returns the absolute position to the first renderable node in the project if one exists, returns undefined otherwise. */
			getStartNodePosition:function(){return getStartNodePosition();},
			/* Returns the first position that the node with the given id exists in. Returns null if no node with id exists. */
			getPositionById:function(id){return getPositionById(id);},
			/* Returns the content base url for this project */
			getContentBase:function(){return contentBaseUrl;},
			/* Returns the filename for this project */
			getProjectFilename:function(){return getProjectFilename();},
			/* Returns the full url for this project's content */
			getUrl:function(){return content.getContentUrl();},
			/* Returns the leaf nodes array of this project */
			getLeafNodes:function(){return allLeafNodes;},
			/* Returns the sequence nodes array of this project */
			getSequenceNodes:function(){return allSequenceNodes;},
			/* Returns the root node for this project */
			getRootNode:function(){return rootNode;},
			/* Returns an array of nodes of the given type that are not a child node to any other node */
			getUnattached:function(type){return getUnattached(type);},
			/* Returns the filename for the content of the node with the given id */
			getNodeFilename:function(nodeId){return getNodeFilename(nodeId);},
			/* Given a base title, returns a unique title in this project*/
			generateUniqueTitle:function(base){return generateUniqueTitle(base);},
			/* Given a base title, returns a unique id in this project*/
			generateUniqueId:function(base){return generateUniqueId(base);},
			/* Generates and returns a unique event for copying nodes and sequences */
			generateUniqueCopyEventName:function(){return generateUniqueCopyEventName();},
			/* Adds the given id to the array of ids for nodes that are copied */
			addCopyId:function(id){addCopyId(id);},
			/* Returns an object representation of this project */
			projectJSON:function(){return projectJSON();},
            /* Given the filename, returns the url to retrieve the file NATE did something here */
            makeUrl:function(filename, node){return makeUrl(filename, node);},
			/* Given the nodeId, returns the prompt for that step */
			getNodePromptByNodeId:function(nodeId){return getNodePromptByNodeId(nodeId);},
			/* Sets the post level for this project */
			setPostLevel:function(level){postLevel = level;},
			/* Returns the post level for this project */
			getPostLevel:function(){return postLevel;},
			/* Returns the first position as seen in the vle that the node with the given id exists in. Returns "" if no node with id exists. */
			getVLEPositionById:function(id){return getVLEPositionById(id);},
			/* Returns an array of any duplicate nodes of the node with the given id. If the node with
			 * the given id is a duplicate itself, returns an array of all duplicates of the node it 
			 * represents  and optionally includes the original when specified */
			getDuplicatesOf:function(id, includeOriginal){return getDuplicatesOf(id, includeOriginal);},
			/* Return the next available review group number */
			getNextReviewGroupNumber:function(){return getNextReviewGroupNumber();},
			/* Removes the review sequence attributes from the steps that are part of the group */
			cancelReviewSequenceGroup:function(reviewGroupNumber){return cancelReviewSequenceGroup(reviewGroupNumber);},
			/* Retrieves the previous and next nodeIds of the given nodeId */
			getPreviousAndNextNodeIds:function(nodeId){return getPreviousAndNextNodeIds(nodeId);},
			/* Returns whether position1 comes before or is equal to position2 */
			positionBeforeOrEqual:function(nodePosition1, nodePosition2){return positionBeforeOrEqual(nodePosition1, nodePosition2);},
			/* Returns whether position1 comes after position2 */
			positionAfter:function(nodePosition1, nodePosition2){return positionAfter(nodePosition1, nodePosition2);},
			/* Retrieve an array containing the node objects of the nodes that are in the review group */
			getNodesInReviewSequenceGroup:function(reviewGroupNumber){return getNodesInReviewSequenceGroup(reviewGroupNumber);},
			/* Return the review sequence phase of the given node id */
			getReviewSequencePhaseByNodeId:function(nodeId){return getReviewSequencePhaseByNodeId(nodeId);},
			/* Returns an array of nodeIds for nodes that are descendents of the given nodeId, if all is
			 * provided, also includes sequence ids that are descendents of the given nodeId */
			getDescendentNodeIds:function(nodeId, all){return getDescendentNodeIds(nodeId,all);},
			/* gets the constraints array */
			getConstraints:function(){return constraints;},
			/* adds a constraint to the constraints array */
			addConstraint:function(constraint){constraints.push(constraint);},
			/* removes the constraint with the given id */
			removeConstraint:function(id){removeConstraint(id);},
			/* returns true if the project has any nodes that can dynamically create constraints, returns false otherwise */
			containsConstraintNodes:function(){return containsConstraintNodes();},
			/* returns true if the project author specified any constraints, returns false otherwise */
			containsProjectConstraints:function(){return constraints.length > 0;},
			/* returns whether we found new feedback after generating the show all work */
			hasNewFeedback:function() {return hasNewFeedback();},
			//get the step number and title for a step
			getStepNumberAndTitle:function(id) {return getStepNumberAndTitle(id);},
			//get all the node ids that have the given tag
			getNodeIdsByTag:function(tagName) {return getNodeIdsByTag(tagName);},
			//get all the node ids that are before the given node id and have the given tag
			getPreviousNodeIdsByTag:function(tagName, nodeId) {return getPreviousNodeIdsByTag(tagName, nodeId);},
			//get all the unique tags in the project
			getAllUniqueTagsInProject:function() {return getAllUniqueTagsInProject();},
			//get all the unique tag maps in the project
			getAllUniqueTagMapsInProject:function() {return getAllUniqueTagMapsInProject();}
		};
	}(content, contentBaseUrl, lazyLoading, view, totalProjectContent);
};

//used to notify scriptloader that this script has finished loading
if(typeof eventManager != 'undefined'){
	eventManager.fire('scriptLoaded', 'vle/project/Project.js');
}