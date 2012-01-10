/**
 * Challenge Node
 */
ChallengeNode.prototype = new MultipleChoiceNode();
ChallengeNode.prototype.constructor = ChallengeNode;
ChallengeNode.prototype.parent = MultipleChoiceNode.prototype;
ChallengeNode.authoringToolName = "挑戰問題";
ChallengeNode.authoringToolDescription = "學生回答多選項問題。如果答錯，再次回答之前他們必須重新瀏覽前面的步驟";

/**
 * @constructor
 * @extends Node
 * @param nodeType
 * @param view
 * @returns {ChallengeNode}
 */
function ChallengeNode(nodeType, view) {
	this.view = view;
	this.type = nodeType;
	this.prevWorkNodeIds = [];
}

NodeFactory.addNode('ChallengeNode', ChallengeNode);

//used to notify scriptloader that this script has finished loading
if(typeof eventManager != 'undefined'){
	eventManager.fire('scriptLoaded', 'vle/node/multiplechoice/ChallengeNode.js');
}