// !! todo: remove all acutes from rider names
// !! todo: deal with some comments using \r to terminate lines????
// wc itt hoo_ts: incorrect formatting - no x ie just (2.0) - should I accomodate that?
// todo: Predictions removal case insensitive
// all-results thing is missing some people - even if their comment wasn't right and they got 0 they should still be listed
// todo: make the whole row in all-results lead to user update
// todo: encode/sanitise reddit content before putting in page - xss
// todo: change so it doesn't all continue from one promise call

// done: change toLowerCase() so I can put their original comment in the entry section
// use innerText instead of innerHTML for xss reasons, use table insertCell + innerText instead of innerHTML
// done: add var to declarations
// done: allow editing of the result input - or maybe change it to use 2 pages so you can just go back?


let results = []; // why did I make this global
const multipliers = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 1.0, 1.0];
const points = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1];

let params = new URLSearchParams(window.location.search);
results = [params.get('pos1'), params.get('pos2'), params.get('pos3'), params.get('pos4'), params.get('pos5'), params.get('pos6'), params.get('pos7'), params.get('pos8'), params.get('pos9'), params.get('pos10')]
console.log(results);

updateRaceResult(results);

let apiURL = params.get('reddit') + '/.json?depth=1';
    fetch(apiURL).then(function(resp) {
        // todo: catch network error
        if (resp.status != 200) {
            alert('Error with reddit request.');
        } else {
            resp.json().then(function(json) {
                // raceName = json[0]['data']['children'][0]['data']['title'].split('] ')[1].split(' Predictions')[0]; // Predictions split should be case insensitive
                let raceName = json[0]['data']['children'][0]['data']['title'].split('] ')[1].split(' -')[0].split('Predictions')[0]; // Predictions split should be case insensitive
                let raceTitleElem = document.getElementsByClassName('race-title')[0];
                raceTitleElem.innerText = raceName + ' RFL Results';
                // raceTitleElem.style.visibility = 'visible';
                document.getElementsByTagName('title')[0].innerText = raceName + ' RFL Results';
                processRFL(json[1]['data']['children'], results)
            })
        }
    });

function updateRaceResult(results) {
    let cells = document.getElementsByClassName('results-rider');
    console.log(cells);
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = results[i];
    }
}

// json: json of reddit comments. results: results array 1st-10th
// only need top level comments
function processRFL(comments, results) {
    let rfl = {};
    rfl = loadEntries(comments, rfl);
    rfl = calculateScores(rfl, results);
    const sortedUsernames = sortUsernames(rfl);
    updateResults(rfl, sortedUsernames);
    updateUserEntry(rfl, sortedUsernames[0], results);
}

function loadEntries(comments, rfl) {
    // multipliers = {"x2.0": "2.0", "x1.8": "1.8", "x1.6": "1.6", "x1.4": "1.4", "x1.2": "1.2", "x1.0": "1.0"};
    const multStrs = ["x2.0)", "x1.8)", "x1.6)", "x1.4)", "x1.2)", "x1.0)", "x1.0)", "x1.0)"];
    // multKeys = ["2.0", "1.8", "1.6", "1.4", "1.2", "1.0a", "1.0b", "1.0c"];
    for (let comment of comments) {
        let username = comment['data']['author'];
        let body = comment['data']['body'];
        let entry = [];
        let lines = body.split("\n");
        let multIndex = 0;
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
    return rfl;
}

function simplifyEntry(entry) {
    let simpleEntry = [];
    for (const rider of entry) {
        simpleEntry.push(simplifyRiderName(rider));
    }
    return simpleEntry;
}

function calculateScores(rfl, results) {
    // multipliers = {"2.0": 2.0, "1.8": 1.8, "1.6": 1.6, "1.4": 1.4, "1.2": 1.2, "1.0a": 1.0, "1.0b": 1.0, "1.0c": 1.0};
    for (let user of Object.keys(rfl)) {
        // console.log(rfl[user]['entry']);
        let entry = simplifyEntry(rfl[user]['entry']);
        // console.log(lcEntry);
        rfl[user]['score'] = 0;
        for (let i = 0; i < results.length; i++) {
            let index = entry.indexOf(simplifyRiderName(results[i])); // if repeated (breaks rfl rules), returns first occurence
            // repeating toLowerCase() call many times
            if (index != -1) {
                // console.log(rfl[user]['entry'][index]);
                rfl[user]['score'] += points[i]*multipliers[index];
            }
        }
        // console.log(user);
        // console.log(rfl[user]['score']);

        // for (const key of Object.keys(multipliers)) {
        //     if (rfl[user]['entry']['key']
        // }
    }
    return rfl;
}

function sortUsernames(rfl) {
    let usernames = [...Object.keys(rfl)];
    usernames.sort(function (usernameA, usernameB) { // a comes first if score is higher -> return negative if a is higher
        return rfl[usernameB]['score'] - rfl[usernameA]['score'];
    });
    return usernames;
}

function updateResults(rfl, usernames) {
    let tbody = document.getElementsByClassName("allresults-tbody")[0];
    for (let i = 0; i < usernames.length; i++) {
        // let row = document.createElement("tr");
        // row.innerHTML = `<td>${i+1}</td><td>${usernames[i]}</td><td>${rfl[usernames[i]]['score'].toFixed(1)}</td>`; // xss
        let row = tbody.insertRow(i);
        row.insertCell(0).innerText = `${i+1}`;
        let username = row.insertCell(1);
        username.innerText = usernames[i];
        row.insertCell(2).innerText = rfl[usernames[i]]['score'].toFixed(1);

        username.addEventListener('click', (event) => { // closure for rfl
            let username = event.target.innerText; // event.srcElement
            console.log(this);
            updateUserEntry(rfl, username, results);
            document.getElementsByClassName("user-results")[0].scrollIntoView();
            // window.scrollTo(window.scrollX, 0);
            // document.getElementsByClassName("user-score")[0].scrollIntoView();
            // let rect = document.getElementsByClassName("user-results")[0].getBoundingClientRect();
            // console.log(rect);
            // window.scrollTo({top: rect.top, behaviour: 'smooth'});
        });
        tbody.appendChild(row);
    }
    
}

function updateUserEntry(rfl, username, results) {
    document.getElementById('username').innerText = username + "'s entry";
    let cells = document.getElementsByClassName('user-rider');
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = rfl[username]['entry'][i];
    }
    let positions = document.getElementsByClassName('user-position');
    for (let cell of positions) {
        cell.innerText = '';
    }
    
    cells = document.getElementsByClassName('user-multiplier');
    let userPoints = document.getElementsByClassName('user-points');
    // this code repeated from other calculate function
    let score = 0;
    let perfect = true;
    entry = simplifyEntry(rfl[username]['entry']);
    for (let place = 0; place < results.length; place++) {
        cells[place].classList.remove("incorrect");
        cells[place].classList.remove("perfect-choice");
        cells[place].classList.remove("correct");
        let index = entry.indexOf(simplifyRiderName(results[place])); // if repeated (breaks rfl ules), returns first occurence
        if (index != -1) {
            console.log(multipliers[index]);
            cells[place].innerText = '(x' + multipliers[index].toFixed(1) + ')';
            cells[place].classList.add("correct");
            if (!(place == index || place > 4)) { // !! not quite right when you get down to the 1.0s. wait it is now?
                perfect = false;
            }
            userPoints[place].innerText = (points[place]*multipliers[index]).toFixed(1);
            score += points[place]*multipliers[index];
            if (perfect == true) {
                cells[place].classList.add("perfect-choice");
            }
            positions[index].innerText = place+1;
            positions[index].classList.add('correct');
        } else {
            perfect = false;
            userPoints[place].innerText = '';
            cells[place].innerText = 'X';
            cells[place].classList.add("incorrect");
        }
    }
    document.getElementsByClassName("user-score")[0].innerText = score.toFixed(1);
}

function simplifyRiderName(name) {
    name = name.toLowerCase();
    // remove acutes - https://stackoverflow.com/a/37511463
    // not complete, eg ?
    name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    name = name.replace(/\u0142/g, "l");
    return name;
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
