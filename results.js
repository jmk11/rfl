// !! todo: remove more acutes etc. from rider names
// all-results thing is missing some people - even if their comment wasn't right and they got 0 they should still be listed
// todo?: encode/sanitise reddit content before putting in page - xss
// compress results page url parameters. I haven't found a compression large enough to justify the obfuscation of the url. I could also encode it more efficiently, eg
// ?Julian+Alaphilippe|Wout+Van+Aert|Marc+Hirschi|Michal+Kwiatkowski|Jakob+Fuglsang|Primoz+Roglic|Michael+Matthews|Alejandro+Valverde|Maximilian+Schachmann|Damiano+Caruso|izsgs1%2Frfl_20_wc_rr_15_days_left_until_the_deadline_on

// done?: better case insensitive Predictions removal 
// done: deal with some comments using \r to terminate lines????
// done?: change so it doesn't all continue from one promise call
// done: make the whole row in all-results lead to user update
// done: change toLowerCase() so I can put their original comment in the entry section
// done: use innerText instead of innerHTML for xss reasons, use table insertCell + innerText instead of innerHTML
// done: add var to declarations
// done: allow editing of the result input - or maybe change it to use 2 pages so you can just go back?


let results = [];
let sortedUsernames = []; // to avoid making global, could add searchResults() event using js closure?
let rflEntries = {};
const points = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
const multipliers = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 1.0, 1.0];
const multStrs = ['x2.0)', 'x1.8)', 'x1.6)', 'x1.4)', 'x1.2)', 'x1.0)', 'x1.0)', 'x1.0)'];

main();

async function main() {
	const params = new URLSearchParams(window.location.search);
	results = [params.get('p1'), params.get('p2'), params.get('p3'), params.get('p4'), params.get('p5'), params.get('p6'), params.get('p7'), params.get('p8'), params.get('p9'), params.get('p10')]; // pos1

	updateRaceResult(results);
	results = simplifyEntry(results); // only need the exact rider names for setting the table

	const apiURL = params.get('r') + '/.json?depth=1';
	const raceTitleElem = document.getElementsByClassName('race-title')[0];
	try {
		const resp = await fetch(apiURL, {credentials: 'omit'}); // mode cors?
		if (resp.status != 200) {
			throw Error('Non-200 response status');
		}
		const json = await resp.json();
		const postTitle = json[0]['data']['children'][0]['data']['title'];
		const raceTitle = postTitle.split(']')[1].split(/(predictions|-)/i)[0]; //.trim();
		// title is generally of format: "[RFL 20] Fleche Wallonne Predictions - 1.5 days left until the deadline on September 30th!"
		// raceName = json[0]['data']['children'][0]['data']['title'].split('] ')[1].split(' Predictions')[0]; // Predictions split should be case insensitive
		// const raceTitle = json[0]['data']['children'][0]['data']['title'].split('] ')[1].split(' -')[0].split('Predictions')[0].split('predictions')[0]; // Predictions split should be case insensitive
		// const match = json[0]['data']['children'][0]['data']['title'].match(/](?<race>.*?)(?:predictions|-)/i);
		// const raceTitle = (match && match.groups && match.groups.race) || '';

		raceTitleElem.innerText = raceTitle + ' RFL Results'; // (unofficial)
		// document.getElementsByTagName('title')[0].innerText = raceTitle + ' RFL Results';
		document.title = raceTitle + ' RFL Results';
		processRFL(json[1]['data']['children'], results);
	} catch (err) {
		raceTitleElem.innerText = 'Error with reddit request.';
		console.log(err);
	}
}

// Update text of race result table
function updateRaceResult(results) {
	const cells = document.getElementsByClassName('results-rider');
	console.log(cells);
	for (let i = 0; i < cells.length; i++) {
		cells[i].innerText = results[i];
	}
}

// json: json of reddit comments. results: results array 1st-10th
// only need top level comments
function processRFL(comments, results) {
	rflEntries = loadEntries(comments);
	rflEntries = calculateScores(rflEntries, results);
	sortedUsernames = sortUsernames(rflEntries); // const
	updateResults(rflEntries, sortedUsernames);
	updateUserEntry(rflEntries, sortedUsernames[0], results);
}

// return dictionary of {username : {entry: entry}}
// weird cases test
// this assumes that entries are in order x2.0, x1.8?
function loadEntries(comments) {
	let entries = {};
	for (const comment of comments) {
		const username = comment['data']['author'];
		const body = comment['data']['body'];
		const entry = [];
		const lines = body.split(/[\n\r]/);
		let multIndex = 0;
		console.log(username + ':\n' + body);
		for (let i = 0; i < lines.length && multIndex < multStrs.length; i++) {
			const rider = lines[i].split(multStrs[multIndex])[1];
			if (rider) {
				// entry[multKeys[multIndex]] = rider.trim().toLowerCase();
				entry.push(rider.trim());
				multIndex++;
			}
		}
		console.log(comment['data']['permalink']);
		entries[username] = { 'entry': entry, 'link': comment['data']['permalink'] };

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
	return entries;
}

function calculateScores(rflEntries, results) {
	for (const user of Object.keys(rflEntries)) {
		const entry = simplifyEntry(rflEntries[user]['entry']); // only simplify at this point so that the full version is displayed
		rflEntries[user]['score'] = 0;
		for (let place = 0; place < results.length; place++) {
			const EntryIndex = entry.indexOf((results[place])); // Get index of result rider in entry
			// if a rider is repeated in an entry (breaks rfl rules), returns first occurence
			if (EntryIndex != -1) {
				rflEntries[user]['score'] += points[place] * multipliers[EntryIndex];
			}
		}

		// for (const key of Object.keys(multipliers)) {
		//     if (rfl[user]['entry']['key']
		// }
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

// Update list of all user entries and scores
function updateResults(rflEntries, usernames) {
	// usernames = usernames.filter(u => u.match(/x/i));
	const tbody = document.getElementsByClassName('allresults-tbody')[0];
	let even = false;
	for (let i = 0; i < usernames.length; i++) {
		const row = tbody.insertRow(i);
		// row.setAttribute('username', usernames[i]); // storing this in dom bad?
		row.insertCell(0).innerText = `${i + 1}`; // position in results
		const username = row.insertCell(1); // username
		username.innerText = usernames[i];
		username.classList.add('results-username');
		row.insertCell(2).innerText = rflEntries[usernames[i]]['score'].toFixed(1); // score
		if (even) {
			row.classList.add('even');
		}
		even = !even;

		// username.addEventListener('click', (event) => { // closure for rflEntries
		row.addEventListener('click', () => { // closure for rflEntries
			// bubbles from table cell
			console.log(event.target); // table cell
			// console.log(event.target.parentNode); // row
			// console.log(this);
			const username = row.getElementsByClassName('results-username')[0].innerText; // event.srcElement
			// is it bad to use row, because that means that each event listener will be a different function so a lot of different functions?
			updateUserEntry(rflEntries, username, results);
			document.getElementsByClassName('user-results')[0].scrollIntoView(); // behavior: smooth
		});
	}
}

// Update user entry to display user username's entry and results
function updateUserEntry(rflEntries, username, results) {
	document.getElementById('username').innerText = username + '\'s entry';
	document.getElementById('user-link').href = 'https://reddit.com' + rflEntries[username]['link'];
	// shorter comment link: https://www.reddit.com/comments/izsgs1/g6n6pkl/
	const riderCells = document.getElementsByClassName('user-rider'); // user's entry on left
	for (let i = 0; i < riderCells.length; i++) {
		riderCells[i].innerText = rflEntries[username]['entry'][i];
	}
	const positionCells = document.getElementsByClassName('user-position'); // race positions of user's entered riders on left
	for (const cell of positionCells) {
		cell.innerText = '';
	}

	// Calculate score while setting multiplier and points per rider
	const multiplierCells = document.getElementsByClassName('user-multiplier');
	const userPointsCells = document.getElementsByClassName('user-points');
	// this code repeated from other calculate function
	let score = 0;
	let perfect = true;
	const entry = simplifyEntry(rflEntries[username]['entry']);
	for (let place = 0; place < results.length; place++) {
		const multiplierElem = multiplierCells[place];
		const userPointsElem = userPointsCells[place];

		multiplierElem.classList.remove('incorrect');
		multiplierElem.classList.remove('perfect-choice');
		multiplierElem.classList.remove('correct');
		const entryIndex = entry.indexOf(results[place]); // if repeated (breaks rfl rules), uses first occurence

		if (entryIndex != -1) {
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
	document.getElementsByClassName('user-score')[0].innerText = score.toFixed(1);
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

function searchResults(event) {
	// unHideResults();
	const username = event.target.value;
	// if (username) {
	const re = new RegExp(username, 'i');
	const usernameElems = Array.from(document.getElementsByClassName('results-username'));
	let even = false;
	for (const e of usernameElems) {
		const row = e.parentNode;
		// console.log(e.innerText);
		// console.log(e);
		// console.log(e.innerText.match(re));
		// visibility: collapse seems to remove innerText, while display: none didn't.
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

	// const nonmatching = sortedUsernames.filter(u => !u.match(re));
	// hideResults(nonmatching);
	// console.log(username);
	/* } //else {
			//unHideResults();
		}*/
}

// function setVisibleRows(usernames) {
// 	const usernameElems = Array.from(document.getElementsByClassName('results-username'));
// 	for (const e of usernameElems) {
// 		if 
// 	}
// }

// function hideResults(usernames) {
// 	const usernameElems = Array.from(document.getElementsByClassName('results-username'));
// 	const hideElems = usernameElems.filter(u => usernames.includes(u.innerText)); // intersection
// 	hideElems.forEach(e => e.parentNode.classList.add('hidden')); // doesn't work?
// 	// for (const e of hideElems) {
// 	// 	console.log(e);
// 	// 	e.parentNode.classList.add('hidden');
// 	// }
// }

// function unHideResults() {
// 	const usernameElems = Array.from(document.getElementsByClassName('results-username'));
// 	usernameElems.forEach(e => e.parentNode.classList.remove('hidden'));
// }

// Keep correct position numbers after searching:
// Could delete rows from DOM, and store positions in sortedUsernames array as {name, position}, or get index in sortedUsernames array
//	- Could delete rows but keep elements objects in global list
//	- Could delete rows and recreate them
// Could just hide rows eg with display: none - but this breaks odd/even row css 
// 	- Tried to use :not(.hidden):nth-of-type(even) but it didn't work
//	- Would need more js to manually select the odd rows
