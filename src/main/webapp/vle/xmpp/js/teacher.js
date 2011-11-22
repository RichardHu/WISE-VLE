WISE = {
    // config
	wiseXMPPAuthenticateUrl: '',
    xmppDomain: 'localhost',
    groupchatRoom: '',
    groupchatRoomBase: '@conference.localhost',
    
    // WISE variables
    view:null,
    
    // private global vars
    ui: Sail.UI,
    groupchat: null,
    session: null,
    justWatching: false,
    
    
    // initialization (called in $(document).ready() at the bottom of this file)
    init: function(viewIn) {
		view=viewIn;
        //console.log("Initializing WISE...")

        WISE.wiseXMPPAuthenticateUrl = view.config.getConfigParam("wiseXMPPAuthenticateUrl") + "&workgroupId=" + view.userAndClassInfo.getWorkgroupId();
        WISE.xmppDomain = view.config.getConfigParam("hostName");
        WISE.groupchatRoomBase = "@conference." + WISE.xmppDomain;
        
        // get runId to use for chatroom
        WISE.groupchatRoom = view.config.getConfigParam("runId") + WISE.groupchatRoomBase;
        //console.log("chatroom:" + WISE.groupchatRoom);

        // create custom event handlers for all WISE 'on' methods
        Sail.autobindEvents(WISE, {
            pre: function() {
        		//console.debug(arguments[0].type+'!',arguments);
        	}
        })
        
        $('#pause-button').click(function() {WISE.doPause();  return false})

        $('#unPause-button').click(function() {WISE.doUnPause();  return false})
        
        $('#connecting').show()
        
        WISE.authenticate()
        
        return this;
    },
    
    getJabberId: function(userString) {
    	return userString.split('/')[1].split('@')[0];
    },
    
    isEventFromTeacher: function(sev) {
    	var sender = sev.from.split('/')[1].split('@')[0];
    	var teacherWorkgroupId = view.getUserAndClassInfo().getTeacherWorkgroupId();
        return sender == teacherWorkgroupId;
    },
    
    isEventFromStudent: function(sev) {
    	// todo implement me
    	return true;
    },
       
    doPause: function() {
    	message = $('#pause-message').val();
    	if (message == "") {
    		// if message is empty, populate with default message.
    		$('#pause-message').val("Your teacher has paused your screen.");
    	}
        sev = new Sail.Event('pause', {message:message});
        WISE.groupchat.sendEvent(sev);
    },

    doUnPause: function() {
        sev = new Sail.Event('unPause');
        WISE.groupchat.sendEvent(sev);
    },

    authenticate: function() {
    	/*
    	 * retrieve the xmpp username and password to the ejabberd server
    	 */
    	WISE.wiseXMPPAuthenticate = new Sail.WiseXMPPAuthenticate.Client(WISE.wiseXMPPAuthenticateUrl);
        WISE.wiseXMPPAuthenticate.fetchXMPPAuthentication(function(data) {
        	WISE.xmppUsername = data.xmppUsername;
        	WISE.xmppPassword = data.xmppPassword;
            $(WISE).trigger('authenticated');
        });
    },
        
    disconnect: function() {
    	// make sure that students' screens are unpaused when teacher logs out.
    	this.doUnPause();
    	Sail.Strophe.disconnect();
    },
    
    events: {
        // mapping of Sail events to local Javascript events
	
        sail: {
	    	'pause':'pause',
            'unPause':'unPause',
            'studentToTeacherMsg':'studentToTeacherMsg',
            'joinedGroupChat':'joinedGroupChat'
        },

        // local Javascript event handlers
        onAuthenticated: function() {
            Sail.Strophe.bosh_url = 'http://' + WISE.xmppDomain + '/http-bind/';
            var currentTimeInMillis = new Date().getTime();
         	Sail.Strophe.jid = WISE.xmppUsername + '@' + WISE.xmppDomain + "/" + currentTimeInMillis;
            Sail.Strophe.password = WISE.xmppPassword;
            
            Sail.Strophe.onConnectSuccess = function() {
          	    sailHandler = Sail.generateSailEventHandler(WISE);
          	    Sail.Strophe.addHandler(sailHandler, null, null, 'groupchat');
          	    Sail.Strophe.addHandler(sailHandler, null, null, 'chat');
      	    
          	    var joinedGroupChatSuccess = function() {
          	    	$(WISE).trigger('joinedGroupChat');
          	    }
          	    WISE.groupchat = new Sail.Strophe.Groupchat(WISE.groupchatRoom);
          	    WISE.groupchat.onParticipantJoin = function(who,pres) {
          	    	var newParticipantWorkgroupId = WISE.getJabberId(who);
          	    	$("#classroomMonitorWorkgroupRow_"+newParticipantWorkgroupId).css("background-color","white");
          	    };
          	    WISE.groupchat.onParticipantLeave = function(who,pres) {
          	    	var oldParticipantWorkgroupId = WISE.getJabberId(who);
          	    	$("#classroomMonitorWorkgroupRow_"+oldParticipantWorkgroupId).css("background-color","lightgrey");
          	    };
          	    WISE.groupchat.onSelfJoin = function(pres) {
                	//console.log('onSelfJoinedGroupChat');
                	eventManager.fire('classroomMonitorDisplayComplete');
              	    $('#connecting').hide();
          	    };
          	    WISE.groupchat.join();       	    
          	};
      	    
      	    Sail.Strophe.connect();
        },
        onPause: function(ev,sev) {            
            if(WISE.isEventFromTeacher(sev)) {            
            	$("#studentScreenStatus").html("paused");
            	$("#studentScreenStatus").css("color","red");
            }
        },
        onUnPause:function(ev,sev) {
        	if(WISE.isEventFromTeacher(sev)) {
        		$("#studentScreenStatus").html("unpaused");
            	$("#studentScreenStatus").css("color","green");
        	}
        },
        onStudentToTeacherMsg:function(ev,sev) {
        	if(WISE.isEventFromStudent(sev)) {
        		var message = sev.payload;
        		
        		var workgroupId = message.workgroupId;
        		var messageType = message.type;
        		
        		if(messageType == "studentProgress") {
        			var stepNumberAndTitle = message.stepNumberAndTitle;
        			var projectCompletionPercentage = message.projectCompletionPercentage;
        			$('#teamCurrentStep_' + workgroupId).html(stepNumberAndTitle);
        			$('#teamPercentProjectCompleted_' + workgroupId).html(projectCompletionPercentage + "%" + "<hr size=3 color='black' width='" + projectCompletionPercentage + "%' align='left' noshade>");
        			$("#chooseTeamToGradeTable").trigger('update');  // tell tablesorter to re-read the data
        			var status = message.status;
        			if (status != null) {
        				//$('#teamStatus_' + workgroupId).html(status.type);
        				
        				
        				if(status.maxAlertLevel >= 0 && status.maxAlertLevel < 2) {
        					$('#teamStatus_' + workgroupId).html("<img src='/vlewrapper/vle/images/check16.gif' />");
        				} else if(status.maxAlertLevel >= 2 && status.maxAlertLevel < 4) { 
        					$('#teamStatus_' + workgroupId).html("warning");
        				} else if(status.maxAlertLevel >= 4) {
        					$('#teamStatus_' + workgroupId).html("<img src='/vlewrapper/vle/images/warn16.gif' />");
        				}
        				
    					$('#teamStatus_' + workgroupId).unbind('click');
    					$('#teamStatus_' + workgroupId).click(function() {
        					var readableMsg = "";
        					for (var i=0; i<status.alertables.length; i++) {
        						var alertable = status.alertables[i];
        						if (alertable != null && alertable.readableText != null) {
        							readableMsg += alertable.stepNumberAndTitle + " (" + alertable.nodeType + ")<br>";
        							readableMsg += alertable.readableText + "<br><br>";
        						}
        					}
    						//alert(readableMsg);
        					$('#teamStatusDialog').html(readableMsg);
        					$('#teamStatusDialog').dialog('open');
    					});
        			}
        		}
        	}
        }        
    }
};

//used to notify scriptloader that this script has finished loading
if(typeof eventManager != 'undefined'){
	eventManager.fire('scriptLoaded', 'vle/xmpp/js/teacher.js');
};