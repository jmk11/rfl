// !! todo: remove all acutes from rider names
// !! todo: deal with some comments using \r to terminate lines????
// wc itt hoo_ts: incorrect formatting - no x ie just (2.0) - should I accomodate that?
// todo: Predictions removal case insensitive
// todo: add var to declarations
// all-results thing is missing some people - even if their comment wasn't right and they got 0 they should still be listed
// todo: make the whole row in all-results lead to user update
// todo: allow editing of the result input - or maybe change it to use 2 pages so you can just go back?
// todo: encode/sanitise reddit content before putting in page - xss

// done: change toLowerCase() so I can put their original comment in the entry section
// use innerText instead of innerHTML for xss reasons, use table insertCell + innerText instead of innerHTML

let results = []; // why did I make this global
const multipliers = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 1.0, 1.0];
const points = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1];

let form = document.forms.results;
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
        cells[i].innerText = results[i];
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
                raceTitleElem.innerText = raceName + ' RFL Results';
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
    let rfl = {};
    // let i = 0;
    // multipliers = {"x2.0": "2.0", "x1.8": "1.8", "x1.6": "1.6", "x1.4": "1.4", "x1.2": "1.2", "x1.0": "1.0"};
    for (let comment in json) {
        let username = json[comment]['data']['author'];
        let body = json[comment]['data']['body'];
        let entry = [];
        let lines = body.split("\n");
        let multIndex = 0;
        const multStrs = ["x2.0)", "x1.8)", "x1.6)", "x1.4)", "x1.2)", "x1.0)", "x1.0)", "x1.0)"];
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
    let order = []; // get users in sorted order somehow
    let maxscore = 0; // temporary, until sorting is done

    for (let user of Object.keys(rfl)) {
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
        console.log(user);
        console.log(rfl[user]['score']);

        // for (const key of Object.keys(multipliers)) {
        //     if (rfl[user]['entry']['key']
        // }
    }
    const sortedUsernames = sortUsernames(rfl);
    console.log(sortedUsernames);
    writeScores(rfl, sortedUsernames);
    updateUserEntry(rfl, sortedUsernames[0], results);
}

function sortUsernames(rfl) {
    let usernames = [...Object.keys(rfl)];
    usernames.sort(function (usernameA, usernameB) { // a comes first if score is higher -> return negative if a is higher
        return rfl[usernameB]['score'] - rfl[usernameA]['score'];
    });
    return usernames;
}

// not sorted yet
function writeScores(rfl, usernames) {
    let tbody = document.getElementsByClassName("allresults-tbody")[0];
    for (let i = 0; i < usernames.length; i++) {
        // let row = document.createElement("tr");
        // row.innerHTML = `<td>${i+1}</td><td>${usernames[i]}</td><td>${rfl[usernames[i]]['score'].toFixed(1)}</td>`; // xss
        let row = tbody.insertRow(i);
        row.insertCell(0).innerText = `${i+1}`;
        row.insertCell(1).innerText = usernames[i];
        row.insertCell(2).innerText = rfl[usernames[i]]['score'].toFixed(1);

        row.addEventListener('click', (event) => { // declare this as a separate function
            let username = event.target.innerText; // event.srcElement
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
    document.getElementById('username').innerText = username + "'s entry";
    let cells = document.getElementsByClassName('user-rider');
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = rfl[username]['entry'][i];
    }
    
    cells = document.getElementsByClassName('user-multiplier');
    let userPoints = document.getElementsByClassName('user-points');
    // this code repeated from other calculate function
    let score = 0;
    let perfect = true;
    let lcEntry = [];
    for (const rider of rfl[username]['entry']) {
        lcEntry.push(rider.toLowerCase());
    }
    for (let place = 0; place < results.length; place++) {
        cells[place].classList.remove("incorrect");
        cells[place].classList.remove("perfect-choice");
        cells[place].classList.remove("correct");
        let index = lcEntry.indexOf(results[place].toLowerCase()); // if repeated (breaks rfl ules), returns first occurence
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
        } else {
            perfect = false;
            userPoints[place].innerText = '';
            cells[place].innerText = 'X';
            cells[place].classList.add("incorrect");
        }
    }
    document.getElementsByClassName("user-score")[0].innerText = score.toFixed(1);
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