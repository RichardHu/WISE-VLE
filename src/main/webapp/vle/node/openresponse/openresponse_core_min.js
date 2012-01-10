﻿OpenResponseNode.prototype=new Node;OpenResponseNode.prototype.constructor=OpenResponseNode;OpenResponseNode.prototype.parent=Node.prototype;OpenResponseNode.authoringToolName="Open Response";OpenResponseNode.authoringToolDescription="Students write text to answer a question or explain their thoughts";function OpenResponseNode(a,b){this.view=b;this.type=a;this.prevWorkNodeIds=[];this.exportableToNodes=["NoteNode","OpenResponseNode","SVGDrawNode"];this.importableFileExtensions=["jpg","png"]}
OpenResponseNode.prototype.parseDataJSONObj=function(a){return OPENRESPONSESTATE.prototype.parseDataJSONObj(a)};OpenResponseNode.prototype.translateStudentWork=function(a){return a};OpenResponseNode.prototype.getPeerReviewPrompt=function(){if(this.or==null)this.or=new OPENRESPONSE(this);return this.or.getPeerReviewPrompt()};OpenResponseNode.prototype.getPeerReviewOtherStudentWork=function(a){if(this.or==null)this.or=new OPENRESPONSE(this);return this.or.getPeerReviewOtherStudentWork(a)};
OpenResponseNode.prototype.canExportWork=function(a){return this.exportableToNodes&&this.exportableToNodes.indexOf(a.type)>-1};
OpenResponseNode.prototype.exportWork=function(a){if(this.canExportWork(a)){var b=this.view.state.getNodeVisitsByNodeId(this.id);if(b.length>0){for(var c=[],d=0;d<b.length;d++)for(var f=b[d],e=0;e<f.nodeStates.length;e++)c.push(f.nodeStates[e]);b=c[c.length-1].getStudentWork();return a.type=="SVGDrawNode"?'<text x="250" y="150" font-family="Verdana" font-size="35" fill="black" >'+b+"</text>":b}}return null};
OpenResponseNode.prototype.importWork=function(a){a=a.exportWork(this);a!=null&&this.contentPanel&&this.contentPanel.or&&this.contentPanel.or.appendResponse(a)};OpenResponseNode.prototype.canImportFile=function(a){return this.contentPanel.or.content.isRichTextEditorAllowed&&a.indexOf(".")!=-1&&this.importableFileExtensions.indexOf(a.substr(a.lastIndexOf(".")+1).toLowerCase())!=-1?!0:!1};
OpenResponseNode.prototype.importFile=function(a){return this.canImportFile(a)?(this.contentPanel.or.appendResponse("<img src='"+a+"'></img>"),!0):!1};OpenResponseNode.prototype.onExit=function(){this.contentPanel&&this.contentPanel.save&&this.contentPanel.save()};OpenResponseNode.prototype.getHTMLContentTemplate=function(){return createContent("node/openresponse/openresponse.html")};NodeFactory.addNode("OpenResponseNode",OpenResponseNode);
typeof eventManager!="undefined"&&eventManager.fire("scriptLoaded","vle/node/openresponse/OpenResponseNode.js");NoteNode.prototype=new OpenResponseNode;NoteNode.prototype.constructor=NoteNode;NoteNode.prototype.parent=OpenResponseNode.prototype;NoteNode.authoringToolName="反思筆記";NoteNode.authoringToolDescription="Students write text to answer a question or explain their thoughts";function NoteNode(a,b){this.view=b;this.type=a;this.prevWorkNodeIds=[];this.exportableToNodes=["NoteNode","OpenResponseNode","SVGDrawNode"]}
NoteNode.prototype.render=function(a,b){this.studentWork=b;if(!this.baseHtmlContent)this.baseHtmlContent=this.view.getHTMLContentTemplate(this);$("#notePanel").html(this.injectBaseRef(this.injectKeystrokeManagerScript(this.view.injectVleUrl(this.baseHtmlContent.getContentString()))));this.view.activeNote=new OPENRESPONSE(this,this.view);this.view.activeNote.content.isRichTextEditorAllowed=!1;this.view.activeNote.render();$("#notePanel").dialog("open");$(".ui-draggable").draggable("option","iframeFix",
!0);$(".ui-draggable").resizable("option","ghost",!0)};NoteNode.prototype.onExit=function(){this.view.activeNote&&this.view.activeNote.save()};NoteNode.prototype.canExportWork=function(a){return this.exportableToNodes&&this.exportableToNodes.indexOf(a.type)>-1};
NoteNode.prototype.exportWork=function(a){if(this.canExportWork(a)){var b=this.view.state.getNodeVisitsByNodeId(this.id);if(b.length>0){for(var c=[],d=0;d<b.length;d++)for(var f=b[d],e=0;e<f.nodeStates.length;e++)c.push(f.nodeStates[e]);b=c[c.length-1].getStudentWork();return a.type=="SVGDrawNode"?'<text x="250" y="150" font-family="Verdana" font-size="35" fill="black" >'+b+"</text>":b}}return null};
NoteNode.prototype.importWork=function(a){a=a.exportWork(this);a!=null&&this.view&&this.view.activeNote&&this.view.activeNote.appendResponse(a)};NoteNode.prototype.getHTMLContentTemplate=function(){return createContent("node/openresponse/note.html")};NodeFactory.addNode("NoteNode",NoteNode);typeof eventManager!="undefined"&&eventManager.fire("scriptLoaded","vle/node/openresponse/NoteNode.js");View.prototype.openResponseDispatcher=function(a,b,c){a=="openResponsePromptChanged"?c.OpenResponseNode.updatePrompt():a=="openResponseStarterOptionChanged"?c.OpenResponseNode.starterChanged():a=="openResponseStarterSentenceUpdated"?c.OpenResponseNode.starterUpdated():a=="openResponseUpdateRichText"?c.OpenResponseNode.updateRichText():a=="openResponseLinesChanged"?c.OpenResponseNode.linesUpdated():a=="openResponsePeerReviewAuthoredWorkUpdated"?c.OpenResponseNode.peerReviewAuthoredWorkUpdated():a==
"openResponsePeerReviewPercentageTriggerUpdated"?c.OpenResponseNode.peerReviewPercentageTriggerUpdated():a=="openResponsePeerReviewNumberTriggerUpdated"?c.OpenResponseNode.peerReviewNumberTriggerUpdated():a=="openResponsePeerReviewAuthoredReviewUpdated"?c.OpenResponseNode.peerReviewAuthoredReviewUpdated():a=="openResponsePeerReviewStepNotOpenCustomMessageUpdated"&&c.OpenResponseNode.peerReviewStepNotOpenCustomMessageUpdated()};
for(var events=["openResponsePromptChanged","openResponseStarterOptionChanged","openResponseStarterSentenceUpdated","openResponseUpdateRichText","openResponseLinesChanged","openResponsePeerReviewAuthoredWorkUpdated","openResponsePeerReviewPercentageTriggerUpdated","openResponsePeerReviewNumberTriggerUpdated","openResponsePeerReviewAuthoredReviewUpdated","openResponsePeerReviewStepNotOpenCustomMessageUpdated"],x=0;x<events.length;x++)componentloader.addEvent(events[x],"openResponseDispatcher");
typeof eventManager!="undefined"&&eventManager.fire("scriptLoaded","vle/node/openresponse/openResponseEvents.js");function OPENRESPONSESTATE(a,b,c,d){this.type="or";this.response=a;this.timestamp=b?b:Date.parse(new Date);this.locked=c;this.submitPeerReview=d}OPENRESPONSESTATE.prototype.print=function(){};OPENRESPONSESTATE.prototype.getHtml=function(){return"timestamp: "+this.timestamp+"<br/>response: "+this.response};OPENRESPONSESTATE.prototype.parseDataJSONObj=function(a){return new OPENRESPONSESTATE(a.response,a.timestamp,a.locked,a.submitPeerReview)};
OPENRESPONSESTATE.prototype.getStudentWork=function(){var a=this.response;this.response!=null&&this.response.constructor.toString().indexOf("Array")!=-1&&(a=this.response.toString());return a};OPENRESPONSESTATE.prototype.isLocked=function(){return this.locked};typeof eventManager!="undefined"&&eventManager.fire("scriptLoaded","vle/node/openresponse/openresponsestate.js");function OPENRESPONSE(a,b){this.node=a;this.view=b;this.content=a.getContent().getContentJSON();this.states=a.studentWork!=null?a.studentWork:[];if(this.node.associatedStartNode!=null&&(this.associatedStartNodeId=this.node.associatedStartNode,this.associatedStartNode=this.view.getProject().getNodeById(this.associatedStartNodeId),this.associatedStartNode!=null))this.associatedStartNodeContent=this.associatedStartNode.getContent().getContentJSON();if(this.node.associatedAnnotateNode!=null&&(this.associatedAnnotateNodeId=
this.node.associatedAnnotateNode,this.associatedAnnotateNode=this.view.getProject().getNodeById(this.associatedAnnotateNodeId),this.associatedAnnotateNode!=null))this.associatedAnnotateNodeContent=this.associatedAnnotateNode.getContent().getContentJSON();if(this.node.peerReview!=null&&(this.otherStudentNodeVisit=this.otherStudentStepWorkId=this.otherStudentWorkgroupId=null,this.showAuthorContent=!1,this.annotation=null,this.node.peerReview=="annotate"))this.openPercentageTrigger=this.content.openPercentageTrigger,
this.openNumberTrigger=this.content.openNumberTrigger,this.openLogicTrigger=this.content.openLogicTrigger;if(this.node.peerReview!=null||this.node.teacherReview!=null)this.node.setIsPartOfReviewSequence(),this.stepNotOpenCustomMessage=this.content.stepNotOpenCustomMessage;if(this.view!=null&&this.view.isLatestNodeStateLocked&&this.view.isLatestNodeStateLocked(this.node.id))this.locked=!0,this.node.setCompleted();eventManager.subscribe("getAnnotationsComplete",this.getAnnotationsComplete,this)}
OPENRESPONSE.prototype.isLocked=function(){for(var a=0;a<this.states.length;a++)if(this.states[a].locked)return!0;return!1};OPENRESPONSE.prototype.getResponse=function(){var a=null;return a=this.richTextEditor?this.richTextEditor.getContent():document.getElementById("responseBox").value};
OPENRESPONSE.prototype.save=function(a){if(this.isSaveAvailable()||this.isSaveAndLockAvailable()){var b="",b=this.getResponse();if(this.isResponseChanged()||a){var c=new OPENRESPONSESTATE([b]);if(a&&confirm("You will not be able to make further edits after submitting this response.  Ready to submit?")){if(this.node.peerReview!=null&&this.node.peerReview=="start")c.submitForPeerReview=!0;c.locked=!0;this.lockResponseBox();this.setSaveAndLockUnavailable();this.locked=!0;this.node.setCompleted();this.node.peerReview!=
null&&this.node.peerReview=="annotate"&&!this.showAuthorContent&&this.postAnnotation(b)}(this.node.peerReview=="revise"||this.node.teacherReview=="revise")&&this.node.setCompleted();eventManager.fire("pushStudentWork",c);this.states.push(c)}this.setSaveUnavailable()}};
OPENRESPONSE.prototype.postAnnotation=function(a){var b=this.view.getConfig().getConfigParam("runId"),c=this.otherStudentNodeVisit.nodeId,d=this.otherStudentWorkgroupId,f=this.view.getUserAndClassInfo().getWorkgroupId(),e=this.otherStudentStepWorkId,g=this.view.getUserAndClassInfo().getPeriodId(),h=this.view.getConfig().getConfigParam("postAnnotationsUrl"),g={runId:b,nodeId:c,toWorkgroup:d,fromWorkgroup:f,annotationType:"comment",value:encodeURIComponent(a),stepWorkId:e,action:"peerReviewAnnotate",
periodId:g};if(this.view.annotations==null)this.view.annotations=new Annotations;this.view.annotations.updateOrAddAnnotation(new Annotation(b,c,d,f,"comment",a,e));this.view.connectionManager.request("POST",1,h,g,function(){})};OPENRESPONSE.prototype.saveAndLock=function(){this.save(!0)};OPENRESPONSE.prototype.responseEdited=function(){this.setSaveAvailable();displayNumberAttempts("This is your","revision",this.states)};OPENRESPONSE.prototype.setSaveAvailable=function(){$("#saveButton").parent().removeClass("ui-state-disabled")};
OPENRESPONSE.prototype.setSaveUnavailable=function(){$("#saveButton").parent().addClass("ui-state-disabled")};OPENRESPONSE.prototype.isSaveAvailable=function(){return!$("#saveButton").parent().hasClass("ui-state-disabled")};OPENRESPONSE.prototype.setSaveAndLockAvailable=function(){$("#saveAndLockButton").parent().removeClass("ui-state-disabled")};OPENRESPONSE.prototype.setSaveAndLockUnavailable=function(){$("#saveAndLockButton").parent().addClass("ui-state-disabled")};
OPENRESPONSE.prototype.isSaveAndLockAvailable=function(){return!$("#saveAndLockButton").parent().hasClass("ui-state-disabled")};OPENRESPONSE.prototype.isResponseChanged=function(){var a=this.states[this.states.length-1],b="";if(a!=null)b=a.response;a=this.getResponse();return b!=a?!0:!1};
OPENRESPONSE.prototype.hideAll=function(){document.getElementById("promptDisplayDiv").style.display="none";document.getElementById("originalPromptDisplayDiv").style.display="none";document.getElementById("associatedWorkDisplayDiv").style.display="none";document.getElementById("annotationDisplayDiv").style.display="none";document.getElementById("starterParent").style.display="none";document.getElementById("responseDisplayDiv").style.display="none";document.getElementById("buttonDiv").style.display=
"none"};OPENRESPONSE.prototype.onlyDisplayMessage=function(a){this.node.setStepClosed();this.hideAll();document.getElementById("promptDisplayDiv").style.display="block";document.getElementById("promptLabelDiv").innerHTML="";document.getElementById("orPromptDiv").innerHTML=a};
OPENRESPONSE.prototype.render=function(){if((this.node.peerReview=="annotate"||this.node.teacherReview=="annotate")&&this.locked)this.setSaveUnavailable(),this.setSaveAndLockUnavailable(),this.onlyDisplayMessage("<p>You have successfully reviewed the work submitted by <i>Team Anonymous</i>.</p><p>Well done!</p>");else{if(this.node.peerReview!=null||this.node.teacherReview!=null)if(this.node.peerReview=="start"||this.node.peerReview=="annotate"||this.node.teacherReview=="start"||this.node.teacherReview==
"annotate")document.getElementById("saveAndLockButtonDiv").style.display="block";if(this.view!=null&&this.view.activeNode!=null){if(this.displayRegular(),this.node.peerReview!=null||this.node.teacherReview!=null){if(this.node.peerReview=="start"||this.node.peerReview=="annotate"||this.node.teacherReview=="start"||this.node.teacherReview=="annotate")document.getElementById("saveAndLockButtonDiv").style.display="block";if(this.node.peerReview=="annotate"||this.node.teacherReview=="annotate")document.getElementById("promptLabelDiv").innerHTML=
"instructions",document.getElementById("responseLabelDiv").innerHTML="your feedback for <i>Team Anonymous</i>:",document.getElementById("originalPromptTextDiv").innerHTML="[Prompt from the first peer review step will display here]",document.getElementById("originalPromptDisplayDiv").style.display="block",document.getElementById("associatedWorkLabelDiv").innerHTML="work submitted by <i>Team Anonymous</i>:",document.getElementById("associatedWorkTextDiv").innerHTML="[Work from a random classmate will display here]",
document.getElementById("associatedWorkDisplayDiv").style.display="block";else if(this.node.peerReview=="revise"||this.node.teacherReview=="revise")document.getElementById("promptLabelDiv").innerHTML="instructions",document.getElementById("responseLabelDiv").innerHTML="your second draft:",document.getElementById("originalPromptTextDiv").innerHTML="[Prompt from the first peer review step will display here]",document.getElementById("originalPromptDisplayDiv").style.display="block",document.getElementById("associatedWorkLabelDiv").innerHTML=
'your original response&nbsp;&nbsp;&nbsp;<a id="toggleSwitch" onclick="toggleDetails2()">show/hide text',document.getElementById("associatedWorkTextDiv").innerHTML="[Student's work from first peer review step will display here]",document.getElementById("associatedWorkDisplayDiv").style.display="block",document.getElementById("associatedWorkTextDiv").style.display="none",document.getElementById("associatedWorkTextDiv2").style.display="block",document.getElementById("annotationLabelDiv").innerHTML=
"<i>Team Anonymous</i> has given you the following feedback:",document.getElementById("annotationTextDiv").innerHTML="[Feedback from classmate or teacher will display here]",document.getElementById("annotationDisplayDiv").style.display="block"}}else this.associatedStartNode!=null?this.node.peerReview!=null?this.node.peerReview=="annotate"?this.view.getConfig().getConfigParam("mode")=="run"&&this.retrieveOtherStudentWork():this.node.peerReview=="revise"&&this.view.getConfig().getConfigParam("mode")==
"run"&&this.retrieveAnnotationAndWork():this.node.teacherReview!=null&&(this.node.teacherReview=="annotate"?this.displayTeacherWork():this.node.teacherReview=="revise"&&this.view.getConfig().getConfigParam("mode")=="run"&&this.retrieveTeacherReview()):this.displayRegular();this.locked?(this.lockResponseBox(),this.setSaveAndLockUnavailable()):this.setSaveAndLockAvailable()}};
OPENRESPONSE.prototype.displayRegular=function(){this.showDefaultDivs();this.showDefaultValues();this.setResponse();if(this.content.isRichTextEditorAllowed){var a=window.location.toString(),a=a.substring(0,a.indexOf("/vle/"))+"/vle/";this.richTextEditor=new tinymce.Editor("responseBox",{theme:"advanced",plugins:"safari,emotions",theme_advanced_buttons1:"bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,bullist,numlist,|,emotions,|,forecolor,backcolor,|,formatselect,fontselect,fontsizeselect",
theme_advanced_buttons2:"",theme_advanced_buttons3:"",relative_urls:!1,remove_script_host:!0,document_base_url:a,theme_advanced_toolbar_location:"top",theme_advanced_toolbar_align:"left"});this.richTextEditor.onKeyPress.add(this.responseEdited,this);this.richTextEditor.render()}this.doneRendering()};
OPENRESPONSE.prototype.displayTeacherWork=function(){if(this.view.isLatestNodeStateLocked(this.associatedStartNode.id)){var a=this.content.authoredWork,a=this.replaceSlashNWithBR(a);this.showDefaultDivs();this.showDefaultValues();document.getElementById("promptLabelDiv").innerHTML="instructions";document.getElementById("responseLabelDiv").innerHTML="your feedback for <i>Team Anonymous</i>:";document.getElementById("originalPromptTextDiv").innerHTML=this.associatedStartNode.getPeerReviewPrompt();document.getElementById("originalPromptDisplayDiv").style.display=
"block";document.getElementById("associatedWorkLabelDiv").innerHTML="work submitted by <i>Team Anonymous</i>:";document.getElementById("associatedWorkTextDiv").innerHTML=a;document.getElementById("associatedWorkDisplayDiv").style.display="block";this.setResponse()}else this.onlyDisplayMessage("<p>To start this step you must first submit a response in step <b><a style=\"color:blue\" onclick=\"eventManager.fire('renderNode', ['"+this.view.getProject().getPositionById(this.associatedStartNode.id)+"']) \">"+
this.view.getProject().getStepNumberAndTitle(this.associatedStartNode.id)+"</a></b> (link).</p>");this.doneRendering()};OPENRESPONSE.prototype.getAnnotationsComplete=function(a,b,c){b[0]==c.node.id&&c.displayTeacherReview()};
OPENRESPONSE.prototype.displayTeacherReview=function(){var a=this.view.isLatestNodeStateLocked(this.associatedStartNode.id),b=this.view.isLatestNodeStateLocked(this.associatedAnnotateNode.id),c="";thisOr.associatedStartNode!=null&&(c=thisOr.view.getProject().getStepNumberAndTitle(thisOr.associatedStartNode.id));var d="";thisOr.associatedAnnotateNode!=null&&(d=thisOr.view.getProject().getStepNumberAndTitle(thisOr.associatedAnnotateNode.id));if(a)if(b){a="";if(this.view.annotations!=null)if(a=this.view.annotations.getLatestAnnotation(this.view.getConfig().getConfigParam("runId"),
this.associatedStartNode.id,this.view.getUserAndClassInfo().getWorkgroupId(),this.view.getUserAndClassInfo().getAllTeacherWorkgroupIds(),"comment"),a==null){this.onlyDisplayMessage('<p>Your teacher has not yet reviewed the response you submitted in step <b>"'+c+'"</b> yet.</p><p>Please return to this step again later.</p>');this.doneRendering();return}else a=this.replaceSlashNWithBR(a.value);c=this.view.getLatestStateForNode(this.associatedStartNode.id).response;b=this.replaceSlashNWithBR(c);this.showDefaultDivs();
this.showDefaultValues();document.getElementById("promptLabelDiv").innerHTML="instructions";document.getElementById("responseLabelDiv").innerHTML="your second draft:";document.getElementById("originalPromptTextDiv").innerHTML=this.associatedStartNodeContent.assessmentItem.interaction.prompt;document.getElementById("originalPromptDisplayDiv").style.display="block";document.getElementById("associatedWorkLabelDiv").innerHTML='your first response to the question&nbsp;&nbsp;<a id="toggleSwitch" onclick="toggleDetails2()">show/hide text';
document.getElementById("associatedWorkTextDiv").innerHTML=b;document.getElementById("associatedWorkDisplayDiv").style.display="block";document.getElementById("associatedWorkTextDiv").style.display="none";document.getElementById("associatedWorkTextDiv2").style.display="block";document.getElementById("annotationLabelDiv").innerHTML="teacher feedback";document.getElementById("annotationTextDiv").innerHTML=a;document.getElementById("annotationDisplayDiv").style.display="block";if(this.states!=null&&
this.states.length>0)document.getElementById("responseBox").value=this.states[this.states.length-1].response,this.setSaveUnavailable(),displayNumberAttempts("This is your","revision",this.states),this.node.setCompleted();else if(document.getElementById("numberAttemptsDiv").innerHTML="This is your first revision.",c!=null&&c!="")document.getElementById("responseBox").value=c}else this.onlyDisplayMessage("<p>To start this step you must first submit a response in step <a style=\"color:blue\" onclick=\"eventManager.fire('renderNode', ['"+
this.view.getProject().getPositionById(this.associatedAnnotateNode.id)+"']) \">"+d+"</a></b> (link).</p>");else this.onlyDisplayMessage("<p>To start this step you must first submit a response in step <b><a style=\"color:blue\" onclick=\"eventManager.fire('renderNode', ['"+this.view.getProject().getPositionById(this.associatedStartNode.id)+"']) \">"+c+"</a></b> (link).</p>");this.doneRendering()};
OPENRESPONSE.prototype.retrieveTeacherReview=function(){this.view.annotations==null?this.view.getAnnotations(this.node.id):this.displayTeacherReview()};
OPENRESPONSE.prototype.retrieveOtherStudentWork=function(){var a=this.view.getConfig().getConfigParam("getPeerReviewUrl"),b=this.view.getConfig().getConfigParam("runId"),c=this.view.getUserAndClassInfo().getWorkgroupId(),d=this.view.getUserAndClassInfo().getPeriodId(),f=this.associatedStartNodeId,e=this.openPercentageTrigger,g=this.openNumberTrigger,h=this.openLogicTrigger,i=this.view.getUserAndClassInfo().getWorkgroupIdsInClass().toString();this.view.connectionManager.request("GET",1,a,{action:"studentRequest",
runId:b,workgroupId:c,periodId:d,nodeId:f,openPercentageTrigger:e,openNumberTrigger:g,openLogicTrigger:h,peerReviewAction:"annotate",classmateWorkgroupIds:i},this.retrieveOtherStudentWorkCallback,[this])};
OPENRESPONSE.prototype.retrieveOtherStudentWorkCallback=function(a,b,c){b=c[0];b.otherStudentNodeVisit=null;if(a!=null&&a!=""){a=$.parseJSON(a);c=c="";b.associatedStartNode!=null&&(c=b.view.getProject().getStepNumberAndTitle(b.associatedStartNode.id));if(a.error){if(a.error=="peerReviewUserHasNotSubmittedOwnWork")b.onlyDisplayMessage("<p>To start this step you must first submit a response in step <b><a style=\"color:blue\" onclick=\"eventManager.fire('renderNode', ['"+b.view.getProject().getPositionById(b.associatedStartNode.id)+
"']) \">"+c+"</a></b> (link).</p>");else if(a.error=="peerReviewNotAbleToAssignWork"||a.error=="peerReviewNotOpen")if(b.stepNotOpenCustomMessage!=null&&b.stepNotOpenCustomMessage!="")b.onlyDisplayMessage(b.stepNotOpenCustomMessage.replace(/associatedStartNode.title/g,c));else b.onlyDisplayMessage('<p>This step is not available yet.</p></p><p>More of your peers need to submit a response for step <b>"'+c+'"</b>. <br/>You will then be assigned a response to review.</p><p>Please return to this step again in a few minutes.</p>');
if(a.error=="peerReviewShowAuthoredWork")c=b.content.authoredWork,b.showAuthorContent=!0;else return}else b.otherStudentWorkgroupId=a.workgroupId,b.otherStudentStepWorkId=a.stepWorkId,b.otherStudentNodeVisit=a.nodeVisit,c=b.associatedStartNode.getPeerReviewOtherStudentWork(b.otherStudentNodeVisit);c=b.replaceSlashNWithBR(c);b.showDefaultDivs();b.showDefaultValues();document.getElementById("promptLabelDiv").innerHTML="instructions";document.getElementById("responseLabelDiv").innerHTML="your feedback for <i>Team Anonymous</i>:";
document.getElementById("originalPromptTextDiv").innerHTML=b.associatedStartNode.getPeerReviewPrompt();document.getElementById("originalPromptDisplayDiv").style.display="block";document.getElementById("associatedWorkLabelDiv").innerHTML="work submitted by <i>Team Anonymous</i>:";document.getElementById("associatedWorkTextDiv").innerHTML=c;document.getElementById("associatedWorkDisplayDiv").style.display="block";b.setResponse()}b.doneRendering()};
OPENRESPONSE.prototype.retrieveAnnotationAndWork=function(){var a=this.view.getConfig().getConfigParam("getPeerReviewUrl"),b=this.view.getConfig().getConfigParam("runId"),c=this.view.getUserAndClassInfo().getWorkgroupId(),d=this.view.getUserAndClassInfo().getPeriodId(),f=this.associatedStartNodeId,e=this.view.getUserAndClassInfo().getWorkgroupIdsInClass().toString();this.view.connectionManager.request("GET",1,a,{action:"studentRequest",runId:b,workgroupId:c,periodId:d,nodeId:f,peerReviewAction:"revise",
classmateWorkgroupIds:e},this.retrieveAnnotationAndWorkCallback,[this])};
OPENRESPONSE.prototype.retrieveAnnotationAndWorkCallback=function(a,b,c){b=c[0];if(a!=null&&a!=""){a=$.parseJSON(a);c=c="";b.associatedStartNode!=null&&(c=b.view.getProject().getStepNumberAndTitle(b.associatedStartNode.id));var d="";b.associatedAnnotateNode!=null&&(d=b.view.getProject().getStepNumberAndTitle(b.associatedAnnotateNode.id));if(a.error){if(a.error=="peerReviewUserHasNotSubmittedOwnWork")b.onlyDisplayMessage("<p>To start this step you must first submit a response in step <b><a style=\"color:blue\" onclick=\"eventManager.fire('renderNode', ['"+b.view.getProject().getPositionById(b.associatedStartNode.id)+
"']) \">"+c+"</a></b> (link).</p>");else if(a.error=="peerReviewUserHasNotBeenAssignedToClassmateWork")b.onlyDisplayMessage('<p>This step is not available yet.</p></p><p>More of your peers need to submit a response for step <b>"'+c+'"</b>. <br/>You will then be assigned a response to review.</p><p>Please return to step "'+d+'" in a few minutes.</p>');else if(a.error=="peerReviewUserHasNotAnnotatedClassmateWork")b.onlyDisplayMessage("<p>To start this step you must first submit a response in step <a style=\"color:blue\" onclick=\"eventManager.fire('renderNode', ['"+
b.view.getProject().getPositionById(b.associatedAnnotateNode.id)+"']) \">"+d+"</a></b> (link).</p>");else if(a.error=="peerReviewUserWorkHasNotBeenAssignedToClassmate"||a.error=="peerReviewUserWorkHasNotBeenAnnotatedByClassmate")if(b.stepNotOpenCustomMessage!=null&&b.stepNotOpenCustomMessage!="")b.onlyDisplayMessage(b.stepNotOpenCustomMessage.replace(/associatedStartNode.title/g,c).replace(/associatedAnnotateNode.title/g,d));else b.onlyDisplayMessage('<p>This step is not available yet.</p><p>Your response in step <b>"'+
c+'"</b> has not been reviewed by a peer yet.</p><p>More of your peers need to submit a response for step <b>"'+d+'"</b>.</p><p>Please return to this step in a few minutes.</p>');if(a.error=="peerReviewShowAuthoredReview")if(b.view.getStudentWorkForNodeId(b.associatedAnnotateNode.id),b.view.isLatestNodeStateLocked(b.associatedAnnotateNode.id))c=b.content.authoredReview;else{b.onlyDisplayMessage("<p>To start this step you must first submit a response in step <a style=\"color:blue\" onclick=\"eventManager.fire('renderNode', ['"+
b.view.getProject().getPositionById(b.associatedAnnotateNode.id)+"']) \">"+d+"</a>.</p>");return}else return}else c=a.annotation.value;c=b.replaceSlashNWithBR(c);a=NODE_VISIT.prototype.parseDataJSONObj(a.nodeVisit,b.view).getLatestWork();d=b.replaceSlashNWithBR(a);b.showDefaultDivs();b.showDefaultValues();document.getElementById("promptLabelDiv").innerHTML="instructions";document.getElementById("responseLabelDiv").innerHTML="your second draft:";document.getElementById("originalPromptTextDiv").innerHTML=
b.associatedStartNodeContent.assessmentItem.interaction.prompt;document.getElementById("originalPromptDisplayDiv").style.display="block";document.getElementById("associatedWorkLabelDiv").innerHTML='your original response&nbsp;&nbsp;&nbsp;<a id="toggleSwitch" onclick="toggleDetails2()">show/hide text';document.getElementById("associatedWorkTextDiv").innerHTML=d;document.getElementById("associatedWorkDisplayDiv").style.display="block";document.getElementById("associatedWorkTextDiv").style.display="none";
document.getElementById("associatedWorkTextDiv2").style.display="block";document.getElementById("annotationLabelDiv").innerHTML="<i>Team Anonymous</i> has given you the following feedback:";document.getElementById("annotationTextDiv").innerHTML=c;document.getElementById("annotationDisplayDiv").style.display="block";if(b.states!=null&&b.states.length>0)document.getElementById("responseBox").value=b.states[b.states.length-1].response,b.setSaveUnavailable(),displayNumberAttempts("This is your","revision",
b.states),b.node.setCompleted();else if(document.getElementById("numberAttemptsDiv").innerHTML="This is your first revision.",a!=null&&a!="")b.richTextEditor!=null?a.constructor.toString().indexOf("Array")!=-1?b.richTextEditor.setContent(a[0]):b.richTextEditor.setContent(a):document.getElementById("responseBox").value=a}b.doneRendering()};
OPENRESPONSE.prototype.showStarter=function(){if(this.content.starterSentence.display!="0"){var a=document.getElementById("responseBox");this.richTextEditor?this.richTextEditor.setContent(this.content.starterSentence.sentence+"<br/><br/>"+this.richTextEditor.getContent()):a.value=this.content.starterSentence.sentence+"\n\n"+a.value}else this.node.view.notificationManager.notify("There is no starter sentence specified for this step",3)};
OPENRESPONSE.prototype.getPeerReviewPrompt=function(){var a="";this.content!=null&&this.content.assessmentItem!=null&&(a+=this.content.assessmentItem.interaction.prompt);return a};OPENRESPONSE.prototype.getPeerReviewOtherStudentWork=function(a){var b="";a!=null?(a=a.nodeStates,a.length>0&&(b+=a[a.length-1].response)):b+="<p>Responses from your peers are not available yet.</p><p>Please return to this step later.</p>";return b};
OPENRESPONSE.prototype.lockResponseBox=function(){document.getElementById("responseBox").disabled=!0};OPENRESPONSE.prototype.unlockResponseBox=function(){document.getElementById("responseBox").disabled=!1};
OPENRESPONSE.prototype.showDefaultDivs=function(){document.getElementById("promptDisplayDiv").style.display="block";document.getElementById("starterParent").style.display="block";document.getElementById("responseDisplayDiv").style.display="block";document.getElementById("buttonDiv").style.display="block"};
OPENRESPONSE.prototype.showDefaultValues=function(){this.content.starterSentence.display=="1"||this.content.starterSentence.display=="2"?document.getElementById("starterParent").style.display="block":document.getElementById("starterParent").style.display="none";document.getElementById("orPromptDiv").innerHTML=this.content.assessmentItem.interaction.prompt;document.getElementById("promptLabelDiv").innerHTML="question";document.getElementById("responseBox").setAttribute("rows",this.content.assessmentItem.interaction.expectedLines)};
OPENRESPONSE.prototype.appendResponse=function(a){this.content.isRichTextEditorAllowed?this.richTextEditor.setContent(this.richTextEditor.getContent()+a):document.getElementById("responseBox").value+=a};
OPENRESPONSE.prototype.setResponse=function(){this.states!=null&&this.states.length>0?(document.getElementById("responseBox").value=this.states[this.states.length-1].response,this.setSaveUnavailable(),displayNumberAttempts("This is your","revision",this.states)):(document.getElementById("numberAttemptsDiv").innerHTML="This is your first revision.",document.getElementById("responseBox").value="",this.setSaveAvailable(),this.content.starterSentence.display=="2"&&this.showStarter())};
OPENRESPONSE.prototype.replaceSlashNWithBR=function(a){var b="",b=a.constructor.toString().indexOf("Array")!=-1?a[0]:a;return b.replace(/\n/g,"<br>")};OPENRESPONSE.prototype.doneRendering=function(){eventManager.fire("contentRenderComplete",this.node.id,this.node)};typeof eventManager!="undefined"&&eventManager.fire("scriptLoaded","vle/node/openresponse/openresponse.js");
if(typeof eventManager != 'undefined'){eventManager.fire('scriptLoaded', 'vle/node/openresponse/openresponse_core_min.js');}
