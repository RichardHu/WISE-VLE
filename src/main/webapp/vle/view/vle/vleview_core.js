﻿/**
 * Dispatches events to the appropriate functions for the vle view.
 */
View.prototype.vleDispatcher = function(type,args,obj){
	if(type=='startVLEFromConfig'){
		obj.startVLEFromConfig(args[0]);
	} else if(type=='startVLEFromParams'){
		obj.startVLEFromParams(args[0]);
	} else if (type=='retrieveLocalesComplete') {
		obj.startVLE();
	} else if(type=='loadingProjectComplete'){
		obj.onProjectLoad();
		obj.setProjectPostLevel();
		obj.displayGlobalTools();
		obj.renderStartNode();
		obj.setDialogEvents();
	} else if(type=='getUserAndClassInfoComplete'){
		obj.renderStartNode();
		// start the xmpp if xmpp is enabled
		if (obj.isXMPPEnabled) {
			obj.startXMPP();
		}
	} else if(type=='processLoadViewStateResponseComplete'){
		obj.getAnnotationsToCheckForNewTeacherAnnotations();
		obj.renderStartNode();
	} else if(type=='navigationLoadingComplete'){
		obj.renderStartNode();
		obj.processStudentWork();
	} else if(type=='renderNode'){
		obj.renderNode(args[0]);
	} else if(type=='renderNodeStart'){
		if(args){
			obj.onRenderNodeStart(args[0]);
		} else {
			obj.onRenderNodeStart(null);
		};
	} else if(type=='renderNodeComplete'){
		if(args){
			obj.onRenderNodeComplete(args[0]);
		} else {
			obj.onRenderNodeComplete(null);
		};
	} else if(type=='resizeNote'){
		obj.utils.resizePanel('notePanel', args[0]);
	} else if(type=='onNotePanelResized'){
		obj.utils.onNotePanelResized(args[0]);
	} else if(type=='setStyleOnElement'){
		obj.utils.setStyleOnElement(args[0],args[1],args[2]);
	} else if(type=='closeDialogs'){
		if(args){
			obj.utils.closeDialogs(args[0]);
		} else {
			obj.utils.closeDialogs();
		};
	} else if(type=='closeDialog'){
		obj.utils.closeDialog(args[0]);
	} else if(type=='postAllUnsavedNodeVisits') {
		obj.postAllUnsavedNodeVisits();
	} else if(type=='pushStudentWork') {
		obj.pushStudentWork(args[0]);
	} else if(type=='getAnnotationsComplete') {
		if(args != null && args.length != 0) {
			if(args[0] == 'displayShowAllWork') {
				obj.displayShowAllWork();
			} else if(args[0] == 'checkForNewTeacherAnnotations') {
				obj.checkForNewTeacherAnnotations();
			}
		}
	} else if(type=='getProjectMetaDataComplete') {
		obj.displayShowAllWork();
		obj.setProjectPostLevel();
	} else if(type=='getRunExtrasComplete') {
		obj.displayShowAllWork();
	} else if(type=='ifrmLoaded'){
		obj.createKeystrokeManagerForFrame();
		obj.onFrameLoaded();
	} else if(type=='saveNote'){
		if(obj.activeNote){
			obj.activeNote.save();
		}
	} else if(type=='saveAndLockNote'){
		
	} else if(type=='noteHandleEditorKeyPress'){
		if(obj.activeNote){
			obj.activeNote.responseEdited();
		}
	} else if(type=='noteShowStarter'){
		if(obj.activeNote){
			obj.activeNote.showStarter();
		}
	} else if(type=='contentRenderComplete') {
		//get the node
		var nodeId = args[0];
		var node = obj.getProject().getNodeById(nodeId);
		
		node.view.eventManager.fire('renderConstraints', node.id, node);
	} else if(type=='renderConstraints'){
		//get the node
		var nodeId = args[0];
		var node = obj.getProject().getNodeById(nodeId);
		
		//tell the node to render any constraints if applicable
		node.renderConstraints();
	} else if(type=='saveAndCloseNote'){
		//save the note
		obj.eventManager.fire('saveNote');
		
		//close the note dialog
		obj.eventManager.fire('closeDialog','notePanel');
		// render previously visited node (so WISE will correctly save data if users interact with previous node before moving on to another step)
		var prevNodeId = obj.state.visitedNodes[obj.state.visitedNodes.length-2].nodeId;
		var prevNode = obj.getProject().getPositionById(prevNodeId);
		obj.eventManager.fire("renderNode", prevNode);
		
	} else if (type=='importWork') {
		//get importFrom and importTo node
		var fromNodeId = args[0];
		var toNodeId = args[1];
		
		obj.importWork(fromNodeId,toNodeId);
	} else if (type == 'startVLEComplete') {
	}
};

/**
 * Starts the VLE with the config object retrieved from the given url
 */
View.prototype.startVLEFromConfig = function(configUrl){
	/* create config by creating content object from given url */
	this.config = this.createConfig(createContent(configUrl));
	
	this.eventManager.fire('loadConfigComplete');

	/* retrieve i18n files, defined in view_i18n.js */
	this.retrieveLocales();
};

/**
 * Creates a config object based on the given object and starts the vle.
 * The given object should consist of name:value pairs that correspond to
 * those of the config obj @see config.js
 */
View.prototype.startVLEFromParams = function(obj){
	/* create the content object from the given obj */
	var contentObj = createContent();
	contentObj.setContent(obj);
	
	/* create the config obj using the content obj */
	this.config = this.createConfig(contentObj);
	
	this.eventManager.fire('loadConfigComplete');

	/* start the vle */
	this.startVLE();
};

/**
 * Uses the config object to start the VLE. Assumes that the config object has been created
 * and set and that the config object contains AT LEAST a content url and content base url.
 */
View.prototype.startVLE = function(){
	/* fire startVLEBegin event */
	this.eventManager.fire('startVLEBegin');

	/* load the project based on new config object parameters, lazy load */
	this.loadProject(this.config.getConfigParam('getContentUrl'), this.config.getConfigParam('getContentBaseUrl'), true);

	this.loadNavMode(this.config.getConfigParam('navMode'));

	/* load theme based on config object parameters */
	this.loadTheme(this.config.getConfigParam('theme'));

	/* check if xmpp is enabled */
	this.checkXMPPEnabled();
	
	/* fire startVLEComplete event */
	this.eventManager.fire('startVLEComplete');
};

/**
 * Loads the Global Tools (top menu items, [idea manager, student file uploader, etc])
 * based on project config and overwritten by run config
 */
View.prototype.displayGlobalTools = function() {	
	var studentAssetsToolbarHtml=	"<li id='studentAssetsTD' style=\"display:none\"><a id=\"studentAssetsLink\" onclick='eventManager.fire(\"viewStudentAssets\")' title=\"View My Files\"><img src=\"images/hint/star.png\" alt=\"Files\" border=\"0\" /><span>&nbsp;"+this.getI18NString("top_toolbar_file_button_text")+"&nbsp;</span></a></li>";                    
	var ideaBasketToolbarHtml = "<li id='ideaBasketTD' style=\"display:none\"><a id=\"ideaBasketLink\" onclick='eventManager.fire(\"displayIdeaBasket\")' title=\"想法籃\"><img src=\"images/ideaManager/basket2.png\" alt=\"Basket\" border=\"0\" /><span>&nbsp;"+this.getI18NString("top_toolbar_ideas_button_text")+"</span><span id='ideaCount'>(0)</span></a></li>";
	var addIdeaToolbarHtml = "<li id='addIdeaTD' style=\"display:none\"><a onclick='eventManager.fire(\"displayAddAnIdeaDialog\")' title=\"新增想法\"><img src=\"images/ideaManager/lightBulbPlus.png\" alt=\"Light Bulb\" border=\"0\" />"+this.getI18NString("top_toolbar_addidea_button_text")+"</a></li>";
	var myWorkToolbarHtml = "<li id='myWorkTD'><a class=\"\" onclick='eventManager.fire(\"showAllWork\")' title=\"檢閱我的作業\"><img src=\"images/reviewAllWork.png\" alt=\"Review My Work\" border=\"0\" />"+this.getI18NString("top_toolbar_mywork_button_text")+"</a></li>";
	var flagToolbarHtml = "<li id='flaggedWorkTD'><a class=\"\" onclick='eventManager.fire(\"showFlaggedWork\")' title=\"顯示標記的作業\"><img src=\"images/reviewAllWork.png\" alt=\"Show Flagged Work\" border=\"0\" />"+this.getI18NString("top_toolbar_flagged_button_text")+"</a></li>";
	var journalToolbarHtml = "<li id='journalTD' style=\"display:none\"><a class=\"\" onclick='eventManager.fire(\"showJournal\")' title=\"Show Student Journal\"><img src=\"images/Journal28x28.png\" alt=\"Show My Journal\" border=\"0\" />&nbsp;"+this.getI18NString("top_toolbar_journal_button_text")+"</a></li>";
	var fullScreenToolbarHtml = "<li id='menuTD'><a class=\"menuSwitcher\" onclick='eventManager.fire(\"toggleNavigationPanelVisibility\")' title=\"選單切換\"><img src=\"images/NavBar-Switch32.png\" alt=\"Full Screen On/Off \" border=\"0\" />"+this.getI18NString("top_toolbar_fullscreen_button_text")+"</a></li>";
	var prevNodeToolbarHtml = "<li><a onclick='eventManager.fire(\"renderPrevNode\")' title=\"上一個步驟\"><img src=\"images/go-previous.png\" alt=\"Previous Arrow\" border=\"0\" /></a></li>";
	var nextNodeToolbarHtml = "<li><a onclick='eventManager.fire(\"renderNextNode\")' title=\"下一個步驟\"><img src=\"images/go-next.png\" alt=\"Next Arrow\" border=\"0\" /></a></li>";
	
	var goHomeHref = "/webapp/student/index.html";
	var userType = this.config.getConfigParam('userType');
	if (userType && userType == "teacher") {
		goHomeHref = "/webapp/teacher/index.html";
	}
	
	var signOutGoHomeToolbarHtml = "<li><a id=\"quitAndLogoutLink\" class=\"tightText\" onclick=\"eventManager.fire('logout')\" target=\"_parent\" title=\"儲存 & 登出\" style=\"margin-right:0;\"><img src=\"images/exit.png\" alt=\"Sign Out\" border=\"0\" />"+this.getI18NString("top_toolbar_signout_button_text")+"</a> | <a id=\"goHomeLink\" class=\"tightText\" href=\""+goHomeHref+"\" target=\"_parent\" title=\"回首頁\">"+this.getI18NString("top_toolbar_gohome_button_text")+"</a></li>";

	$("#projectRightUpperBoxUL").html(studentAssetsToolbarHtml+ideaBasketToolbarHtml+addIdeaToolbarHtml+myWorkToolbarHtml+flagToolbarHtml+journalToolbarHtml+fullScreenToolbarHtml+prevNodeToolbarHtml+nextNodeToolbarHtml+signOutGoHomeToolbarHtml);
	
	/* show/hide studentAssets, ideaManager, addIdea buttons based on project.metadata.tools config */
	if (this.projectMetadata != null && this.projectMetadata.tools != null) {
		this.showToolsBasedOnConfig(this.projectMetadata.tools);
	}

	/* show/hide studentAssets, ideaManager, addIdea buttons based on run.info config */
	var runInfoStr = this.config.getConfigParam('runInfo');
	if (runInfoStr != null && runInfoStr != "") {
		var runInfo = JSON.parse(runInfoStr);
		this.showToolsBasedOnConfig(runInfo);
	}
};

View.prototype.showToolsBasedOnConfig = function(runInfo) {
  	if (runInfo == null) {
        return;
      }

	if (runInfo.isStudentAssetUploaderEnabled != null &&
			runInfo.isStudentAssetUploaderEnabled) {
		$("#studentAssetsTD").show();
	} else if (runInfo.isStudentAssetUploaderEnabled != null &&
			!runInfo.isStudentAssetUploaderEnabled) {
		$("#studentAssetsTD").hide();
	}
	
	if (this.config.getConfigParam('mode') == "portalpreview" || 
			(runInfo.isIdeaManagerEnabled != null && runInfo.isIdeaManagerEnabled)) {
		/*
		 * display the idea basket icons in the top menu if we are
		 * in project preview or the run has idea basket enabled
		 */
		$("#ideaBasketTD").show();
		$("#addIdeaTD").show();
	} else if (runInfo.isIdeaManagerEnabled != null &&
			!runInfo.isIdeaManagerEnabled) {
		$("#ideaBasketTD").hide();
		$("#addIdeaTD").hide();
	}
};
/**
 * Loads the theme given theme in the VLE view. Default is the wise theme.
 */
View.prototype.loadTheme = function(theme){
	/* maps to array name in scriptloader's css array. */
	var cssArrayName = "wise";
	
	if (theme && theme != null) {
		cssArrayName = theme.toLowerCase();
		
		if (theme == "UCCP") {
			/* update the project menu links */
			$("#gotoStudentHomePageLink").attr("href","../../moodle/index.php");
			$("#quitAndLogoutLink").attr("href","../index.php");
			$("#goHomeLink").attr("href","../page/index.php");
			$("#myWorkTD").hide();
			$("#journalTD").hide();
			$("#flaggedWorkTD").hide();
		} else if (theme == "WISE") {
			$("#audioControls").hide();
			
			// set the "Go Home" link according to the logged-in user
			//var userType = this.config.getConfigParam('userType');
			//if (userType && userType == "teacher") {
			//	$("#goHomeLink").attr("href","/webapp/teacher/index.html");
			//} else if (userType && userType == "none") {
			//	$("#goHomeLink").attr("href","/webapp/index.html");
			//}
		}
	}
	
	/* start in WISE theme */
	scriptloader.loadScripts(theme, document, 'theme', this.eventManager);
};

/**
 * Loads the theme given theme in the VLE view. Default is the wise theme.
 */
View.prototype.loadNavMode = function(navMode){
	
	if (navMode && navMode != null) {

		$("#projectLeftBox").css("display","none");		
		$("#projectRightUpperBox").css("marginLeft","0");
		$("#projectRightLowerBox").css("marginLeft", "0");
		$("#menuTD").hide();

		if (navMode == "dropDownTree") {
			$("#projectLeftBox").remove();
		} else if (navMode == "none") {
			$("#projectLeftBox").remove();
		}
	}
};

/**
 * Given a user URL, loads learner data for this view and project
 */
View.prototype.loadLearnerData = function(userUrl){
	if (userUrl && userUrl != null) {
		this.loadUserAndClassInfo(createContent(userUrl));
		
		//set the user name in the vle at the upper left if not in dropdowntree mode
		if (this.config.getConfigParam("navMode") != null &&
				this.config.getConfigParam("navMode") == "dropDownTree") {
			// do nothing
		} else {
			document.getElementById('userNames').innerHTML = this.getUserAndClassInfo().getUserName();
		
			//get the date
			var currentDate = new Date();
			var month = currentDate.getMonth() + 1;
			var day = currentDate.getDate();
			var year = currentDate.getFullYear();

			//set the date in the vle at the upper left in format mm/dd/yyyy
			document.getElementById('dateTime').innerHTML = month + "/" + day + "/" + year;
		}
		
		this.loadVLEState();
	}
};

/**
 * Loads the student's latest work from the last time they worked on it
 * @param dataId the workgroupId
 * @param vle this vle
 */
View.prototype.loadVLEState = function(){
	/* check to see if we need to retrieve all work or if we can get away with an
	 * abbreviated state */
	var getAllWork = false;
	if(this.getProject().containsConstraintNodes() || this.getProject().containsProjectConstraints()){
		getAllWork = true;
	}
	
	if (this.userAndClassInfo && this.userAndClassInfo.getWorkgroupId()) {  
		this.connectionManager.request('GET', 2, this.config.getConfigParam('getStudentDataUrl'), {userId: this.userAndClassInfo.getWorkgroupId(),runId:this.config.getConfigParam('runId'), getAllWork:getAllWork}, this.processLoadViewStateResponse, this);
	} else {
		this.connectionManager.request('GET', 2, this.config.getConfigParam('getStudentDataUrl'), null, this.processLoadViewStateResponse, this);
	}
};


/**
 * Process the response from connection manager's async call to load the state for this view
 */
View.prototype.processLoadViewStateResponse = function(responseText, responseXML, view){
	if (responseText) {
		var viewStateObj = VLE_STATE.prototype.parseDataJSONString(responseText);
		view.setViewState(viewStateObj);
	};

	view.viewStateLoaded = true;
	view.eventManager.fire('processLoadViewStateResponseComplete');
};


/**
 * Set the vle state for this vle. For use mainly in ticker.
 * @param vleState a VLE_STATE object
 */
View.prototype.setViewState = function(viewState) {
	this.state = viewState;
};

/**
 * Sets the values of html elements based on the loaded project's attributes
 * and creates the necessary values for fields for components that have
 * been loaded.
 */
View.prototype.onProjectLoad = function(){
	this.notificationManager.notify('vleInitializerListener', 4);
	
	/* load learner data based on config object parameters */
	if (this.config.getConfigParam('mode') == "run") {
		this.notificationManager.notify('vleConfig.mode is run, getUserInfoUrl:' + this.config.getConfigParam('getUserInfoUrl'), 4);
		this.loadLearnerData(this.config.getConfigParam('getUserInfoUrl'));
	} else if (this.config.getConfigParam('mode') == "portalpreview") {
		//if preview mode, only get the user and class info and not learner data
		this.loadUserAndClassInfo(createContent(this.config.getConfigParam('getUserInfoUrl')));
	}
	
	if(this.config.getConfigParam('mode') == "portalpreview") {
		//we are previewing the project so we will create a dummy idea basket
		this.ideaBasket = new IdeaBasket('{"ideas":[],"deleted":[],"nextIdeaId":1,"id":-1,"runId":-1,"workgroupId":-1,"projectId":-1}');
	}
	
	if (this.config.getConfigParam('navMode') == "dropDownTree") {
		$("#stepInfoBar").css("left","15px");
		$("#projectMenuButton").html('<a onclick="eventManager.fire(\'showNavigationTree\')"><img src=\'images/expanded.gif\'/></a>');
		$("#projectMenuButton").show();
	};
	
	/* set html elements' values */
	if(this.getProject()){
		//display the title of the project in the upper left box
		if(this.getProject().getTitle() != null) {
			$('#title').html(this.getProject().getTitle());
			document.title = this.getProject().getTitle();
			
			if (window.parent) {
				window.parent.document.title = window.parent.document.title + ": " + this.getProject().getTitle();
			}
		}
		
		//display the user name in the upper left box
		if(document.getElementById("logInBox") != null && this.userAndClassInfo) {
			document.getElementById("logInBox").innerHTML = "Hello " + this.userAndClassInfo.getUserName();
		}

		// display ExpandAll/CollapseAll buttons
		var expandAllText = this.getI18NString("navigation_expand_all");
		var collapseAllText =  this.getI18NString("navigation_collapse_all");
		var navigationHtml = "<div id=\"navMenuControls\"><input type=\"button\" value=\""+expandAllText+"\" onclick='eventManager.fire(\"menuExpandAll\")'/><input type=\"button\" value=\""+collapseAllText+"\" onclick='eventManager.fire(\"menuCollapseAll\")'/></div><div id=\"navigationMenuBox\"><div id=\"my_menu\" class=\"sdmenu\"></div></div>";
		
        $("#navigationArea").prepend(navigationHtml);
        
		//display the "Show Me Flagged Items" link if flagging is enabled
		if(this.runManager != null && this.runManager.isFlaggingEnabled) {
			document.getElementById("flagDiv").innerHTML = "<a href='#' id='flagButton' onClick='javascript:vle.displayFlaggedItems();' >Show Me Flagged Items</a>";
		}
		
		/* Set the VLE's current position as the project start position. This will be
		/* overwritten by the state if/when it loads. This ensures that getCurrentPosition
		 * will always return a position. */
		this.currentPosition = this.getProject().getStartNodePosition();
	} else {
		this.notificationManager.notify('VLE and project not ready to load any nodes', 3);
	}
};

/**
 * renderStartNode will render the start node when:
 * 
 * case1: authoring tool preview (stand alone mode)
 * 	 - renders the start node as soon as the project is loaded
 * case2: authoring tool preview (portal mode) || portal preview
 *   - renders the start node when project is loaded and retrieves user and class info
 * case3: student run
 * 	 - renders the start node when project is loaded, user and class info is loaded and retrieves learner data
 * 
 * AND if the navigation component is present will only render when it is also loaded.
 */
View.prototype.renderStartNode = function(){
	/* get the mode from the config */
	var mode = this.config.getConfigParam('mode');
	
	/* check to see if we can render the start node based on the current state of loading */
	if(this.canRenderStartNode(mode) && this.isAnyNavigationLoadingCompleted()){
		var currentNodeVisit = this.state.getCurrentNodeVisit();
		
		/* If we are in run mode, and the user has previously run the project we want to get
		 * the position of the last step they visited, otherwise, just render the first node
		 * in the project. */
		if(mode == 'run' && (typeof this.state != 'undefined') && currentNodeVisit){
			
			/* check to see if the currentNodeVisit has a duplicateId - meaning that
			 * it was last rendered by a DuplicateNode so we would want to render at
			 * the position of the duplicate node instead */
			if(currentNodeVisit.duplicateId){
				var node = this.getProject().getNodeById(currentNodeVisit.duplicateId);
			} else {
				var node = this.getProject().getNodeById(currentNodeVisit.nodeId);
			}
			
			var startPos = this.getProject().getPositionById(node.id);
			
			/*
			 * if we could not find the startPos we will just render
			 * the first step in the project. this can occur when an
			 * author deletes a step during a run in which case the
			 * step the student was last on, no longer exists.
			 */
			if(startPos == null) {
				startPos = this.getProject().getStartNodePosition();
			}
		} else {
			var startPos = this.getProject().getStartNodePosition();
		}
		
		/* render if start position has been set */
		if(startPos){
			/* since this is the first node rendered, we want to set the VLE's current
			 * position to be the same as the startPos so that getStartPosition will always
			 * return a value.*/
			this.currentPosition = startPos;
			
			/* render start node */
			this.eventManager.fire('renderNode',startPos);
		}		
	};
};

/**
 * Given the mode, returns true if the necessary components for that mode
 * are loaded, returns false otherwise.
 * 
 * @param mode
 * @return boolean
 */
View.prototype.canRenderStartNode = function(mode){
	switch (mode){
	case 'run':
		return this.getProject() != null && this.userAndClassInfoLoaded && this.viewStateLoaded;
	case 'portalpreview':
		return this.getProject() != null && this.userAndClassInfoLoaded;
	case 'standaloneauthorpreview':
		return this.getProject() != null;
	case 'developerpreview':
		return this.getProject() != null;
	default:
		throw 'Provided MODE is not supported. Unable to continue.';
	}
};

/**
 * Returns false if the navigation component is present and IS NOT loaded, returns
 * true otherwise.
 */
View.prototype.isAnyNavigationLoadingCompleted = function(){
	if(this.isNavigationComponentPresent && !this.isNavigationComponentLoaded){
		return false;
	}
	
	return true;
};

/**
 * Handles cleanup of previously rendered node.
 */
View.prototype.onRenderNodeStart = function(position){
	/* ensures that only one popup (any notes and journal) is open at any given time */
	this.eventManager.fire('closeDialogs');
	
	/* retrieve previous node */
	var prevNode = this.getProject().getNodeByPosition(position);

	/* tell previous step (if exists) to clean up */ 
	if(prevNode) {
		prevNode.onExit();  
		if(this.state) {
			this.state.endCurrentNodeVisit();  // set endtime, etc.	
		}
	};
	
	// save all unsaved nodes
	this.eventManager.fire('postAllUnsavedNodeVisits');
};

/**
 * Handles setting/adjusting of html elements after a node has rendered
 */
View.prototype.onRenderNodeComplete = function(position){
	this.currentNode = this.getProject().getNodeByPosition(position);
	
	/* Set icon in nav bar */
	if(this.currentNode.getNodeClass() && this.currentNode.getNodeClass()!='null' && this.currentNode.getNodeClass()!=''){
		document.getElementById('stepIcon').innerHTML = '<img src=\'' + this.iconUrl + this.currentNode.getNodeClass() + '28.png\'/>';
	}
	
	/* set title in nav bar */
    if(document.getElementById('topStepTitle') != null) {
    	document.getElementById('topStepTitle').innerHTML = this.currentNode.getTitle();
    }
    
	/* get project completion and send to teacher, if xmpp is enabled */
	if (this.xmpp && this.isXMPPEnabled) {
		var workgroupId = this.userAndClassInfo.getWorkgroupId();
		var projectCompletionPercentage = this.getTeamProjectCompletionPercentage();
		var nodeId = this.currentNode.id;
		var stepNumberAndTitle = this.getProject().getStepNumberAndTitle(nodeId);
		var type = "studentProgress";
		
		if (this.studentStatus == null) {
			this.studentStatus = new StudentStatus();
		}
		
		this.studentStatus.updateMaxAlertLevel();
		this.xmpp.sendStudentToTeacherMessage({workgroupId:workgroupId, 
			projectCompletionPercentage:projectCompletionPercentage, 
			stepNumberAndTitle:stepNumberAndTitle, 
			type:type,
			status:this.studentStatus});	
	}
	
	this.displayHint();

	/* adjust height of iframe. If nav bar is visible, set iframe height=navbarheight. else, leave it untouched */
	//if (parseInt($('#projectLeftBox').attr('offsetHeight')) > 0) {
		//$('#projectRightLowerBox').height($('#projectLeftBox').height());
	//}
    
	/* if centered div is not displayed, display it */
	$('#centeredDiv').css("display", "block");
};

/**
 * Renders the node at the given position in the vle view
 */
View.prototype.renderNode = function(position){
	//get the node
	var node = this.getProject().getNodeByPosition(position);
	
	if(node != null) {
		//get the node id
		var nodeId = node.id;
		
		//remove the bubble and remove the highlight for the step the student is now visiting
		eventManager.fire('removeMenuBubble', [nodeId]);
		eventManager.fire('unhighlightStepInMenu', [nodeId]);
	}
	
	/* check to see if we can render the given position and if we should render it
	 * fully or partly disabled. The return object will contain the status number
	 * and any message related to the status. Status values: 0 = can visit without
	 * restriction, 1 = can visit but step should be disabled, 2 = cannot visit. */
	var status = this.navigationLogic.getVisitableStatus(position);
	
	/* if status value == 1 or 2, we need to display any messages to user, if 2 we also
	 * need to exit here */
	if(status.value != 0){
		//this.notificationManager.notify(status.msg, 3);
		
		//display any navigation logic constraint messages in an alert
		alert(status.msg);
		
		if(status.value==2){
			return;
		}
	}
	
	this.eventManager.fire('renderNodeStart', this.currentPosition);
	this.notificationManager.notify('rendering  node, pos: ' + position,4);
	
    var nodeToVisit = null;
    if (position == null) {
		if (this.state.visitedNodes.length > 0) {
			nodeToVisit = this.state.visitedNodes[this.state.visitedNodes.length - 1];
			this.currentPosition = this.getProject().getPositionById(nodeToVisit.id);
		};
    } else {
        nodeToVisit = this.getProject().getNodeByPosition(position);
        this.currentPosition = position;
    }
	
	if (nodeToVisit == null) {
		this.notificationManager.notify("VLE: nodeToVisit is null Exception. Exiting", 3);
		return;
	}
	
	var studentWork = this.getStudentWorkForNodeId(nodeToVisit.id);
	
	/* set this node as current node visit */
	this.state.setCurrentNodeVisit(nodeToVisit);
	nodeToVisit.render(null, studentWork, status.value);
	this.eventManager.fire('renderNodeComplete', this.currentPosition);
};

/**
 * Returns the node that the user is currently viewing.
 */
View.prototype.getCurrentNode = function(){
	return this.getProject().getNodeByPosition(this.currentPosition);
};

/**
 * Returns the current node position
 */
View.prototype.getCurrentPosition = function(){
	return this.currentPosition;
};

/**
 * Sets the projects post level based on the current state of the vle view
 */
View.prototype.setProjectPostLevel = function(){
	var project = this.getProject();
	if(project && this.config && this.config.getConfigParam('postLevel')){
		project.setPostLevel(this.config.getConfigParam('postLevel'));
	} else if(project && this.projectMetadata && this.projectMetadata.postLevel){
		project.setPostLevel(this.projectMetadata.postLevel);
	}
};

/**
 * Calls the create keystroke manager for the node that just rendered in a frame
 */
View.prototype.createKeystrokeManagerForFrame = function(){
	var node = this.getProject().getNodeById(window.frames['ifrm'].nodeId);
	
	if(node){
		node.createKeystrokeManager();
	}
};

View.prototype.onFrameLoaded = function(){
	var node = this.getProject().getNodeByPosition(this.getCurrentPosition());
	
	//check if this node is a mirror/duplicate node
	if(node.type == 'DuplicateNode') {
		//get the real node this duplicate node points to 
		node = node.realNode;
	}
	
	//set the event manager into the content panel so the html has access to it
	node.contentPanel.eventManager = this.eventManager;
	node.contentPanel.nodeId = node.id;
	node.contentPanel.node = node;
	node.contentPanel.scriptloader = this.scriptloader;
	
	this.eventManager.fire('pageRenderComplete', node.id);
};

/**
 * Imports (copy and paste) work from specified node to specified node
 */
View.prototype.importWork = function(fromNodeId,toNodeId) {
	var fromNode = this.getProject().getNodeById(fromNodeId);
	var toNode = this.getProject().getNodeById(toNodeId);

	toNode.importWork(fromNode);
};

/**
 * Sets default actions for jQuery UI dialog events:
 * 1: Solves dialog drag/resize problems caused by iframes in the vle
 * 2: Ensures that dialogs appear above any embedded applets in node content (not functional yet, so disabling - no effect in Firefox 3.6/Chrome Mac)
 */
View.prototype.setDialogEvents = function() {
	// create iframe shim under dialog when opened
	// Inspired by Dave Willkomm's Shim jQuery plug-in: http://sourceforge.net/projects/jqueryshim/ (copyright 2010, MIT License: http://www.opensource.org/licenses/mit-license.php)
	/*$('.ui-dialog').live("dialogopen", function(event, ui) {
		var element = $(this),
			offset = element.offset(),
			zIndex = element.css('z-index') - 2;
			html = '<iframe class="shim" frameborder="0" style="' +
				'display: block;'+
				'position: absolute;' +
				'top:' + offset.top + 'px;' +
				'left:' + offset.left + 'px;' +
				'width:' + element.outerWidth() + 'px;' +
				'height:' + element.outerHeight() + 'px;' +
				'z-index:' + zIndex + ';' +
				'"/>';
	
		element.before(html);
		
		var applet = $("#ifrm").contents().find("applet");
		applet.after(html);
		
	});
	
	// remove iframe shim under dialog when closed
	$('.ui-dialog').live("dialogclose", function(event, ui) {
		$(this).prev("iframe.shim").remove();
	});*/
	
	// show transparent overlay div under dialog when drag/resize is initiated
	$('.ui-dialog').live("dialogresizestart dialogdragstart", function(event, ui) {
		$('body').append('<div id="vleOverlay></div>');
		var zIndex = $(this).css('z-index') - 1;
		$('#vleOverlay').css('z-index',zIndex);
	});
	
	// adjust iframe shim dimensions and position when dragging/resizing dialog
	/*$('.ui-dialog').live("dialogresize dialogdrag", function(event, ui) {
		
	});*/
	
	// hide transparent overlay div under dialog when drag/resize is initiated
	$('.ui-dialog').live("dialogresizestop dialogdragstop", function(event, ui) {
		$('#vleOverlay').remove();
	});
};

/**
 * Process all the work for each step and perform any
 * special processing if necessary. For example, show a gold
 * star for the steps that the student successfully completed.
 */
View.prototype.processStudentWork = function() {
	//make sure the student work has been loaded
	if(this.viewStateLoaded) {
		//get all the node ids in the project
		var nodeIds = this.getProject().getNodeIds();

		//loop through all the node ids
		for(var x=0; x<nodeIds.length; x++) {
			//get a node id
			var nodeId = nodeIds[x];
			
			//get a node
			var node = this.getProject().getNodeById(nodeId);
			
			//get the latest work for the node
			var latestWork = this.state.getLatestWorkByNodeId(nodeId);
			
			if(latestWork != null && latestWork != "") {
				//tell the node to process the student work
				node.processStudentWork(latestWork);
			}
		}
	}
};

//used to notify scriptloader that this script has finished loading
if(typeof eventManager != 'undefined'){
	eventManager.fire('scriptLoaded', 'vle/view/vle/vleview_core.js');
}