/*global document: false */
(function(){
"use strict";

var canvas = document.getElementById('playfield');
// create context for background 
var textCtx = canvas.getContext('2d');

var playfieldWidth = 430;
var playfieldHeight = 230;

canvas.width = playfieldWidth;
canvas.height = playfieldWidth;

var mapStartLoc = {x:250, y:25}; // x y coords of mini map
var lastMapCurrentPixelLoc = {x:0, y:0};
var mapPixelMultiplier = 6;
var mapPixelOffset = mapPixelMultiplier/2;
var blinkPixel = false;
var roomStartLoc = {x:40, y:25};
var dungeonSize = {width:25, height:25};
var currentRoomPos, messages;
var emptyRoomList = [];
var player = {};
var lastMove = {};

lastMove.health = 0;
lastMove.food = 0;
lastMove.keys = 0;
lastMove.gold = 0;

player.roomsVisited = 0;

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function writeMessage(messageStr, style){
    var objDiv;
    messageStr = "<p class='"+style+"'>"+messageStr +"</p>\r";
    messages = messageStr+messages;
    document.getElementById("messages").innerHTML = messages;
    objDiv = document.getElementById("messages");
    objDiv.scrollBottom = objDiv.scrollHeight;
}

function _randInt(min, add){
    return Math.floor(Math.random()*add) + min;
}

// create context for map 
var mapCtx = canvas.getContext('2d');

function initPlayer(){

    currentRoomPos = ({x:2, y:2});
    
    //map outline
    mapCtx.rect(mapStartLoc.x-2,mapStartLoc.y-2,152,152);
    mapCtx.strokeStyle="white";
    mapCtx.stroke();
            
    player.maxHealth = 20; //20
    player.health = player.maxHealth;
    player.food = 20; //20

    player.keys = 4; //4
    player.gold = 0; //0
    
    lastMove.health = player.health;
    lastMove.food = player.food;
    lastMove.keys = player.keys;
    lastMove.gold = player.gold;
    
    player.roomsVisited = 1;
    
    messages = "";
    
    writeMessage("Use the W,A,S,D keys to travel between chambers. Doorways marked with \"+\" are locked and cost one key to unlock them.  Moving costs 1 food. If you have no food left, moving costs 1 health. The game will end when you have no health left.","messageBold");
    
    writeMessage("You've been thrown into a dark chamber cell. Luckily, you're equipped with "+player.keys+" keys and some food. Maybe there's a chance of getting out before you starve to death?","messageReg");
}

initPlayer();

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) { return true; }

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) {   return false; }
    if (obj.length === 0) { return true; }

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) { return false; }
    }

    return true;
}



function makeRandomChestProperties(chest) {
    chest.opened = false;        
    chest.keys = (Math.random() < 0.5) ? _randInt(1,3) : 0;
    chest.gold = (Math.random() < 0.5) ? _randInt(1,10) : 0;
    chest.food = (Math.random() < 0.5) ? _randInt(1,7) : 0;
    chest.health = (Math.random() < 0.5) ? _randInt(1,6) : 0;
}

function makeRandomBeggarProperties(beggar) {
    var wantChance = _randInt(0,3);
    var a = _randInt(0,1);
    var b = 1 - a;
    
    beggar.wantsGold = 0;
    beggar.wantsFood = 0;
    beggar.wantsKeys = 0;
    beggar.forGold = 0;
    beggar.forFood = 0;
    beggar.forKeys = 0;
    
    if (wantChance === 0) {
        beggar.wantsGold = _randInt(25,55);
        beggar.forFood = _randInt(a,8);
        beggar.forKeys = _randInt(b,7);
    } else if (wantChance === 1) {
        beggar.wantsFood = _randInt(5,5);
        beggar.forGold = _randInt(a,20);
        beggar.forKeys = _randInt(b,7);
    } else if (wantChance === 2) {
        beggar.wantsKeys = _randInt(1,4);
        beggar.forGold = _randInt(a,40);
        beggar.forFood = _randInt(b,12);
    }

}

function makeRandomWallStrProperty() {
    var wallChance = _randInt(0,3);
    if (wallChance === 0) {
        return "w"; // wall
    } else if(wallChance === 1) {
        return "o"; // open doorway
    } else {
        return "l"; // locked
    }
}

function makeRooms(rows, cols){

  var arr = [];

  // Creates all lines:
  for(var i=0; i < rows; i++){

      // Creates an empty line
      arr.push([]);

      // Adds cols to the empty line:
      arr[i].push( new Array(cols));

      for(var j=0; j < cols; j++){
        // Initializes:
        var room = {};
        room.colR1 = Math.floor(206/(dungeonSize.width/j))+50;
        room.colG1 = Math.floor(206/(dungeonSize.width/i))+50;
        room.colB1 = Math.floor(206/(dungeonSize.width/i))+50;
        
        room.colR2 = Math.floor(206/(dungeonSize.width/i))+50;
        room.colG2 = Math.floor(206/(dungeonSize.width/i))+50;
        room.colB2 = Math.floor(206/(dungeonSize.width/j))+50;

        room.colR3 = Math.floor(250 - (206/(dungeonSize.width/j)));
        room.colG3 = Math.floor(250 - (206/(dungeonSize.width/i)));
        room.colB3 = Math.floor(250 - (206/(dungeonSize.width/i)));
                
        if(i === currentRoomPos.x && j === currentRoomPos.y){
            room.exitRight = "o";
            room.exitDown = "o";
        }else if(i === currentRoomPos.x -1 && j === currentRoomPos.y){
            room.exitRight = "o";
            room.exitDown = makeRandomWallStrProperty();
        }else if(i === currentRoomPos.x && j === currentRoomPos.y -1){
            room.exitRight = makeRandomWallStrProperty();
            room.exitDown = "o";
        }else{
            room.exitRight = makeRandomWallStrProperty();
            room.exitDown = makeRandomWallStrProperty();
        }
        
        if(i === dungeonSize.width-1){
            room.exitRight = "w";
        }
        
        if(j === dungeonSize.height-1){
            room.exitDown = "w";
        }
        
        room.chest = {};
        room.keys = null;
        room.gold = null;
        room.food = null;
        room.beggar = {};
        room.visited = false;
        
        if(i !== currentRoomPos.x && j !== currentRoomPos.y){
            var centerRoomProp = Math.floor(Math.random()*7);
            if(centerRoomProp === 1){
                room.keys = Math.floor(Math.random()*3) + 1;
            } else if(centerRoomProp === 2){
                room.gold = Math.floor(Math.random()*5) + 1;
            } else if(centerRoomProp === 3){
                room.food = Math.floor(Math.random()*6) + 1;
            } else if(centerRoomProp === 4){
                makeRandomBeggarProperties(room.beggar);
            } else if(centerRoomProp === 5){
                makeRandomChestProperties(room.chest);
            }
        }else if(i === currentRoomPos.x && j === currentRoomPos.y){
            room.visited = true;
        }else{
            emptyRoomList.push({x:i, y:j});
        }
    
        arr[i][j] = room;
      }
  }

    return arr;
}

var rooms = makeRooms(dungeonSize.width,dungeonSize.height);

CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, lineHeight) {
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        if(i > 0){
            lines[i] = lines[i].substring(1);
        }
        this.fillText(lines[i], x, y);
        y += lineHeight;
    }
};

function returnWallStringForProperty(propertyStr, dirStr){
    if(propertyStr === "w"){
        if(dirStr === "hor"){
            return "|";
        }else{
            return "-";
        } 
    }else if(propertyStr === "o"){
        return " ";
    }else{
        return "+";
    }
}

var aniCurrentMapPixelLocVar = setInterval(function() {
    mapCtx.fillStyle = blinkPixel ? "rgba(0,255,242,255)" : "rgba(255,255,255,255)";
    blinkPixel = !blinkPixel;
    
    mapCtx.fillRect(lastMapCurrentPixelLoc.x, lastMapCurrentPixelLoc.y, mapPixelOffset, mapPixelOffset);
}, 500);

function drawBG(writeMessages){
    lastMapCurrentPixelLoc.x = mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier);
    lastMapCurrentPixelLoc.y = mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier);
    
    var l, r, u, d, c, chestMsg;
    var roomProperties = rooms[currentRoomPos.x][currentRoomPos.y];
    
    textCtx.fillStyle = "#A1A1A1";
    textCtx.font = "bold 18px Courier New";
    
    // Create gradient
    var gradient=textCtx.createLinearGradient(roomStartLoc.x,roomStartLoc.y,roomStartLoc.x+100,0);
    gradient.addColorStop("0",rgbToHex(roomProperties.colR1,roomProperties.colG1,roomProperties.colB1));
    gradient.addColorStop("0.5",rgbToHex(roomProperties.colR2,roomProperties.colG2,roomProperties.colB2));
    gradient.addColorStop("1.0",rgbToHex(roomProperties.colR3,roomProperties.colG3,roomProperties.colB3));
    
    // check if room was visited for points
    if(roomProperties.visited === false){
        roomProperties.visited = true;
        player.roomsVisited += 1;
    }
    
    var isChestObjEmpty = isEmpty(roomProperties.chest);
    var isBeggarObjEmpty = isEmpty(roomProperties.beggar);
    
    if (isChestObjEmpty === false) {
        if (roomProperties.chest.opened === false) {
            c = "C";
            if(player.keys > 0){
                chestMsg = "Press J if you wish to open it.";
            }else{
                chestMsg = "Unfortunately, you have no keys left.";
            }
            writeMessage("There is a chest in this room. It costs one key to open. "+chestMsg, "messageReg");
        } else {
            c = "_";
            if (writeMessages) {
                writeMessage("An empty chest lies before you.","messageReg");
            }
        }
    } else if (isBeggarObjEmpty === false) {
        c = "I";
        var forGoldStr = "";
        var forFoodStr = "";
        var forKeysStr = "";
        
        if(roomProperties.beggar.forGold > 0){
            forGoldStr ="Gold:"+roomProperties.beggar.forGold+" ";
        }
        
        if(roomProperties.beggar.forFood > 0){
            forFoodStr ="Food:"+roomProperties.beggar.forFood+" ";
        }
        
        if(roomProperties.beggar.forKeys > 0){
            forKeysStr ="Keys:"+roomProperties.beggar.forKeys+" ";
        }
        
        if(roomProperties.beggar.wantsGold > 0){
            writeMessage("Please.. give me "+roomProperties.beggar.wantsGold+" gold, and I will give you: "+forFoodStr+forKeysStr,"messageGreen");
        }else if(roomProperties.beggar.wantsFood > 0){
            writeMessage("Please.. give me "+roomProperties.beggar.wantsFood+" food, and I will give you: "+forGoldStr+forKeysStr,"messageGreen");
        }else{
            writeMessage("Please.. give me "+roomProperties.beggar.wantsKeys+" keys, and I will give you: "+forGoldStr+forFoodStr,"messageGreen");
        }
    } else if (roomProperties.keys !== null) {
        c = "K";
        writeMessage("You see something shiny on the floor. A key! Is there more than one? Press J to find out.","messageReg");
    } else if (roomProperties.food !== null) {
        c = "F";
        writeMessage("You see a can of food on the floor. You could always use more of that. Press J to pick it up.","messageReg");
    } else if (roomProperties.gold !== null) {
        c = "G";
        writeMessage("You see gold, but is it of any use? Press J to pick it up.","messageReg");
    } else {
        c = " ";
        if(writeMessages){
            writeMessage("Empty room.","messageReg");
        }
    }
        
    var leftRoomProperties;
    if(currentRoomPos.x > 0){
        leftRoomProperties = rooms[currentRoomPos.x-1][currentRoomPos.y];
        l = returnWallStringForProperty(leftRoomProperties.exitRight, "hor");
        if(l === " "){
            mapCtx.fillStyle = "rgba(130,130,130,255)";
            mapCtx.fillRect((mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier)-mapPixelOffset), mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier), mapPixelOffset, mapPixelOffset);
        } else if (l === "+") {
            mapCtx.fillStyle = "rgba(255,0,255,255)";
            mapCtx.fillRect((mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier)-mapPixelOffset), mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier), mapPixelOffset, mapPixelOffset);
        }
    } else {
        l = "|";
    }
    
    var upRoomProperties;
    if(currentRoomPos.y > 0){
        upRoomProperties = rooms[currentRoomPos.x][currentRoomPos.y-1];
        u = returnWallStringForProperty(upRoomProperties.exitDown, "ver");
        if(u === " "){
            mapCtx.fillStyle = "rgba(130,130,130,255)";
            mapCtx.fillRect(mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier), (mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier)-mapPixelOffset), mapPixelOffset, mapPixelOffset);
        }else if(u === "+"){
            mapCtx.fillStyle = "rgba(255,0,255,255)";
            mapCtx.fillRect(mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier), (mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier)-mapPixelOffset), mapPixelOffset, mapPixelOffset);
        }
    }else{
        u = "-";
    }
    
    r = returnWallStringForProperty(roomProperties.exitRight, "hor");
    if(r === " "){
        mapCtx.fillStyle = "rgba(130,130,130,255)";
        mapCtx.fillRect((mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier)+mapPixelOffset), mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier), mapPixelOffset, mapPixelOffset);
    }else if(r === "+"){
        mapCtx.fillStyle = "rgba(255,0,255,255)";
        mapCtx.fillRect((mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier)+mapPixelOffset), mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier), mapPixelOffset, mapPixelOffset);
    }
    
    d = returnWallStringForProperty(roomProperties.exitDown, "ver");
    if(d === " "){
        mapCtx.fillStyle = "rgba(130,130,130,255)";
        mapCtx.fillRect(mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier), (mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier)+mapPixelOffset), mapPixelOffset, mapPixelOffset);
    }else if(d === "+"){
        mapCtx.fillStyle = "rgba(255,0,255,255)";
        mapCtx.fillRect(mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier), (mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier)+mapPixelOffset), mapPixelOffset, mapPixelOffset);
    }
    
    var roomStr = 
   "+------"+u+"------+\n "+
   "|             |\n "+
   "|             |\n "+
   "|             |\n "+
   "|      "+c+"      |\n "+
   ""+l+"             "+r+"\n "+
   "|             |\n "+
   "|             |\n "+
   "|             |\n "+
   "|             |\n "+
   "+------"+d+"------+\n"+
   "";
    
    // Fill with gradient
    textCtx.fillStyle=gradient;
    textCtx.wrapText(roomStr,roomStartLoc.x,roomStartLoc.y,16);
    
    var diff;
    textCtx.fillStyle='#DEDEDE';
    textCtx.wrapText("("+currentRoomPos.x+","+currentRoomPos.y+")",0,210,16);
    textCtx.wrapText(player.health+"/"+player.maxHealth,80,210,16);
    diff = player.health - lastMove.health;
    if(diff < 0){
        textCtx.fillStyle='#EB1313';
        textCtx.wrapText(""+diff+"",80,230,16);
    }else if(diff > 0){
        textCtx.fillStyle='#05ED14';
        textCtx.wrapText("+"+diff,80,230,16);
    }
    
    textCtx.fillStyle='#DEDEDE';
    textCtx.wrapText("F:"+player.food,160,210,16);
    diff = player.food - lastMove.food;
    if(diff < 0){
        textCtx.fillStyle='#EB1313';
        textCtx.wrapText(""+diff+"",160,230,16);
    }else if(diff > 0){
        textCtx.fillStyle='#05ED14';
        textCtx.wrapText("+"+diff,160,230,16);
    }
    
    textCtx.fillStyle='#DEDEDE';
    textCtx.wrapText("K:"+player.keys,260,210,16);
    diff = player.keys - lastMove.keys;
    if(diff < 0){
        textCtx.fillStyle='#EB1313';
        textCtx.wrapText(""+diff+"",260,230,16);
    }else if(diff > 0){
        textCtx.fillStyle='#05ED14';
        textCtx.wrapText("+"+diff,260,230,16);
    }
    
    textCtx.fillStyle='#DEDEDE';
    textCtx.wrapText("G:"+player.gold,350,210,16);
    diff = player.gold - lastMove.gold;
    if(diff < 0){
        textCtx.fillStyle='#EB1313';
        textCtx.wrapText(""+diff+"",350,230,16);
    }else if(diff > 0){
        textCtx.fillStyle='#05ED14';
        textCtx.wrapText("+"+diff,350,230,16);
    }
    
    if(player.health <= 0){
        endGame();
    }
        
    lastMove.health = player.health;
    lastMove.food   = player.food;
    lastMove.keys   = player.keys;
    lastMove.gold   = player.gold;
}

drawBG(false);


function clearPlayfield (){ 
    //textCtx.clearRect (0, 0, playfieldWidth, playfieldHeight);
    textCtx.clearRect(roomStartLoc.x, 14, 162, 171);
    clearText();
    
    mapCtx.fillStyle = "rgba(255,255,255,255)";
    mapCtx.fillRect(lastMapCurrentPixelLoc.x, lastMapCurrentPixelLoc.y, mapPixelOffset, mapPixelOffset);
}

function clearText (){ 
    textCtx.clearRect(0, 175, playfieldWidth, 65);
}

function clearMap () {
    mapCtx.clearRect(mapStartLoc.x-2,mapStartLoc.y-2,152,152); 
    currentRoomPos = ({x:2, y:2});
    lastMapCurrentPixelLoc.x = mapStartLoc.x+(currentRoomPos.x*mapPixelMultiplier);
    lastMapCurrentPixelLoc.y = mapStartLoc.y+(currentRoomPos.y*mapPixelMultiplier);
}

function endGame(){
    if(player.food === 0 && player.health === 0){
        writeMessage("You died, most likely of starvation.","messageRed");
        textCtx.fillText("YOU'RE DEAD", roomStartLoc.x+23, roomStartLoc.y+30);
    }
    
    var finalScore = player.roomsVisited + player.gold;
    writeMessage("Your final score is "+finalScore+". Press R to start a new game.","messageBlue");
}

function checkMoveWithPos(pos, dir){
    var roomProperties = rooms[pos.x][pos.y];
    var movePlayer = false;
    var usedKey = false;
    if(dir === "hor"){
        if(roomProperties.exitRight === "o"){
            movePlayer = true;
        } else if(roomProperties.exitRight === "l" && player.keys > 0){
            player.keys -= 1;
            usedKey = true;
            roomProperties.exitRight = "o";
            movePlayer = true;
        }
    }else{
        if(roomProperties.exitDown === "o"){
            movePlayer = true;
        } else if(roomProperties.exitDown === "l" && player.keys > 0){
            player.keys -= 1;
            usedKey = true;
            roomProperties.exitDown = "o";
            movePlayer = true;
        }
    }
    
    if(movePlayer){ 
        if(usedKey && player.keys === 0){
            writeMessage("Oh no! You used all your keys! Looks like there's no hope in seeing your family this Christmas.. unless you find some keys.","messageRed");
        }
    
        // recover health when moving
        if(player.food > 0 && player.health < player.maxHealth){
            player.health += 1;
        }
    
        if(player.food > 0){ // lose food when moving
            player.food -= 1;
            if(player.food === 0){
                writeMessage("You ran out of food! You can feel yourself getting weaker with every step you take.","messageRed");
            }
        }else if(player.health > 0){ // player starving
            player.health -= 1;
        }
        
        if(player.food === 0 && player.health === 6){
            writeMessage("You're wasting away to almost nothing from starving to death. Your body more or less resembles skin and bones. Find food fast.","messageRed");
        } 
        
        if(player.health === 10){
            writeMessage("You're running dangerously low on health!","messageRed");
        }
        
        // check if beggar was in room, and if so add beggar to empty room and remove old beggar
        var currentRoomProperties = rooms[currentRoomPos.x][currentRoomPos.y];
        var isBeggarObjEmpty = isEmpty(currentRoomProperties.beggar);
        if(isBeggarObjEmpty === false){
            // get random empty room index
            var emptyRoomIndex = Math.floor(Math.random()*emptyRoomList.length);
            // room properties of random room       
            var newRoomProperties = rooms[emptyRoomList[emptyRoomIndex].x][emptyRoomList[emptyRoomIndex].y];
            // apply random beggar properties to empty room
            makeRandomBeggarProperties(newRoomProperties.beggar);
            // add current player location to empty room list
            emptyRoomList.push({x:currentRoomPos.x, y:currentRoomPos.x});
            // replace beggar object in current room to a blank object
            currentRoomProperties.beggar = {};
            // get rid of old empty room index because it's not empty anymore
            emptyRoomList.splice(emptyRoomIndex, 1);
        }
    }
    return movePlayer;
}

document.addEventListener('keydown', function(event) {
    var movePlayer = false,
        delt_x = 0,
        delt_y = 0,
        draw_bg = false;

    //-- handle restart
    if(event.keyCode === 82) { // restart game, r
        clearMap();
        clearPlayfield();
        initPlayer();
        rooms = makeRooms(dungeonSize.width,dungeonSize.height);
        drawBG(false);
    }

    //-- block dead players from proceeding
    if(player.health === 0) { return; }

    //-- player movement
    if(event.keyCode === 65 && currentRoomPos.x > 0) { //left, a
        movePlayer = checkMoveWithPos({x:currentRoomPos.x-1, y:currentRoomPos.y}, "hor");
        delt_x = -1;
    } else if(event.keyCode === 68 && currentRoomPos.x < (dungeonSize.width - 1)) { //right, d
        movePlayer = checkMoveWithPos({x:currentRoomPos.x, y:currentRoomPos.y}, "hor");
        delt_x = 1;
    } else if(event.keyCode === 87 && currentRoomPos.y > 0) { //up, w
        movePlayer = checkMoveWithPos({x:currentRoomPos.x, y:currentRoomPos.y-1}, "ver");
        delt_y = -1;
    } else if(event.keyCode === 83 && currentRoomPos.y < (dungeonSize.height - 1)) { //down, s
        movePlayer = checkMoveWithPos({x:currentRoomPos.x, y:currentRoomPos.y}, "ver");
        delt_y = 1;
    }

    if(movePlayer){
        currentRoomPos.y += delt_y;
        currentRoomPos.x += delt_x;
        draw_bg = true;
    }

    if(event.keyCode === 74) { // action, j
        checkRoom();
    }

    clearPlayfield();
    drawBG(draw_bg);
});

function checkRoom () {
    var roomProperties = rooms[currentRoomPos.x][currentRoomPos.y];
    var isChestObjEmpty = isEmpty(roomProperties.chest);
    var isBeggarObjEmpty = isEmpty(roomProperties.beggar);

    if(isChestObjEmpty === false && roomProperties.chest.opened === false && player.keys > 0){ 
        roomProperties.chest.opened = true;
        player.keys -= 1;
        if(roomProperties.chest.keys === 0 && 
            roomProperties.chest.gold === 0 && 
            roomProperties.chest.food === 0 &&
            roomProperties.chest.health === 0){
        
            writeMessage("You are horribly unlucky. There is nothing in this chest. Worse off, you wasted a key.","messageRed");
        }else{
            var keysStr = "";
            var goldStr = "";
            var foodStr = "";
            var healthStr = "";
            
            if(roomProperties.chest.keys > 0){
                keysStr = "Keys:"+roomProperties.chest.keys+" ";
            }
            
            if(roomProperties.chest.gold > 0){
                goldStr = "Gold:"+roomProperties.chest.gold+" ";
            }
            
            if(roomProperties.chest.food > 0){
                foodStr = "Food:"+roomProperties.chest.food+" ";
            }
            
            if(roomProperties.chest.health > 0){
                healthStr = "Health:"+roomProperties.chest.health+" ";
            }
            
            writeMessage("You opened the chest. Let's see what you collected: "+keysStr+goldStr+foodStr+healthStr,"messageBlue");
        }
        
        player.keys += roomProperties.chest.keys;
        player.gold += roomProperties.chest.gold;
        player.food += roomProperties.chest.food;
        
        if(player.health + roomProperties.chest.health > player.maxHealth){
            player.health = player.maxHealth;
        }else{
            player.health += roomProperties.chest.health;
        }
    }else if(isBeggarObjEmpty === false){
        if(roomProperties.beggar.wantsGold > 0){
            if(player.gold >= roomProperties.beggar.wantsGold){
                player.gold -= roomProperties.beggar.wantsGold;
                player.food += roomProperties.beggar.forFood;
                player.keys += roomProperties.beggar.forKeys;
                
                writeMessage("Oh, bless you!","messageGreen");
            }else{
                writeMessage("Sorry, need more gold.","messageGreen");
            }
        } else if(roomProperties.beggar.wantsFood > 0){
            if(player.food >= roomProperties.beggar.wantsFood){
                player.food -= roomProperties.beggar.wantsFood;
                player.gold += roomProperties.beggar.forGold;
                player.keys += roomProperties.beggar.forKeys;
                
                writeMessage("Oh, bless you!","messageGreen");
            }else{
                writeMessage("Sorry, need more food.","messageGreen");
            }
        } else if(roomProperties.beggar.wantsKeys > 0){
            if(player.keys >= roomProperties.beggar.wantsKeys){
                player.keys -= roomProperties.beggar.wantsKeys;
                player.gold += roomProperties.beggar.forGold;
                player.food += roomProperties.beggar.forFood;
                
                writeMessage("Oh, bless you!","messageGreen");
            }else{
                writeMessage("Sorry, need more keys.","messageGreen");
            }
        }
    }else if (roomProperties.keys != null) {
        player.keys += roomProperties.keys;
        writeMessage("You picked up the shiny object. Let's see what you collected: Keys:"+roomProperties.keys,"messageBlue");
        roomProperties.keys = null;
        // add current player location to empty room list
        emptyRoomList.push({x:currentRoomPos.x, y:currentRoomPos.x});
    }else if (roomProperties.food != null) {
        player.food += roomProperties.food;
        writeMessage("You picked up the can. Let's see what you collected: Food:"+roomProperties.food,"messageBlue");
        roomProperties.food = null;
        // add current player location to empty room list
        emptyRoomList.push({x:currentRoomPos.x, y:currentRoomPos.x});
    }else if (roomProperties.gold != null) {
        player.gold += roomProperties.gold;
        writeMessage("You picked up the shiny object. Let's see what you collected: Gold:"+roomProperties.gold,"messageBlue");
        roomProperties.gold = null;
        // add current player location to empty room list
        emptyRoomList.push({x:currentRoomPos.x, y:currentRoomPos.x});
    }
}
})();