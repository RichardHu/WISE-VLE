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
    teacherResource: null,
    teacherOnline: false,
    
    init: function(viewIn) {
		view=viewIn;
        //console.log("Initializing WISE...")

        WISE.wiseXMPPAuthenticateUrl = view.config.getConfigParam("wiseXMPPAuthenticateUrl") + "&workgroupId=" + view.userAndClassInfo.getWorkgroupId();
        WISE.xmppDomain = view.config.getConfigParam("hostName");
        WISE.groupchatRoomBase = "@conference." + WISE.xmppDomain;
        
        // get runId to use for chatroom
        WISE.groupchatRoom = view.config.getConfigParam("runId") + WISE.groupchatRoomBase;
        
        // create custom event handlers for all WISE 'on' methods
        Sail.autobindEvents(WISE, {
            pre: function() {
        		//console.debug(arguments[0].type+'!',arguments);
        	}
        })

        WISE.authenticate();
        
        return this;
    },
   
    isEventFromTeacher: function(sev) {
    	var sender = sev.from.split('/')[1].split('@')[0];
    	var teacherWorkgroupId = view.getUserAndClassInfo().getTeacherWorkgroupId();
        return sender == teacherWorkgroupId;
    },    
    
    sendStudentToTeacherMessage: function(msg) {
    	if(WISE.teacherOnline) {
    		//only send the message if the teacher is online
            sev = new Sail.Event('studentToTeacherMsg', msg);   
            var teacherWorkgroupId = view.getUserAndClassInfo().getTeacherWorkgroupId();
            var toJID = teacherWorkgroupId + '@' + WISE.xmppDomain + '/' + WISE.teacherResource;
            if (WISE.groupchat) {
            	WISE.groupchat.sendEvent(sev, toJID);    	
            }    		
    	}
    },
    
    disconnect: function() {
    	Sail.Strophe.disconnect();
    },
   
    authenticate: function() {
    	// authenticate with WISE, 
    	// will create an account if necessary
    	// will get back a token for authenticating with XMPP.
        WISE.wiseXMPPAuthenticate = new Sail.WiseXMPPAuthenticate.Client(WISE.wiseXMPPAuthenticateUrl);
        WISE.wiseXMPPAuthenticate.fetchXMPPAuthentication(function(data) {
        	WISE.xmppUsername = data.xmppUsername;
        	WISE.xmppPassword = data.xmppPassword;
            $(WISE).trigger('authenticated');
        });
    },
    
    /**
     * Check if the user is the teacher
     */
    isPresenceFromTeacher: function(who) {
    	var result = false;
    	
		/*
		 * get the user that joined
		 * e.g.
		 * who=639@conference.localhost/27368@localhost/1311631965027
		 * sender=27368
		 */
		var sender = who.split('/')[1].split('@')[0];
		var teacherWorkgroupId = view.getUserAndClassInfo().getTeacherWorkgroupId();
		
		//check if the user that joined is the teacher
		if(sender == teacherWorkgroupId) {
			result = true;
		}
		
		return result;
    },
    
    
    events: {
        // mapping of Sail events to local Javascript events
	
        sail: {
	    	'pause':'pause',
            'unPause':'unPause'
        },

        // local Javascript event handlers
        onAuthenticated: function() {
        	// callback for when user is authenticated with the portal. user's xmpp username/password should be set in WISE.xmppUsername and WISE.xmppPassword.
            Sail.Strophe.bosh_url = 'http://' + WISE.xmppDomain + '/http-bind/';
            var currentTimeInMillis = new Date().getTime();
         	Sail.Strophe.jid = WISE.xmppUsername + '@' + WISE.xmppDomain + "/" + currentTimeInMillis;
          	Sail.Strophe.password = WISE.xmppPassword;  

            Sail.Strophe.onConnectSuccess = function() {
          	    sailHandler = Sail.generateSailEventHandler(WISE);
          	    Sail.Strophe.addHandler(sailHandler, null, null, 'chat');
      	    
          	    WISE.groupchat = new Sail.Strophe.Groupchat(WISE.groupchatRoom);
          	    WISE.groupchat.addHandler(sailHandler);
          	    
          	    //override the function that is called when someone joins the chat room
          	    WISE.groupchat.onParticipantJoin = function(who,pres) {
          	    	if(WISE.isPresenceFromTeacher(who)) {
          				/*
          				 * the user that joined was the teacher so we will remember 
          				 * the teacher's resource so that we can send private messages
          				 * to the teacher
          				 * e.g.
          				 * who=639@conference.localhost/27368@localhost/1311631965027
          				 * teacherResource=1311631965027
          				 */
          	    		WISE.teacherResource = who.split('/')[2];
              	    	WISE.teacherOnline = true;
          	    	}
          	    };
          	    
          	    //override the function that is called when someone leaves the chat room
          	    WISE.groupchat. onParticipantLeave = function(who,pres) {
          	    	if(WISE.isPresenceFromTeacher(who)) {
          	    		//the teacher has left the chat room
	          	    	WISE.teacherResource = null;
          	    		WISE.teacherOnline = false;
          	    		
          	    		/*
          	    		 * unlock the screen just in case the the teacher's browser failed to call unPause
          	    		 * when they left the classroom monitor
          	    		 */
          	    		eventManager.fire('unlockScreenEvent');
          	    	}
          	    };
          	    
          	    WISE.groupchat.join();
          	};
      	    
          	// connect to XMPP server
      	    Sail.Strophe.connect();
        },
        onPause: function(ev,sev) {            
            if(WISE.isEventFromTeacher(sev)) {            
            	eventManager.fire('lockScreenEvent', sev.payload.message);
            }
        },
        onUnPause:function(ev,sev) {
        	if(WISE.isEventFromTeacher(sev)) {
        		eventManager.fire('unlockScreenEvent');
        	}
        }
    }
};

//$(document).ready(WISE.init)

//used to notify scriptloader that this script has finished loading
if(typeof eventManager != 'undefined'){
	eventManager.fire('scriptLoaded', 'vle/xmpp/js/student.js');
}