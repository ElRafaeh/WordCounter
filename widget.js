let userOptions = {
    channelName: "",
    wordTimer: "",
    wordsLimit: "",
    firstLetter: "", //if you want to limit just to hashtags or username mentions use # or @
    onlyUniqueUsers: "", //Allow users to have just one vote only
};

let words = [];
let users = [];
let start = false;


window.addEventListener('onWidgetLoad', function (obj) {
    userOptions["channelName"] = obj["detail"]["channel"]["username"];
    userOptions["wordTimer"] = obj["detail"]["fieldData"]["wordTimer"];
    userOptions["wordsLimit"] = obj["detail"]["fieldData"]["wordsLimit"];
    userOptions["firstLetter"] = obj["detail"]["fieldData"]["firstLetter"];
    userOptions["onlyUniqueUsers"] = (obj["detail"]["fieldData"]["onlyUniqueUsers"] === "yes");
});

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") return;
    let data = obj.detail.event.data;
    let message = html_encode(data["text"]);
    let user = data["nick"];
    let userstate = {
        "mod": parseInt(data.tags.mod),
        "badges": {
            "broadcaster": (user === userOptions["channelName"])
        }

    };
  
  	if (message === '!start' && (userstate.mod || userstate.badges.broadcaster)) {
          start = true;
          return;
      }
  	else if (message === '!stop' && (userstate.mod || userstate.badges.broadcaster)) {
          start = false;
      	  words = [];
          users = [];
          return;
      }
  	
  	if (start)
    {
      if (userOptions.onlyUniqueUsers && users.indexOf(user) !== -1) return false;

      let parts = message.split(" ");
      for (let i in parts) {
          if (poll(parts[i])) {
              users.push(user);
              return;
          }
      }
    }

});

function html_encode(e) {
    return e.replace(/[\<\>\"\^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";";
    });
}

function poll(word) {
    if (userOptions.firstLetter !== "" && userOptions.firstLetter !== word.charAt(0)) return false;
    var index = words.findIndex(p => p.word === word.substring(1));

    if (index === -1) {
        words.push({
            word: word.substring(1),
            count: 1,
            timer: userOptions.wordTimer,
        });
    } else {
        words[index]['count']++;
        words[index]['timer'] = userOptions.wordTimer;
    }
    return true;
}


let t = setInterval(function () {
    for (let key in words) {
        words[key]['timer'] = Math.max((words[key]['timer'] - 1), 0);
        if (words[key]['timer'] === 0) {
            words.splice(key, 1);
        }
    }
    displayWords();
}, 1000);

function displayWords() {
    words.sort(function (a, b) {
        return b.count - a.count;
    });

    let limit = Math.min(userOptions.wordsLimit, Object.keys(words).length);

    let row;
    $("#words").html("");
  	$("#words").append(`<p class="title">MOST TYPED WORDS</p>`)
  	
  	if(!start)
    {
      $("#words").append(`<div class="stop">!start para empezar la POLL</div>`);
    }
  	else
    {
      	$("#words").append(`<div class="stop">!stop para pararla</div><br>`);
      	$("#words").append(`<div>`)
        for (let wordIndex = 0; wordIndex < limit; wordIndex++) {
        	row = words[wordIndex];
        	$("#words").append(`<div class="wordRow">${wordIndex+1}. ${row.word} - <strong>${row.count}</strong> </div>`);
        }
      	$("#words").append('</div>')
    }
  }