// !! todo: remove all acutes from rider names
// !! todo: deal with some comments using \r to terminate lines????
// wc itt hoo_ts: incorrect formatting - no x ie just (2.0) - should I accomodate that?
// todo: Predictions removal case insensitive
// todo: add var to declarations
// all-results thing is missing some people - even if their comment wasn't right and they got 0 they should still be listed
// todo: make the whole row in all-results lead to user update
// todo: allow editing of the result input - or maybe change it to use 2 pages so you can just go back?

// done: change toLowerCase() so I can put their original comment in the entry section

let form = document.forms.results;
let results = [];

form.addEventListener('submit', (event) => {
    event.preventDefault(); // stop it adding the form info to query in url
    // fc = form.elements.firstcycling.value;
    // !! learn how to put promise stuff in a function

    // get results
    for (let i = 0; i < form.elements.length-2; i++) {
        results.push(form.elements[i].value);
    }
    let cells = document.getElementsByClassName('results-rider');
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerHTML = results[i];
    }
    // for (let i = 0; i < results.length; i++) {
    //     results[i] = results[i].toLowerCase();
    // }
    // console.log(results[i]);

    // 
    let reddit = form.elements.reddit.value;
    let apiURL = reddit + '/.json?depth=1'
    fetch(apiURL).then(function(resp) {
        // catch network error
        if (resp.status != 200) {
            alert('Error with reddit request.');
        } else {
            resp.json().then(function(json) {
                // message = document.getElementsByClassName('reddit-response')[0];
                // message.style.visibility = 'visible';
                // alert(json[0]['kind']);
                // raceName = json[0]['data']['children'][0]['data']['title'].split('] ')[1].split(' Predictions')[0]; // Predictions split should be case insensitive
                let raceName = json[0]['data']['children'][0]['data']['title'].split('] ')[1].split(' -')[0].split('Predictions')[0]; // Predictions split should be case insensitive
                form.style.display = 'none';
                let raceTitleElem = document.getElementsByClassName('race-title')[0];
                raceTitleElem.innerHTML = raceName + ' RFL Results';
                raceTitleElem.style.visibility = 'visible';
                makeElemsVisible();
                processResults(json[1]['data']['children'], results)
            })
        }
    });
});

function makeElemsVisible() {
    document.getElementsByClassName("container")[0].style.display = 'flex';
    document.getElementsByClassName("all-results")[0].style.display = 'block';
}

// json: json of reddit comments. results: results array 1st-10th
// only need top level comments
function processResults(json, results) {
    var rfl = {};
    // let i = 0;
    // multipliers = {"x2.0": "2.0", "x1.8": "1.8", "x1.6": "1.6", "x1.4": "1.4", "x1.2": "1.2", "x1.0": "1.0"};
    for (var key in json) {
        let username = json[key]['data']['author'];
        // console.log(username);
        let comment = json[key]['data']['body'];
        // entry = {};
        let entry = [];
        // console.log(comment);
        let lines = comment.split("\n");
        // console.log(lines);
        let multIndex = 0;
        let multStrs = ["x2.0)", "x1.8)", "x1.6)", "x1.4)", "x1.2)", "x1.0)", "x1.0)", "x1.0)"];
        // multKeys = ["2.0", "1.8", "1.6", "1.4", "1.2", "1.0a", "1.0b", "1.0c"];
        for (let i = 0; i < lines.length && multIndex < multStrs.length; i++) {
            let rider = lines[i].split(multStrs[multIndex])[1];
            if (rider) {
                // entry[multKeys[multIndex]] = rider.trim().toLowerCase();
                entry.push(rider.trim());
                multIndex++;
            }
        }
        rfl[username] = {'entry': entry};
        // i++;
        // console.log(username);
        // console.log(lines);
        // console.log(entry);

        // reveales \r terminating comments
        // console.log(entry.length);
        // if (multIndex != 8) {
        //     console.log(username);
        //     console.log(lines);
        //     console.log(entry);
        // }
        
        
        // cur = (comment.split('(x2.0)')[1] || "\n").split('\n');

        // entry['x1.8'] = (comment.split('(x2.0)')[1] || "\n").split('\n')[0];
        // entry['x1.6'] = (comment.split('(x2.0)')[1] || "\n").split('\n')[0];
        // entry['x1.4'] = (comment.split('(x2.0)')[1] || "\n").split('\n')[0];
        // entry['x1.2'] = (comment.split('(x2.0)')[1] || "\n").split('\n')[0];
        // entry['x1.0a'] = (comment.split('(x2.0)')[1] || "\n").split('\n')[0];
        // entry['x1.0b'] = (comment.split('(x2.0)')[1] || "\n").split('\n')[0];
        // entry['x1.0c'] = (comment.split('(x2.0)')[1] || "\n").split('\n')[0];
        // if (entry['x2.0'] === '') {
        //     console.log('empty ' + username);
        // } 
        // console.log(entry['x2.0']);
    }
    // console.log(rflEntries);
    calculateScores(rfl, results);
}

function calculateScores(rfl, results) {
    // multipliers = {"2.0": 2.0, "1.8": 1.8, "1.6": 1.6, "1.4": 1.4, "1.2": 1.2, "1.0a": 1.0, "1.0b": 1.0, "1.0c": 1.0};
    let multipliers = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 1.0, 1.0]; // make this global or smth
    let points = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1]; // should avoid repeating this between js and css, and global or smth
    let order = []; // get users in sorted order somehow
    let maxscore = 0; // temporary, until sorting is done
    let maxuser = '';

    for (var user of Object.keys(rfl)) {
        console.log(rfl[user]['entry']);
        let lcEntry = [];
        for (const rider of rfl[user]['entry']) {
            lcEntry.push(rider.toLowerCase());
        }
        console.log(lcEntry);
        rfl[user]['score'] = 0;
        for (let i = 0; i < results.length; i++) {
            let index = lcEntry.indexOf(results[i].toLowerCase()); // if repeated (breaks rfl ules), returns first occurence
            // repeating toLowerCase() call many times
            if (index != -1) {
                // console.log(rfl[user]['entry'][index]);
                rfl[user]['score'] += points[i]*multipliers[index];
            }
        }
        if (rfl[user]['score'] >= maxscore) {
            maxscore = rfl[user]['score'];
            maxuser = user;
        }
        console.log(user);
        console.log(rfl[user]['score']);

        // for (const key of Object.keys(multipliers)) {
        //     if (rfl[user]['entry']['key']
        // }
    }
    writeScores(rfl);
    updateUserEntry(rfl, maxuser, results);
}

// not sorted yet
function writeScores(rfl) {
    let tbody = document.getElementsByClassName("allresults-tbody")[0];
    let keys = Object.keys(rfl);
    for (let i = 0; i < keys.length; i++) {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${i+1}</td><td>${keys[i]}</td><td>${rfl[keys[i]]['score'].toFixed(1)}</td>`;
        row.addEventListener('click', (event) => { // declare this as a separate function
            let username = event.target.innerHTML; // event.srcElement
            console.log(this);
            updateUserEntry(rfl, username, results);
            // window.scrollTo(window.scrollX, 0);
            // document.getElementsByClassName("user-score")[0].scrollIntoView();
            // let rect = document.getElementsByClassName("user-results")[0].getBoundingClientRect();
            // console.log(rect);
            // window.scrollTo({top: rect.top, behaviour: 'smooth'});
            document.getElementsByClassName("user-results")[0].scrollIntoView();
        });
        tbody.appendChild(row);
    }
    
}

function updateUserEntry(rfl, username, results) {
    document.getElementById('username').innerHTML = username + "'s entry";
    let cells = document.getElementsByClassName('user-rider');
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerHTML = rfl[username]['entry'][i];
    }

    let multipliers = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 1.0, 1.0];
    let points = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
    cells = document.getElementsByClassName('user-multiplier');
    let userPoints = document.getElementsByClassName('user-points');
    // this code repeated from other calculate function
    let score = 0;
    let perfect = true;
    let lcEntry = [];
        for (const rider of rfl[username]['entry']) {
            lcEntry.push(rider.toLowerCase());
        }
    for (let i = 0; i < results.length; i++) {
        let index = lcEntry.indexOf(results[i].toLowerCase()); // if repeated (breaks rfl ules), returns first occurence
        cells[i].classList.remove("incorrect");
        cells[i].classList.remove("perfect-choice");
        cells[i].classList.remove("correct");
        if (index != -1) {
            console.log(multipliers[index]);
            cells[i].innerHTML = '(x' + multipliers[index].toFixed(1) + ')';
            cells[i].classList.add("correct");
            if (!(i == index || i > 4)) { // !! not quite right when you get down to the 1.0s
                perfect = false;
            }
            userPoints[i].innerHTML = (points[i]*multipliers[index]).toFixed(1);
            score += points[i]*multipliers[index];
            if (perfect == true) {
                cells[i].classList.add("perfect-choice");
            }
        } else {
            perfect = false;
            userPoints[i].innerHTML = '';
            cells[i].innerHTML = 'X';
            cells[i].classList.add("incorrect");
        }
        
    }
    document.getElementsByClassName("user-score")[0].innerHTML = score.toFixed(1);
}

// form.submit();


 // fc and pcs both don't have usable CORS
        // fetch(fc).then(function(resp) {
        //     if (resp.status != 200) {
        //         alert('Error getting response from firstcycling.');
        //     } else {
        //         resp.text().then(function(text) {
        //             alert(text);
        //         })
        //     }
        // });