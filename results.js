let results = [];
let sortedUsernames = []; // to avoid making global, could add searchResults() event using js + closure?
let rflEntries = {};
const points = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
const multipliers = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 1.0, 1.0];
const multStrs = ['x2.0)', 'x1.8)', 'x1.6)', 'x1.4)', 'x1.2)', 'x1.0)', 'x1.0)', 'x1.0)'];

main();

async function main() {
	const params = new URLSearchParams(window.location.search);
	results = [params.get('p1'), params.get('p2'), params.get('p3'), params.get('p4'), params.get('p5'), params.get('p6'), params.get('p7'), params.get('p8'), params.get('p9'), params.get('p10')]; // pos1

	updateRaceResult(results);
	results = simplifyEntry(results); // only need the exact rider names for setting the table, so can now replace results with simplified names

	const raceTitleElem = document.getElementById('race-title');
	const apiURL = 'https://www.reddit.com/comments/' + params.get('r') + '/.json?depth=1'; // 'https://www.reddit.com/r/peloton/comments/'
	try {
		const resp = await fetch(apiURL, {credentials: 'omit'}); // mode cors?
		if (resp.status !== 200) {
			throw Error('Non-200 response status');
		}
		const json = await resp.json();
		const postTitle = json[0]['data']['children'][0]['data']['title'];
		const raceTitle = (postTitle.split(']')[1] || postTitle).split(/(predictions|-)/i)[0]; //.trim();
		// title is generally of format: "[RFL 20] Fleche Wallonne Predictions - 1.5 days left until the deadline on September 30th!"
		// const match = json[0]['data']['children'][0]['data']['title'].match(/](?<race>.*?)(?:predictions|-)/i);
		// const raceTitle = (match && match.groups && match.groups.race) || '';

		raceTitleElem.innerText = raceTitle + ' RFL Results'; // (unofficial)
		document.title = raceTitle + ' RFL Results';
		processRFL(json[1]['data']['children'], results);
	} catch (err) {
		raceTitleElem.innerText = 'Error with reddit request.';
		console.error(err);
	}
}

// Fill race result table with rider names
function updateRaceResult(results) {
	const cells = document.getElementsByClassName('results-rider');
	for (let i = 0; i < cells.length; i++) {
		cells[i].innerText = results[i];
	}
}

// comments: json of reddit comments. results: results array 1st-10th
// only need top level comments
function processRFL(comments, results) {
	rflEntries = loadEntries(comments); // parse comments to get an object of {username: {entry, link}}
	rflEntries = calculateScores(rflEntries, results); // Calculate scores of entries and add to object: {username: {entry, link, score}}
	sortedUsernames = sortUsernames(rflEntries); // Get list of usernames sorted by descending score
	updateResults(rflEntries, sortedUsernames);
	updateUserEntry(rflEntries, sortedUsernames[0], results);
}

// return dictionary of {username : {entry: entry}}
// todo weird cases test
// this assumes that entries are in order x2.0, x1.8 - if an entry skips a multiplier, this will get stuck on that multiplier
function loadEntries(comments) {
	let entries = {};
	for (const comment of comments) {
		const username = comment['data']['author'];
		const body = comment['data']['body'];
		const entry = [];
		const lines = body.split(/[\n\r]/);
		let multIndex = 0;
		// console.log(username + ':\n' + body);
		for (let i = 0; i < lines.length && multIndex < multStrs.length; i++) {
			const rider = lines[i].split(multStrs[multIndex])[1];
			if (rider) {
				// entry[multKeys[multIndex]] = rider.trim().toLowerCase();
				entry.push(rider.trim());
				multIndex++;
			}
		}
		let alteredUsername = username;
		for (let i=1; entries[alteredUsername]; i++) {
			alteredUsername = username + ` (${i})`;
		}
		entries[alteredUsername] = { 'entry': entry, 'link': comment['data']['permalink'] };
	}
	return entries;
}

// Calculate score for all entries and fill in score matching username in rflEntries object
function calculateScores(rflEntries, results) {
	for (const user of Object.keys(rflEntries)) {
		const entry = simplifyEntry(rflEntries[user]['entry']); // only simplify at this point so that the full version is displayed
		rflEntries[user]['score'] = 0;
		for (let place = 0; place < results.length; place++) {
			const entryIndex = entry.indexOf((results[place])); // Get index of result rider in entry
			// if a rider is repeated in an entry (breaks rfl rules), returns first occurence
			if (entryIndex !== -1) {
				rflEntries[user]['score'] += points[place] * multipliers[entryIndex];
			}
		}
	}
	return rflEntries;
}

// Return list of usernames sorted by descending score
function sortUsernames(rflEntries) {
	const usernames = [...Object.keys(rflEntries)];
	usernames.sort((usernameA, usernameB) => { // a comes first if score is higher -> return negative if a is higher
		return rflEntries[usernameB]['score'] - rflEntries[usernameA]['score'];
	});
	return usernames;
}

// Fill list of all user entries and scores
function updateResults(rflEntries, usernames) {
	const tbody = document.getElementById('allresults-tbody');
	let even = false; // for tracking odd/even rows, since setting rows invisible breaks doing it with CSS
	for (let i = 0; i < usernames.length; i++) {
		const row = tbody.insertRow(i);
		// row.setAttribute('username', usernames[i]); // storing this in dom bad?
		row.setAttribute('tabindex', '0');
		row.setAttribute('role', 'button');
		row.insertCell(0).innerText = `${i + 1}`; // position in results
		const username = row.insertCell(1); // username
		username.innerText = usernames[i];
		username.classList.add('results-username'); // so it can be found easily be below event handler
		row.insertCell(2).innerText = rflEntries[usernames[i]]['score'].toFixed(1); // score
		if (even) {
			row.classList.add('even');
		}
		even = !even;
		
		const handleSelection = () => {
			// bubbles from table cell - event.target is table cell. could use event.target.parentNode instead of row
			const username = row.getElementsByClassName('results-username')[0].innerText; // event.srcElement
			// is it bad to use row, because that means that each event listener will be a different function so a lot of different functions?
			updateUserEntry(rflEntries, username, results);
			document.getElementById('user-entry').scrollIntoView(); // behavior: smooth
		};
		row.addEventListener('click', () => {
			row.blur(); // is this a good idea? for removing :focus style after clicking 
			handleSelection();
		});
		row.addEventListener('keydown', (event) => {
			if (event.code === 'Enter' || event.code === 'Space') {
				event.preventDefault();
				handleSelection();
			}
		});
	}
}

// Update user entry to display user username's entry and results
function updateUserEntry(rflEntries, username, results) {
	document.getElementById('username').innerText = username + '\'s entry';
	document.getElementById('user-link').href = 'https://reddit.com' + rflEntries[username]['link'];
	// shorter comment link: https://www.reddit.com/comments/izsgs1/g6n6pkl/

	// Set rider names in user's entry on left
	const riderCells = document.getElementsByClassName('user-rider');
	for (let i = 0; i < riderCells.length; i++) {
		riderCells[i].innerText = rflEntries[username]['entry'][i];
	}
	// Initialise race positions of user's riders on left
	const positionCells = document.getElementsByClassName('user-position');
	for (const cell of positionCells) {
		cell.innerText = '';
	}

	// Calculate score while setting multiplier and points per rider
	const multiplierCells = document.getElementsByClassName('user-multiplier');
	const userPointsCells = document.getElementsByClassName('user-points');
	// Some score calculation code repeated from calculateScores()
	let score = 0;
	let perfect = true;
	const entry = simplifyEntry(rflEntries[username]['entry']);
	for (let place = 0; place < results.length; place++) { // loop through positions in race result and check if each is in the entry
		const multiplierElem = multiplierCells[place];
		const userPointsElem = userPointsCells[place];

		multiplierElem.classList.remove('incorrect');
		multiplierElem.classList.remove('perfect-choice');
		multiplierElem.classList.remove('correct');
		const entryIndex = entry.indexOf(results[place]);

		if (entryIndex !== -1) {
			multiplierElem.innerText = '(x' + multipliers[entryIndex].toFixed(1) + ')';
			multiplierElem.classList.add('correct');
			if ((place === entryIndex || place > 4) && perfect === true) { // !! not quite right when you get down to the 1.0s. wait it is now?
				multiplierElem.classList.add('perfect-choice');
			} else {
				perfect = false;
			}
			userPointsElem.innerText = (points[place] * multipliers[entryIndex]).toFixed(1);
			positionCells[entryIndex].innerText = place + 1;
			positionCells[entryIndex].classList.add('correct');
			score += points[place] * multipliers[entryIndex];
		} else {
			perfect = false;
			userPointsElem.innerText = '';
			multiplierElem.innerText = 'X';
			multiplierElem.classList.add('incorrect');
		}
	}
	console.assert(score === rflEntries[username]['score'], 'updateUserEntry() score === rflEntries score');
	document.getElementById('user-score').innerText = score.toFixed(1);
}

// Create new list of rider's names, simplified by removing case and acutes etc.
function simplifyEntry(entry) {
	const simpleEntry = [];
	for (const rider of entry) {
		simpleEntry.push(simplifyRiderName(rider));
	}
	return simpleEntry;
}

// Change to lower case and remove acutes etc. from name, eg replacing é with e
function simplifyRiderName(name) {
	name = name.toLowerCase();
	// remove acutes - https://stackoverflow.com/a/37511463
	// not complete, eg ?
	name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	name = name.replace(/\u0142/g, 'l');
	return name;
}

// Hide table rows of results that don't match search term,
// and adjust rows classed as 'even' to keep odd/even row high highlighting correct
// To keep correct position numbers after searching, I am hiding table rows instead of deleting and recreating (and should be faster??)
function searchResults(event) {
	const search = event.target.value;
	// empty search term - everything matches ''
	const re = new RegExp(search, 'i');
	const usernameElems = Array.from(document.getElementsByClassName('results-username'));
	let even = false;
	for (const e of usernameElems) {
		const row = e.parentNode;
		// visibility: collapse seems to remove innerText (display: none didn't)
		// So I'm using textContent here instead.
		if (e.textContent.match(re)) {
			row.classList.remove('hidden');
			if (even) {
				row.classList.add('even');
			} else {
				row.classList.remove('even');
			}
			even = !even;
		} else {
			row.classList.add('hidden');
		}
	}
}
