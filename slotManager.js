
/*
	Manage a slot list of Augmenta object
	When an object arrives, he takes the next available slot
	input : slotID + osc stream of objects / output : x y

	Disclaimer : This object does not handle objects the case of unplugged cable so there
	can be phantoms or living people not in slots, this would be fixed by using the Augmenta node
	Alos this examples uses protocol V1
*/

inlets = 4;
outlets = 2;
setinletassist(3,"leave");
setinletassist(2,"update");
setinletassist(1,"enter");
setinletassist(0,"slotID");
setoutletassist(1,"slots state");
setoutletassist(0,"Object x y");

// script vars
var slotSize = 10;
var activeSlot;

// Global vars
g = new Global("slotManagerGlobal");

// This code works if global

if(g.slotArray == "undefined" || g.slotArray == null)
{
	post("Creating shared slot array...\n");
	g.slotArray = new Array(slotSize);
	//post("g.slotArray.length : " + g.slotArray.length + "\n");
	for(i=0;i<g.slotArray.length;i++)
	{
		g.slotArray[i] = -1;
	}
} else {
	post("Shared slot array already exists, using it...\n");
	//post("g.slotArray.length : " + g.slotArray.length + "\n");
}

// init
init();

// Can trigger
function setSlotSize(_slotSize)
{
	post("Reseting array and changing slot size to : " + _slotSize + "\n");
	slotSize = _slotSize;
	g.slotArray = new Array(slotSize);
	post("g.slotArray.length : " + g.slotArray.length + "\n");
	emptySlotQueue();
	outlet(1,g.slotArray);
}

function emptySlotQueue()
{
	for(i=0;i<g.slotArray.length;i++)
	{
		g.slotArray[i] = -1;
	}
}

function msg_int(_int) {
	
	// Hanlding slot number request
	if(inlet == 0)
	{
		if(_int >= 0 && _int < slotSize)
		{
			activeSlot = _int;
	  		post("Active slot is now : " + activeSlot + "\n");
		} else
		{
			error("This slot does not exist ! : " + activeSlot + "\n");
		}
	} else
	{
		//post("Received msg_int : " + _currentSlot + "\n");
	}
}

function bang()
{
	outlet(1,g.slotArray);
}

function loadbang()
{
	//post("loadbang\n");
	outlet(1,g.slotArray);
}

function anything()
{
	var argArray = arrayfromargs(messagename,arguments);

	if (inlet==1)
	{
		//post("Object enters : " + argArray + "\n");
		post("Object of pid : " + argArray[pid] + " enters\n");
		
		var i = getNextAvailableSlot()
		if( i != -1)
		{
			g.slotArray[i] = argArray[pid];
		} else 
		{
			post("There is no available slot for now, come back later !\n")
		}
		outlet(1,g.slotArray);

	} else if (inlet==2)
	{
		//post("Object udpate : " + argArray + "\n");
		if(argArray[pid] == g.slotArray[activeSlot])
		{
			// if pid match with pid in activeslot -> update object
			//outlet(0,argArray[oid]); // output oid
			outlet(0,argArray[centroidX],argArray[centroidY]); // output x y
		}
	} else if (inlet==3)
	{
		//post("Object leaves : " + argArray + "\n");
		post("Object of pid : " + argArray[pid] + " leaves\n");
		var i = getIndexFromPid(argArray[pid]);
		if( i != -1)
		{
			g.slotArray[i] = -1;			
		}
		outlet(1,g.slotArray);

	} else
	{
		post("Received arg : " + argArray + "\n");
	}


}

function reset()
{
	init();
	setSlotSize(slotSize);
}

function setProtocolVersion(_version)
{
	if(_version == 1)
	{
		g.protocolVersion = 1;
		init();
	} else if (_version == 2)
	{
		g.protocolVersion = 2;
		init();
	} else {
		error("Did not understand protocol version correctly\n");
	}
}

// --------------  Internal functions ---------------------

init.local = 1;
function init()
{
	post("Initializing slot queue...\n");
	activeSlot = 0;
	
	if(g.protocolVersion == 1)
	{
		pid = 0;
		oid = 1;
		centroidX = 3;
		centroidY = 4;
	} else if(g.protocolVersion == 2)
	{
		pid = 1;
		oid = 2;
		centroidX = 4;
		centroidY = 5;
	} else {
		g.protocolVersion = 2; // default to protocol V2
		pid = 1;
		oid = 2;
		centroidX = 4;
		centroidY = 5;
	}	
}

getNextAvailableSlot.local = 1;
function getNextAvailableSlot()
{
	post("g.slotArray.length : " + g.slotArray.length + "\n");
	for (var i=0;i<g.slotArray.length;i++)
	{
		post("slotArray : " + g.slotArray[i] +"\n");
		if(g.slotArray[i] == -1)
		{
			post("Next available slot is : " + i + "\n");
			return i;
		}
	}
	//post("There is no available slot for now, come back later !\n")
	return -1;
}

getIndexFromPid.local = 1;
function getIndexFromPid(_pid)
{
	for (i=0;i<g.slotArray.length;i++)
	{
		if(g.slotArray[i] == _pid)
		{
			post("Object " + _pid + " is at index " + i + "\n");
			return i;
		}
	}
	error("Did not find pid " + _pid + " in array\n");
	return -1;
}
